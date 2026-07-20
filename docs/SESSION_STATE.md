# Session state

Updated: 2026-07-19

## Completed and validated

- Fabio approved the Vertical 2 product review gate.
- The public repository is configured at
  `https://github.com/fabiorosa/caselane.git` on `master`.
- CL-Q101 replaced artificial public copy with natural US English and added
  regression coverage for metadata and seeded presentation text.
- Vertical 1 delivers the deterministic Orbit Labs workspace, operational
  overview, client management, case intake, queue, workroom, lifecycle,
  messaging, and activity history.
- Vertical 2 delivers the separate Client portal, request submission, shared
  client-visible conversation, and database-boundary exclusion of INTERNAL
  content.
- One-click demo sessions work for Owner, Team member, and Client without
  rendering or transmitting a shared password.
- Overview metrics are accessible links to the corresponding filtered queues.
- CL-V301 delivers tenant-scoped Settings, PostgreSQL rate limits, structured
  redacted logs, security headers, safe health degradation, production cookie
  checks, secret scanning, and responsive/accessibility hardening.
- CL-V302 delivers disposable fresh-database migration verification, mandatory
  PostgreSQL CI, provider-neutral preview smoke, and Playwright walkthroughs for
  Owner, Team member, Client, mobile, keyboard, shared replies, and INTERNAL
  privacy.
- The latest complete gate passed: 48 Vitest files, 114 tests, four Chromium
  walkthroughs, migration consistency, fresh migration, preview smoke, lint,
  secret scan, and production build.
- The local application is running on port 3108 and PostgreSQL on 55432.

## Active ticket

CL-V303: public documentation, deployment, evidence, HTTPS, domain, and tagged
release.

Completed within CL-V303:

- final README with architecture, tradeoffs, walkthrough, known limits, and
  AI-assisted development disclosure;
- deployment and operations runbook;
- deterministic desktop/mobile screenshots and Owner walkthrough video;
- canonical domain decision: `caselane.fabioux.com`;
- recommended initial topology: Vercel Hobby plus Neon Free;
- `.env.example` restored as a tracked public template;
- MIT license.

## Remaining release work

1. Commit and push the validated local release candidate.
2. Confirm GitHub Actions is green on the public branch.
3. Create Neon and Vercel production resources and configure secrets.
4. Run production migrations and the guarded demo reset.
5. Verify the provider deployment with `npm run test:preview`.
6. Attach `caselane.fabioux.com`, verify DNS and HTTPS, then repeat smoke and the
   three-role walkthrough.
7. Mark CL-V303 complete, publish the release tag, and use the canonical URL in
   the portfolio.

## Constraints that remain fixed

- Never use port 3000. CaseLane uses 3108 and PostgreSQL uses 55432 locally.
- PostgreSQL is the source of truth; tenant isolation is enforced server-side.
- Public documentation and product copy use natural US English.
- The interface uses the existing restrained dark system with one accent and no
  emoji.
- Work one backlog ticket at a time and do not mark a release gate complete from
  source inspection alone.

## Known operational boundaries

- The local PostgreSQL credentials are `caselane/caselane`; generic
  `postgres/postgres` credentials do not apply.
- Rebuilds and the development server must not write the same `.next` directory
  concurrently. Stop the listener on 3108 before a production build, then
  restart it.
- The demo reset requires `ALLOW_DEMO_RESET=true`, a configured database, and a
  12+ character demo password. It replaces only the deterministic organization
  explicitly marked as demo data.
- Final Vercel, Neon, DNS, and GitHub release actions require the corresponding
  authenticated accounts. No provider credentials belong in this repository.
