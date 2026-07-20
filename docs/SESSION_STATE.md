# Session state

Updated: 2026-07-20

## Completed and validated

- Fabio approved the Vertical 2 product review gate.
- The public repository is configured at
  `https://github.com/fabiorosa/caselane.git` on `master`.
- CL-Q101 replaced artificial public copy with natural US English and added
  regression coverage for metadata and seeded presentation text.
- CL-Q104 replaces static loading blocks with structured workspace and portal
  skeletons across 16 database-backed routes, adds pending feedback to demo,
  lifecycle, and archive actions, and removes skeleton motion under the user's
  reduced-motion preference.
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
- The latest complete gate passed: 49 Vitest files, 117 tests, four Chromium
  walkthroughs, migration consistency, fresh migration, preview smoke, lint,
  secret scan, and production build.
- The local application is running on port 3108 and PostgreSQL on 55432.
- The public deployment is live at `https://caselane.vercel.app` on Vercel
  Hobby with Neon Free PostgreSQL 17.
- Production migrations and the guarded deterministic reset completed; the
  Orbit Labs public demo contains 12 fictional cases.
- Live production checks passed for anonymous protected-route redirect, Owner,
  Team member, Client portal, internal workroom, actionable overview metrics,
  and server-side exclusion of INTERNAL notes from the portal.

## Release state

CL-V303 is complete. The portfolio release uses
`https://caselane.vercel.app` as its canonical public address.

Completed within CL-V303:

- final README with architecture, tradeoffs, walkthrough, known limits, and
  AI-assisted development disclosure;
- deployment and operations runbook;
- deterministic desktop/mobile screenshots and Owner walkthrough video;
- canonical release address and managed HTTPS at `caselane.vercel.app`;
- recommended initial topology: Vercel Hobby plus Neon Free;
- `.env.example` restored as a tracked public template;
- MIT license;
- public `SECURITY.md` covering the intentional passwordless demo flow,
  authorization boundaries, verification gates, known limits, and private
  vulnerability reporting guidance;
- Vercel production project, Neon database, production migrations, demo reset,
  server environment, and `caselane.vercel.app` HTTPS deployment.

## Optional post-release presentation work

- Attach `caselane.fabioux.com` after the parent domain hosting is reorganized,
  update `APP_URL`, and rerun the documented production smoke before changing
  portfolio links. This does not block or change the current release scope.

## Completed post-release work

- CL-Q111 adds one shared 200 ms resolved-route entrance across the workspace
  and Client portal while explicitly excluding skeleton fallbacks. Fourteen
  pending action paths now use one shared inline SVG indicator, action-specific
  text, disabled protection, stable geometry, and busy semantics. Reduced
  motion removes route entrance, shimmer, spinner rotation, and nonessential
  transitions without hiding state. Normal and reduced-motion E2E checks, real
  browser computed-style review, all 129 PostgreSQL tests, six Chromium checks,
  lint, secret scan, and production build passed.

- CL-Q105 expands six action-free record collections into complete native link
  targets: case list, case board, client directory, overview activity, client
  case history, and Client portal requests. Action-bearing rows remain
  unchanged. The real-browser desktop/mobile gate, 120 PostgreSQL tests, four
  Chromium walkthroughs, lint, secret scan, and production build passed.
- CL-Q106 makes status chips readable across the queue and workroom with white
  text and deliberate padding, confirms the complete-row navigation audit, and
  adds restrained active and focus feedback for rows, lifecycle actions, and
  message composition. Reduced-motion behavior remains global. Real desktop and
  375 px browser checks, all 121 PostgreSQL tests, four Chromium walkthroughs,
  lint, secret scan, and the production build passed.
- CL-Q107 replaces every remaining native product select with PremiumSelect:
  Client status, all Case queue filters, and inline Team role editing. The
  component now supports Enter and Space selection. Real desktop and 375 px
  browser checks, all 123 PostgreSQL tests, four Chromium walkthroughs, lint,
  secret scan, and the production build passed.
- CL-Q108 repairs the Client and Case filter cascade that incorrectly painted
  nested PremiumSelect controls as amber actions. Only direct submit buttons
  receive CTA styling; the approved dark component remains unchanged. Actual
  closed and open browser states, all 124 PostgreSQL tests, four Chromium
  walkthroughs, lint, secret scan, production build, and local production
  health passed.
- CL-Q109 repairs the lifecycle primary-action hover cascade. Close, Resolve,
  and every final status action retain dark-on-amber contrast through the hover
  transition, while secondary actions stay neutral. The preventive cascade
  test, real browser checks, all 125 PostgreSQL tests, four Chromium
  walkthroughs, lint, secret scan, production build, and local production
  health passed.
- CL-Q110 turns each accepted Team member row into one complete native profile
  link while keeping pending invitations non-navigable around their revoke
  action. Desktop far-edge navigation and the 390 px layout were exercised in
  a real browser. All 125 PostgreSQL tests, four Chromium walkthroughs, lint,
  secret scan, production build, and local production health passed.

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
