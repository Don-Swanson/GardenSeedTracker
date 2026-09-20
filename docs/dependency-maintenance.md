# Dependency maintenance

Use the committed lockfile and `npm ci`, including in Docker. Do not bypass peer checks with force or legacy-peer-deps. Run audit, lint, catalog and email tests, and production/Docker builds before merging dependency updates.

NextAuth 4.24.15 and the installed Auth.js core still declare Nodemailer 7 peers. That branch has current security advisories. The root dependency stays on patched Nodemailer 9; package overrides explicitly resolve those auth packages to the root version. This is a deliberate compatibility override, not upstream-certified support. The SMTP regression test invokes NextAuth's actual email provider against an isolated local mail server. Remove the overrides when supported peer ranges include the patched release, and rerun the test when either authentication or mail packages change.

The Security and quality workflow checks dependency installation, moderate-or-higher audit findings, zero-warning lint, tests, and builds. Dependabot groups minor/patch updates while major updates stay separate. Repository owners should make this workflow required in branch protection before merging dependency PRs; the workflow alone cannot prevent an unchecked merge.

Provider collection, import credentials, caches, enrichment data and automations remain private. These public workflows only check the application and synthetic test fixtures; they never collect provider data or import into production.
