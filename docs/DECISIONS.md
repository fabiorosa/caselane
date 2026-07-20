# Architecture decisions

## ADR-001: Separate public repository

**Status:** accepted

CaseLane is isolated from all private products. Its history, documentation,
deployment, and issues can be reviewed independently by recruiters.

## ADR-002: TypeScript across the application

**Status:** accepted

Next.js and React provide the product surface, while server code and domain
contracts share TypeScript types. Runtime input is still validated because
static types do not protect network boundaries.

## ADR-003: PostgreSQL as source of truth

**Status:** accepted

The domain is relational and requires tenant-scoped joins, constraints,
transactions, indexes, and auditable migrations. Browser storage is limited to
non-authoritative UI preferences.

## ADR-004: Multi-tenancy through organization ownership

**Status:** accepted

Tenant-owned records carry an `organization_id`. Repository and service
functions require organization context, and authorization tests attempt
cross-tenant access explicitly. URL identifiers alone never grant access.

## ADR-005: Separate messages by visibility

**Status:** accepted

Case messages store explicit `INTERNAL` or `CLIENT` visibility. Server queries
for the client portal select only client-visible messages rather than fetching
everything and hiding internal notes in the browser.

## ADR-006: Activity events are domain records

**Status:** accepted

Material changes create append-only activity events in the same transaction as
the change when possible. The timeline is not reconstructed from mutable rows.

## ADR-007: Deployment topology remains reversible

**Status:** accepted

The canonical product address is `caselane.fabioux.com`. Vercel Hobby and Neon
Free are the preferred first-release providers, while the application remains
portable to any Node-compatible host and managed PostgreSQL service. Provider
URLs are fallbacks, not public portfolio links, and hosting details do not leak
into domain logic.

## ADR-008: Local ports and Docker boundary

**Status:** accepted

CaseLane reserves host port `3108`; it never claims port `3000`. Local
PostgreSQL runs in Docker and is exposed on host port `55432` to avoid a common
local database collision. Developers may run Next.js directly for fast refresh
or use the optional full Docker profile for a production-like environment.

## ADR-009: Portfolio-first vertical delivery

**Status:** accepted

CaseLane is delivered as a sequence of complete, reviewable user journeys, not
horizontal infrastructure milestones. The previous order produced strong
authorization and persistence foundations but left the visible product sparse
and difficult to understand. From 2026-07-19 onward, each active ticket must
end in a coherent product surface that a portfolio reviewer can use without
knowing the implementation roadmap.

The first vertical is the internal request lifecycle: understand the workspace,
manage a client, create a case, work it, communicate, resolve it, and inspect its
activity. The client portal follows against the same records. Demo data and the
real operational overview move earlier because they are part of explaining the
product, not release-only decoration. Existing technical work is retained and
absorbed into these verticals; it is not rebuilt as a second polish phase.

## ADR-010: Demo identity is explicit data

**Status:** accepted

Organizations carry a non-null `is_demo` flag defaulting to false. Demo labels,
known credentials, and reset automation depend on this flag plus environment
guards; they are never inferred from a slug, email domain, or presentation copy.
Reset deletes and recreates only the one deterministic demo organization and is
not exposed through an HTTP route.

## ADR-011: Case mutations use optimistic concurrency

**Status:** accepted

Case detail, lifecycle, and message mutations carry the case `updated_at` value
that the reviewer saw. The repository locks the tenant-scoped row and rejects a
mutation when that value is stale. This prevents an old browser tab from
silently overwriting a newer assignment, status, deadline, or conversation.
The mutation and its append-only activity record commit in one transaction.

## ADR-012: Public demo sessions are server-issued and explicitly gated

**Status:** accepted

Portfolio visitors may enter the seeded owner, member, or client perspective
without typing shared credentials. The browser submits only a validated persona
name. The server issues a normal opaque database session after confirming that
demo access is explicitly enabled, the target organization has `is_demo = true`,
the expected membership is active, the user is enabled, and a client persona
still has an active contact-to-client relationship. Passwords are never embedded
in HTML or sent for this journey. The feature defaults to disabled and ordinary
authentication remains available. Public deployment must pair the shared demo
with rate limiting and periodic deterministic reset.

## ADR-013: Operational hardening stays inside the application boundary

**Status:** accepted

Rate limits use PostgreSQL fixed windows keyed by an HMAC of the request
identity. This keeps raw email addresses, IP addresses, and user identifiers out
of the table while making enforcement consistent across application instances.
Expired windows are removed opportunistically. Authentication and invitation
actions have separate limits so one workflow cannot consume another workflow's
budget.

Server logs are structured JSON and redact sensitive key names. The health route
reports only whether PostgreSQL is reachable and returns a request identifier;
it never returns a connection string or driver error. Security headers are
centralized in the Next.js configuration. The CSP permits the small inline App
Router bootstrap required by the current rendering strategy, but otherwise
limits scripts and connections to the application origin. A nonce-based CSP is
deferred because it would make every route dynamic and remove useful static
rendering without a proportional portfolio benefit.

## ADR-014: Release confidence uses two explicit test runners

**Status:** accepted

Vitest owns domain, service, infrastructure, and PostgreSQL integration tests.
Playwright owns browser journeys. Their collection patterns do not overlap. CI
provides PostgreSQL explicitly and uses `TEST_DATABASE_URL`, preventing a green
run in which integration suites were silently skipped.

Migration verification creates a disposable database and applies the complete
journal from zero. Preview smoke accepts a `PREVIEW_URL` instead of coupling the
repository to a hosting vendor. This keeps the release contract stable while
the deployment topology is selected in CL-V303.
