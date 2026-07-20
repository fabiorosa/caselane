# Deployment and operations

## Recommended topology

- Next.js application: Vercel Hobby under Fabio's personal account.
- PostgreSQL: Neon Free in the region closest to the Vercel functions.
- Canonical URL: `https://caselane.fabioux.com`.
- Provider URL: retained as a deployment fallback, not used as the public
  portfolio link.

This topology fits a personal, non-commercial portfolio and preserves the
application's standard Next.js and PostgreSQL boundaries. Neither provider is a
domain dependency: the app can move to any Node-compatible host and PostgreSQL
service.

## Production environment

Configure these values in the hosting dashboard. Never commit their values.

| Variable | Production contract |
| --- | --- |
| `DATABASE_URL` | Pooled TLS PostgreSQL connection string |
| `APP_URL` | `https://caselane.fabioux.com` |
| `SESSION_SECRET` | Random value with at least 32 characters |
| `DEMO_ACCESS_ENABLED` | `true` for the portfolio deployment |
| `ALLOW_DEMO_RESET` | Set only in the protected reset job |
| `DEMO_PASSWORD` | Set only where migrations/reset automation runs |

Preview deployments should use an isolated database branch or keep demo access
disabled. A preview must never mutate the production demo database by default.

## First release order

1. Create the managed PostgreSQL project and copy its pooled TLS URL.
2. Run `DATABASE_URL=... npm run db:migrate` from a trusted release environment.
3. Seed the fictional dataset with `ALLOW_DEMO_RESET=true`, a strong
   `DEMO_PASSWORD`, and `npm run demo:reset`.
4. Import the GitHub repository into Vercel and configure the production values.
5. Deploy and run `PREVIEW_URL=https://... npm run test:preview`.
6. Complete the documented Owner, Team member, and Client walkthrough.
7. Attach `caselane.fabioux.com` to the Vercel project.
8. Add the exact CNAME shown by Vercel in the DNS provider for `fabioux.com`.
9. Wait for DNS verification and automatic certificate issuance, then rerun the
   smoke suite against the canonical HTTPS URL.
10. Publish the Git tag only after source, production, and evidence agree.

## Health and logs

`GET /api/health` returns `200` only when PostgreSQL is reachable and returns a
safe `503` otherwise. Both responses include `x-request-id` and `no-store`.
External monitoring should check the canonical URL every five minutes and alert
only after two consecutive failures, avoiding noise during a brief cold start.

Application logs are single-line JSON with correlation context and redacted
sensitive keys. On the free Vercel plan, runtime log retention is short; use the
request ID to diagnose a reported failure promptly. A paid log drain or error
monitoring adapter is a later operational upgrade, not implied by this release.

## Demo reset, backup, and recovery

- Reset the shared demo daily and after any public event that attracts sustained
  traffic.
- The reset command is not exposed over HTTP. It requires an explicit deployment
  flag and only replaces the known organization marked as demo data.
- Neon Free provides short-window restore capability, but the fictional demo is
  recoverable from the deterministic seed script and migrations.
- Do not store real client data in the portfolio deployment.
- Before a schema change, verify migrations against an empty database and create
  a managed restore point when the provider supports it.

## Rollback

Promote the previous healthy Vercel deployment if application behavior regresses.
Database migrations in this release are additive; do not roll them back by
dropping production data. Restore forward with a corrective migration. If the
database is unavailable, keep the health endpoint degraded and do not mask the
failure with stale browser data.

## Release checklist

- GitHub Actions is green on the release commit.
- Secret scan reports no sensitive files or tokens.
- Fresh migrations, all PostgreSQL tests, Playwright, and production build pass.
- Demo Owner, Team member, and Client entry points work without a password.
- A Client request and reply appear in the internal workroom.
- INTERNAL content is absent from portal HTML and the browser-visible response.
- Health, security headers, HTTPS, and the canonical domain pass smoke checks.
- README links, screenshots, known limits, and release tag match production.
