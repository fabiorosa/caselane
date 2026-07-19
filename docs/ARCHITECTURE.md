# V1 technical architecture

This document removes implementation ambiguity for the complete portfolio V1.
Any deviation requires an ADR in `DECISIONS.md` before code changes.

## Runtime topology

```text
Browser
  -> Next.js application on port 3108
      -> Server Components for reads
      -> Server Actions for authenticated form mutations
      -> Route Handlers only for external or non-form HTTP contracts
      -> Domain services for business rules and transactions
      -> Drizzle repositories for tenant-scoped database access
          -> PostgreSQL 17
```

Development uses Next.js on the host and PostgreSQL in Docker. The optional
`full` Docker profile runs both. Production uses one Next.js deployment and one
managed PostgreSQL database.

## Mandatory layers

### Presentation

Routes, layouts, React components, form state, accessible feedback, and view
models. Presentation code never decides authorization and never queries the
database directly.

### Application services

Coordinates a use case, starts transactions, checks authorization, invokes
domain rules, writes records, and creates activity events. One public function
represents one use case, such as `createCase`, `changeCaseStatus`, or
`archiveClient`.

### Domain

Pure TypeScript rules and schemas: workflow transitions, role capabilities,
validation, identifiers, and error types. Domain functions have no React,
Next.js, or database imports and are unit tested.

### Repositories

Drizzle queries. Every tenant-owned repository function requires
`organizationId` as an explicit argument. Repositories return domain-shaped
records and do not expose unrestricted query builders.

### Infrastructure

Database connection, password hashing, sessions, cookies, email adapter, clock,
random token generation, and logging. External providers remain behind small
interfaces.

## Directory contract

```text
src/
  app/
    (auth)/
      sign-in/
      register/
      accept-invite/[token]/
    (workspace)/
      [organizationSlug]/
        overview/
        cases/
        cases/[caseNumber]/
        clients/
        clients/[clientId]/
        team/
        settings/
    portal/
      [organizationSlug]/
        requests/
        requests/new/
        requests/[caseNumber]/
    api/
      health/
  components/
    ui/
    workspace/
    portal/
  db/
    client.ts
    schema.ts
    repositories/
  domain/
  services/
  infrastructure/
  lib/
drizzle/
docs/
```

## Data and transaction rules

- PostgreSQL is authoritative; no product record is stored only in the browser.
- IDs are UUIDs. Cases also have a per-organization integer sequence displayed
  as `CS-1842`.
- Case sequence allocation occurs atomically in the same transaction as case
  creation.
- Material case mutations and their activity event commit in one transaction.
- `updatedAt` changes on mutation; `lastActivityAt` changes only when visible
  case activity occurs.
- Archive operations set `archivedAt`; they do not delete business history.
- Sessions and expired invitations may be hard-deleted by maintenance tasks.
- Dates are stored in UTC and formatted in the viewer's locale.
- Database constraints supplement runtime validation; neither replaces the
  other.

## Query rules

- Server Components call application query services, not repositories directly.
- List queries are paginated. V1 uses cursor pagination ordered by
  `lastActivityAt DESC, id DESC` for cases and `name ASC, id ASC` for clients.
- Default page size is 25; maximum is 100.
- Search in V1 is case-insensitive substring search over deliberately indexed
  or bounded fields. Full-text search is deferred.
- Client portal queries select allowed columns and `CLIENT` messages at the
  database boundary. Internal fields are never fetched and hidden in React.

## Validation and errors

- Zod validates every mutation at the server boundary.
- Forms share schemas where practical but server validation is authoritative.
- Expected errors use typed codes: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`,
  `CONFLICT`, `VALIDATION`, and `INVALID_TRANSITION`.
- User messages are specific and do not reveal record existence across tenants.
- Unexpected errors are logged with a request correlation ID and shown as a
  recoverable inline or route error state.

## Caching and rendering

- Authenticated workspace and portal pages are dynamic.
- Public marketing content may be static.
- V1 does not add a client cache library. Mutations revalidate the smallest
  affected route or tag.
- Do not cache membership or authorization decisions across requests.

## Security baseline

- HTTP-only, Secure in production, SameSite=Lax session cookie.
- Password hashes use Argon2id. If the selected Node deployment cannot support
  the native package, use a reviewed WebAssembly implementation and record an
  ADR; do not silently downgrade.
- Session tokens and invitation tokens store only SHA-256 hashes in the DB.
- Mutations require same-origin requests and authenticated server context.
- Login and invitation endpoints have rate-limit adapters before public launch.
- User-provided rich HTML is not accepted in V1; messages are plain text.
- Security headers include CSP, frame protection, content type protection,
  referrer policy, and a restrictive permissions policy.
- Secrets are never committed, logged, or exposed through `NEXT_PUBLIC_*`.

## Observability

- Structured server logs include level, event, requestId, userId when known,
  organizationId when authorized, and safe metadata.
- Health endpoint verifies the application process and database connectivity
  without exposing secrets or schema details.
- Production error monitoring provider is deferred, but the logging interface
  must allow Sentry or an equivalent adapter later.

## Performance budget

- No unbounded list queries.
- Dashboard data is computed with targeted aggregate queries, not loading all
  cases into memory.
- Avoid client components unless interaction requires them.
- Case and client detail pages must not introduce N+1 queries.
- V1 target: route content usable on a mid-range mobile connection without
  shipping the entire dashboard as client-side JavaScript.
