# V1 test strategy

## Test pyramid

### Unit tests

Pure domain behavior:

- case transition matrix and timestamp consequences;
- role capability checks;
- input normalization and validation;
- cursor encode/decode;
- case number formatting;
- token hashing helpers;
- safe error mapping.

### Integration tests

Run against an isolated PostgreSQL database with migrations applied:

- owner registration transaction;
- sign in, session lookup, rotation, expiry, and sign out;
- invitation lifecycle;
- organization and client tenant isolation;
- last-owner invariant;
- client and contact management;
- atomic case sequence allocation;
- case create/update/status/message/activity transactions;
- portal query exclusion of internal notes;
- dashboard aggregate accuracy;
- pagination stability.

Each integration test creates its own organization fixtures and cleans through
transaction rollback or isolated schema. Tests must not depend on execution
order.

### Component tests

Use Testing Library for behavior that is difficult to prove through service
tests alone:

- auth and domain forms preserve input and show field errors;
- visibility mode in case composer is unmistakable;
- filter controls synchronize with URL state;
- modal focus and keyboard behavior;
- empty, permission, and error states.

### End-to-end tests

Use Playwright only after the main vertical slices work. Required scenarios:

1. register owner and land in empty workspace;
2. create client and contact;
3. invite and accept a member;
4. create, triage, assign, message, resolve, and close a case;
5. client submits and replies through portal;
6. internal note is absent from portal DOM and network response;
7. unauthorized cross-tenant URLs do not expose records;
8. demo accounts complete the public walkthrough;
9. critical lifecycle on mobile viewport;
10. critical lifecycle using keyboard navigation.

## CI gates

Every pull request must pass:

- dependency install from lockfile;
- lint;
- TypeScript through production build;
- unit and integration tests;
- migration consistency check;
- production build.
- repository secret scan with `npm run security:secrets`.

E2E may run after deploy preview when infrastructure is configured. A failing
required test blocks milestone completion.

## Manual release checklist

- Fresh database migrates from zero.
- Seed command is idempotent or explicitly resets only the demo database.
- No private or real customer data appears.
- All four roles tested with seeded accounts.
- Search, filters, pagination, empty states, errors, and mobile layouts checked.
- Internal notes cannot be observed through portal HTML, source, or requests.
- Session cookie flags verified in production.
- Health route behaves correctly with database available and unavailable.
- No secrets or localhost URLs in client bundles.
- README commands work from a fresh clone.

## CL-V301 hardening evidence

Validated on 2026-07-19 against PostgreSQL on port `55432` and the real Next.js
application on port `3108`:

- organization and category settings enforce owner/admin/member permissions and
  reject cross-tenant mutations;
- public authentication and team invitations use opaque-key PostgreSQL rate
  limits with expired-window cleanup;
- the health route returns a safe `200` response when PostgreSQL is reachable,
  while response-level tests prove the safe `503` degradation contract;
- CSP, frame, content-type, referrer, opener, and permissions headers are present
  on live responses; the CSP also preserves the App Router bootstrap;
- the production session cookie is HTTP-only, Secure, SameSite=Lax, scoped to
  `/`, and expires after 30 days;
- Settings was exercised as Owner at 1280px and at a 390px mobile viewport with
  no page overflow, then checked as read-only through authorization tests;
- `npm run security:secrets`, the full PostgreSQL suite, lint, and the production
  build are release gates.

## CL-V302 release walkthrough

The release harness deliberately separates the two runners: Vitest collects
only `src/**/*.test.ts`, while Playwright collects `e2e/`. The required commands
are:

- `npm run db:check` for migration journal consistency;
- `npm run test:migrations` to create a disposable database, apply every
  migration from zero, verify required tables, and remove the database;
- `npm run test:postgres` with `TEST_DATABASE_URL` set, so database suites cannot
  disappear behind optional skips in CI;
- `npm run test:e2e` for Owner, Team member, Client, mobile, privacy, and keyboard
  walkthroughs;
- `PREVIEW_URL=https://... npm run test:preview` for provider-neutral health,
  sign-in, and security-header smoke checks.

GitHub Actions provisions PostgreSQL 17 on host port `55432`, migrates and seeds
the deterministic demo, runs all PostgreSQL tests, builds the application,
installs Chromium, and executes the Playwright suite.

## CL-Q111 motion verification

Motion acceptance combines source-level prevention with observable browser
behavior. `src/loading-experience.test.ts` protects the shared resolved-content
boundary, excludes loading fallbacks, inventories every `useFormStatus`
consumer, and verifies the reduced-motion contract. `e2e/motion.spec.ts` checks
the computed 200 ms route entrance, holds one real server-action request inside
the test to observe honest busy and spinner states, and repeats the contract in
a browser context that requests reduced motion. The delay exists only in the
test interceptor and is never shipped to the product. Playwright uses one worker
because the walkthroughs deliberately mutate one shared deterministic demo;
serial execution prevents cross-journey session and record races.
