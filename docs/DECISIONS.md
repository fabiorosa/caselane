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

The portfolio will be presented at `dev.fabioux.com/caselane`. The live app is
expected at `caselane.dev.fabioux.com`, but the final DNS and hosting decision is
deferred until deployment and must not leak into domain logic.

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
