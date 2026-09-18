// Explicit integration test: uses only a new temporary directory and uniquely named containers.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout } from 'node:timers/promises'

const image = process.argv[2] || 'gst-catalog-test:local'
const directory = mkdtempSync(join(tmpdir(), 'gst-redeploy-'))
const name = `gst-redeploy-${process.pid}`
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 })
const js = code => docker('exec', name, 'node', '-e', code)
const snapshot = () => js(`const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{const names=await p.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations' ORDER BY name");const all={};for(const {name} of names)all[name]=await p.$queryRawUnsafe('SELECT * FROM "'+name+'" ORDER BY rowid');const serialized=JSON.stringify(all,(_,v)=>typeof v==='bigint'?v.toString():v);console.log(JSON.stringify({plants:all.PlantingGuide.length,hash:require('crypto').createHash('sha256').update(serialized).digest('hex')}));await p.$disconnect()})().catch(e=>{console.error(e);process.exit(1)})`)
const stop = () => { spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' }) }
async function start(catalogPath) {
  docker('run', '-d', '--name', name, '--mount', `type=bind,src=${directory},dst=/app/data`,
    '-e', 'NEXTAUTH_SECRET=isolated-persistence-test-only', '-e', 'NEXTAUTH_URL=http://localhost:3000',
    '-e', `GST_CATALOG_PATH=${catalogPath}`, image)
  for (let attempt = 0; attempt < 60; attempt++) {
    if (docker('inspect', '--format', '{{.State.Running}}', name).trim() !== 'true') {
      throw new Error(docker('logs', name))
    }
    const result = spawnSync('docker', ['exec', name, 'node', '-e', "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"])
    if (result.status === 0) return
    await setTimeout(1000)
  }
  throw new Error('Container readiness timeout: ' + docker('logs', name))
}
try {
  chmodSync(directory, 0o777) // Only this isolated temporary directory is shared with container UID 1001.
  const records = Array.from({ length: 60 }, (_, index) => ({
    name: `Synthetic plant ${index + 1}`, scientificName: `Exemplum plantus ${index + 1}`, category: 'other',
    sourceName: 'GST integration test', sourceId: String(index + 1), sourceUrl: `https://example.test/plants/${index + 1}`,
    sourceRetrievedAt: '2026-09-13T00:00:00Z', sourceData: JSON.stringify({ synthetic: true }),
  }))
  writeFileSync(join(directory, 'catalog.json'), JSON.stringify({ schemaVersion: 1, manifest: { complete: true, expectedRecords: records.length, exportedRecords: records.length, failures: [] }, records }))
  const unmounted = spawnSync('docker', ['run', '--rm', image], { encoding: 'utf8' })
  assert.notEqual(unmounted.status, 0)
  assert.match(unmounted.stderr, /persistent host directory or Docker volume/)
  console.log('PASS: startup rejects missing persistent mount')
  await start('/app/data/catalog.json')
  const unauthenticated = JSON.parse(js(`(async()=>{const r=await fetch('http://127.0.0.1:3000/calendar',{redirect:'manual'});console.log(JSON.stringify({status:r.status,location:r.headers.get('location')}))})().catch(e=>{console.error(e);process.exit(1)})`))
  assert.equal(unauthenticated.status, 307)
  assert.ok(new URL(unauthenticated.location).pathname === '/auth/signin')
  console.log('PASS: proxy requires authentication for the calendar')
  js(`const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();(async()=>{const plant=await p.plantingGuide.findFirstOrThrow();await p.plantingGuide.update({where:{id:plant.id},data:{notes:'USER EDIT: keep across deployments'}});await p.user.create({data:{email:'persistence@example.test',settings:{create:{zipCode:'55555',reminderLeadDays:19}},seeds:{create:{plantTypeId:plant.id,nickname:'Preserve linked inventory'}}}});await p.adminNotificationSettings.create({data:{adminEmail:'persistence@example.test',weeklyDigest:false}});await p.$disconnect()})().catch(e=>{console.error(e);process.exit(1)})`)
  const before = snapshot()
  const data = JSON.parse(before)
  assert.ok(data.plants >= records.length)
  console.log(`PASS: empty installation seeded ${data.plants} plants and supports linked inventory/settings`)
  stop()
  // A populated database must ignore a missing optional seed catalog.
  await start('/app/data/nonexistent-catalog.json')
  assert.match(docker('logs', name), /seeding skipped/)
  assert.equal(snapshot(), before)
  console.log('PASS: container replacement preserves every application row and column')
  docker('exec', name, 'node', 'node_modules/tsx/dist/cli.mjs', 'prisma/seed.ts')
  assert.equal(snapshot(), before)
  console.log('PASS: explicit repeat seed preserves every row')
  const backup = readdirSync(join(directory, 'backups')).find(file => file.endsWith('.db'))
  assert.ok(backup)
  assert.equal(docker('exec', name, 'sqlite3', `/app/data/backups/${backup}`, 'PRAGMA quick_check;').trim(), 'ok')
  // Restore the backup with the test app stopped, then compare every application row.
  stop()
  copyFileSync(join(directory, 'backups', backup), join(directory, 'garden.db'))
  await start('/app/data/nonexistent-catalog.json')
  assert.equal(snapshot(), before)
  console.log('PASS: startup backup restores all application data')
} finally {
  stop()
  rmSync(directory, { recursive: true, force: true })
}
