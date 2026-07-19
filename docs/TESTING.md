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
