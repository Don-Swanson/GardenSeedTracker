# Plant catalog and persistent deployments

## Persistent database behavior

The application database is never recreated during normal startup. The container requires a persistent mount at `/app/data`, creates a SQLite online backup, applies checked-in migrations, and runs the seed through an empty-database guard.

The guard checks every application table, including users, settings, plants, inventory, reminders, and audit logs. If any table contains a row, seeding is skipped. Starter plants and an optional catalog are inserted together in one transaction only when the entire database is empty. A failed seed rolls back completely.

Keep the same data mount, environment configuration, and `NEXTAUTH_SECRET` across deployments. Set `GST_DATA_DIR` to the existing data directory's absolute host path when the deployment checkout can change. Do not delete the data directory to resolve permissions; UID/GID 1001 must be able to write it.

SQLite deployments require persistent storage and a single application replica. Startup backups are stored under `<GST_DATA_DIR>/backups/`; copy them to protected off-host storage under an appropriate retention policy.

## Backup and restore

Create a local backup with:

```sh
python3 scripts/database/backup.py /absolute/path/garden.db /absolute/path/garden-backup.db
```

Inside the production container:

```sh
docker compose exec app sqlite3 /app/data/garden.db ".timeout 30000" ".backup '/app/data/backups/before-catalog-import.db'"
```

Use a new backup filename each time. To restore, stop the application, preserve the failed database and its `-wal` and `-shm` files together, put the verified backup at the original path, ensure UID/GID 1001 can write it, and start the matching application version.

## Catalog exchange format

Collectors produce a source-neutral JSON document:

```json
{
  "schemaVersion": 1,
  "manifest": {
    "complete": true,
    "expectedRecords": 100,
    "exportedRecords": 100,
    "failures": []
  },
  "records": []
}
```

Each record carries a provider name, stable provider ID, public HTTPS source page, retrieval time, license or permission label, and source evidence. API secrets must never appear in source URLs, output, logs, checkpoints, or raw evidence.

The importer validates the entire document before writing. It matches exact source identity first and normalized scientific name second. It never merges on a common name alone. Distinct taxa with the same display name receive a scientific-name suffix. Ambiguous matches are reported for review.

The current version can attach one provider record directly to each plant. The multi-source design in [the Perenual import plan](perenual-import-plan.md) moves provenance into related records before providers are blended.

## Import into an existing database

Set an absolute SQLite URL and apply migrations:

```sh
export DATABASE_URL=file:/absolute/path/garden.db
npm run db:deploy
```

Preview, then apply the reviewed export:

```sh
npm run catalog:import -- --file data/catalog/catalog.json
npm run catalog:import -- --file data/catalog/catalog.json --apply
npm run catalog:import -- --file data/catalog/catalog.json --apply --fill-missing
```

Imports are transactional. Add mode skips matched plants. `--fill-missing` fills blank fields while preserving nonempty curated values, IDs, approval state, inventory, and relationships. Exit code 2 reports identity conflicts; exit code 1 reports an error.

For an empty first installation, place a complete export in the persistent mount and set `GST_CATALOG_PATH=/app/data/catalog.json`. An existing database ignores this setting.

## Remote API import

Deploy the migrations and `/api/v1/admin/plants/import` endpoint, then set a random `ADMIN_API_KEY` in the server's private environment. On the uploader computer, create an ignored, mode-0600 environment file:

```dotenv
GST_API_URL=https://gardenseedtracker.com
ADMIN_API_KEY=your-private-import-key
```

Preview and apply with Node 20.12 or newer:

```sh
node --env-file=.env.import.local --import tsx scripts/catalog/import-api.ts --file data/catalog/catalog.json
node --env-file=.env.import.local --import tsx scripts/catalog/import-api.ts --file data/catalog/catalog.json --apply
```

The uploader requires a manifest proving the export is complete. `--allow-partial` permits an explicitly incomplete sample for testing. It uses bounded batches, HTTPS, retry backoff, and durable checkpoints. Each applied request has an audit receipt committed in the same transaction as its plant changes, so retrying the same request ID cannot duplicate writes.

An “API key authentication is not configured” response means `ADMIN_API_KEY` is missing on the server. HTTP 401 means the supplied key is missing or does not match. An unsupported-capabilities response means the import endpoint has not been deployed.

## Verification

```sh
npm run test:catalog
npx tsc --noEmit
npm run build
```

The optional container integration test uses only temporary data and a synthetic catalog:

```sh
docker build -t gst-catalog-test:local .
node tests/catalog/redeploy.mjs
```
