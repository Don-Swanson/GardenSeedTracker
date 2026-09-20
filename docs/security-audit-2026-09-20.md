# Security audit — September 20, 2026

## Scope and method

Reviewed the dependency lockfile, authentication/session callbacks, admin and impersonation endpoints, API-key authentication, browser mutation protection, seed/planting/wishlist ownership checks, authentication redirects, email HTML generation, raw SQL usage, and Docker/CI configuration. Ran dependency auditing, targeted regression tests, the existing catalog/email tests, lint, type checking, and production-build validation.

A limited credential-pattern scan of 145 tracked text files found no matching private-key blocks, GitHub tokens, AWS access keys, or Stripe live keys. This does not cover git history, untracked configuration, deployment secrets, or every credential format. No production service was probed and no production data was changed.

## Findings fixed

| Severity | Finding | Resolution and regression coverage |
| --- | --- | --- |
| High | Authentication callback pages passed an untrusted `callbackUrl` to `router.push`, allowing script schemes or external destinations. | All authentication pages use a shared local-path validator; tests reject script/data schemes, protocol-relative URLs, backslashes, and control characters. |
| High | JWTs retained their initial admin role after an administrator was demoted or deleted. | Every server session read rechecks account existence and role. Deleted-account sessions are rejected; a database-backed test verifies demotion and deletion with an existing token. |
| High | Custom cookie-authenticated mutation endpoints lacked a consistent origin check. SameSite cookies alone do not separate hostile same-site subdomains. | The proxy validates mutation origins against `NEXTAUTH_URL`, rejects cross-site fetch metadata, and requires origin evidence for cookie requests. It runs before NextAuth's `/api/auth/*` middleware bypass. Header-authenticated non-browser clients remain supported. |
| Medium | Impersonation trusted unsigned JSON cookies and client-side expiry; cookie changes could bypass intended impersonation restrictions. | Cookies are HMAC-signed, tied to the current admin, and expire server-side after one hour. Target accounts are fetched again and administrators cannot be impersonated. Tests cover tampering, different admins/secrets, legacy cookies, and expiry. |
| Medium | Planting creation/update accepted another user's garden-location ID, which can expose linked location data through seed details. | Both mutations check location ownership. Route tests verify rejection without changing the planting and verify ordinary own-location creation. |
| Medium | Wishlist updates accepted unsafe URL schemes even though creation validated URLs. | Updates now use the same HTTP(S) URL sanitizer; a route test verifies a script URL is removed. |
| Medium | Planting reminder emails inserted names and varieties directly into HTML. | The extracted renderer encodes text and quoted attributes. Regression tests cover malicious markup. |
| Medium | Admin API credentials could be sent in URLs and leak through logs/history. | Query-string credentials are rejected; Authorization headers remain supported with Node's timing-safe comparison. Tests cover both paths. |
| Medium | Docker exclusions covered selected environment/database filenames but not every `.env` variant or SQLite extension. | The build context excludes all `.env*`, `.sqlite`, and `.sqlite3` files in addition to the existing private-data exclusions. |

## Dependency and runtime decisions

- Node 24 LTS replaces Node 20 in Docker and CI; `.nvmrc` and package engine metadata identify the supported runtime. Node 20 is listed as end-of-life in the [Node release documentation](https://nodejs.org/en/about/eol).
- Prisma client and CLI are both pinned to 6.19.3. The original Prisma 7 update changed only the CLI and required a schema/configuration/driver migration. Retaining the patched compatible major avoids changing database storage behavior in this update. See the [Prisma 7 migration guide](https://docs.prisma.io/docs/orm/v6/more/upgrades/to-v7).
- Prisma's `deepmerge-ts` dependency is overridden to patched 8.x. The affected API can exhaust the stack on recursive object graphs; plain JSON alone does not create that condition. See [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Prisma generation and database migrations are included in verification of this override.
- TypeScript 6.0.3 replaces unsupported TypeScript 7 for compatibility with typescript-eslint. ESLint 9.39.5 is retained because ESLint 10.11.0 failed with the Next.js parser (`scopeManager.addGlobals is not a function`). These major upgrades remain deferred until the toolchain supports them together.
- Compatible minor/patch dependencies are refreshed, bcryptjs supplies its own types, and Nodemailer types are updated. React/Tailwind/Zod and other unrelated major migrations are not forced solely to match latest-version labels.
- Prisma and tsx are production dependencies because container startup uses them for migrations and imports. The image now copies a complete pruned production dependency tree, fixing a missing Prisma configuration dependency discovered by the redeployment test.
- Dependabot groups the Prisma client/CLI and defers the known incompatible Prisma, TypeScript, ESLint, and Node-types major upgrades; compatible security/minor/patch updates remain enabled.
- New lint diagnostics are addressed for component identity, declaration order, and redirects. The optional `set-state-in-effect` rule is disabled for existing form synchronization patterns; runtime Rules of Hooks checks remain enabled. Impersonation navigation retains full reloads to discard the previous identity's cached data.

## Operational follow-up and limits

- Enforce shared rate limits and request-body size limits at the trusted reverse proxy, especially for magic-link email requests and anonymous signup metadata. Existing in-process limits are not a distributed abuse-control system.
- Bootstrap the first administrator before exposing a fresh installation publicly; automatic first-user administration remains the application's existing behavior.
- Use HTTPS, set `NEXTAUTH_URL` to the public origin, protect/rotate `NEXTAUTH_SECRET`, `ADMIN_API_KEY`, SMTP and cron credentials, and avoid logging credential-bearing URLs. Existing query-key integrations must migrate to Authorization headers. Old impersonation cookies are invalidated and require starting impersonation again.
- This is a targeted source/dependency audit, not a penetration test or a guarantee that the application is free of vulnerabilities. Deployment configuration, full git-history secret scanning, and external identity/email services were not audited.

## Validation

- Dependency audit after compatibility fixes: **zero known vulnerabilities**.
- Security regression suite: **12 tests passed**, including real disposable-database ownership and session tests.
- Existing catalog suite: **15 tests passed**; email transport integration: **1 test passed**.
- Lint with zero warnings, TypeScript checking, and the Webpack production build passed under Node 24.
- Docker/Turbopack production build and all six persistence checks passed from an isolated checkout: missing-volume rejection, protected-page authentication, initial seeding, replacement with every row/column preserved, repeat-seed preservation, and backup restore.
- GitHub reported no open CodeQL or Dependabot alerts at audit time.
- The final install, 28 tests, lint, type checking, image build, and persistence checks were repeated in an isolated checkout excluding unrelated in-progress plant-deletion edits.
