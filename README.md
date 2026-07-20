# CaseLane

CaseLane is a client request operations product for service teams. It turns
scattered email and chat requests into one accountable workflow without hiding
the client conversation from the people doing the work.

This is Fabio Rosa's public Product Engineer portfolio project. The repository
demonstrates product judgment and production engineering together: useful
operational signals, role-specific workflows, strict tenant boundaries,
PostgreSQL transactions, accessible interaction, release automation, and an
honest account of tradeoffs.

## What makes it more than a CRUD demo

- The overview is an operating surface. Every metric opens the exact queue it
  summarizes, including overdue, unassigned, and waiting-on-client work.
- A portal request and an internal case are the same PostgreSQL record. Clients
  and operators see language suited to their role without creating two sources
  of truth.
- INTERNAL notes are excluded by the portal query itself. They are not fetched
  and hidden in the browser.
- Case updates use optimistic concurrency, controlled state transitions, and
  append-only activity records.
- Owner, Admin, Member, and Client permissions are resolved on the server for
  every tenant-scoped operation.
- The public demo issues real server sessions for three perspectives without
  exposing shared passwords in HTML.

## Public walkthrough

The release demo offers one-click access as Owner, Team member, or Client.

1. Enter as Owner and use an overview metric to open a filtered queue.
2. Open a case, adjust ownership or lifecycle details, and add a private note or
   client-visible reply.
3. Enter as Client, submit a request, and reply from the portal.
4. Return as Owner to see the same request and conversation in the workroom.
5. Open Settings to compare Owner editing rights with the Team member read-only
   view.

All demo identities and organizations are fictional. The shared dataset is
designed to reset deterministically.

## Product evidence

![One-click Owner, Team member, and Client demo access](docs/evidence/01-demo-access.png)

![Operational overview with actionable queue metrics](docs/evidence/02-operational-overview.png)

The [short Owner walkthrough](docs/evidence/caselane-owner-walkthrough.webm)
moves from the operational overview into an overdue queue and workspace
settings. Additional evidence covers the [filtered overdue queue](docs/evidence/03-overdue-queue.png),
[settings](docs/evidence/04-settings.png), and the
[mobile client portal](docs/evidence/05-client-portal-mobile.png).

## Architecture

```text
Browser
  -> Next.js App Router
      -> Server Components for tenant-scoped reads
      -> Server Actions for authenticated mutations
      -> Domain services for authorization and workflow rules
      -> Drizzle repositories and transactions
          -> PostgreSQL 17
```

PostgreSQL is authoritative. The browser stores no business record. The client
portal uses a deliberately smaller query boundary, while internal workroom
mutations record activity in the same transaction as the change. Rate limits
also live in PostgreSQL, keyed by HMAC rather than raw IP or identity values.

See [the technical architecture](docs/ARCHITECTURE.md),
[authorization model](docs/AUTHORIZATION.md), [security policy](SECURITY.md),
and [architecture decisions](docs/DECISIONS.md) for the complete contracts.

## Stack

- Next.js 16, React 19, and strict TypeScript
- PostgreSQL 17 and Drizzle ORM with versioned SQL migrations
- Argon2id passwords and opaque, hashed session tokens
- Vitest for domain, service, infrastructure, and PostgreSQL integration tests
- Playwright for Owner, Team member, Client, mobile, privacy, and keyboard paths
- GitHub Actions for secret scanning, migration verification, tests, build, and
  browser walkthroughs

## Run locally

Requirements: Node.js 22+, Docker, and npm.

```bash
git clone https://github.com/fabiorosa/caselane.git
cd caselane
cp .env.example .env
npm ci
docker compose up -d db
npm run db:migrate
npm run dev
```

Open `http://localhost:3108`. PostgreSQL is exposed only for local development
on `localhost:55432`; CaseLane never uses port 3000.

To seed the public demo locally, set a 12+ character `DEMO_PASSWORD`, then run:

```bash
ALLOW_DEMO_RESET=true npm run demo:reset
```

The reset is guarded and deletes only the deterministic organization explicitly
marked as demo data.

## Verification

```bash
npm run db:check
TEST_DATABASE_URL=postgresql://caselane:caselane@localhost:55432/caselane npm run test:migrations
TEST_DATABASE_URL=postgresql://caselane:caselane@localhost:55432/caselane npm run test:postgres
npm run test:e2e
npm run lint
npm run security:secrets
npm run build
```

The CI pipeline provisions PostgreSQL rather than allowing integration tests to
skip silently. The preview smoke command accepts any HTTPS deployment through
`PREVIEW_URL`, keeping the release contract independent of the host.

## Deployment

The recommended zero-cost portfolio topology is Vercel Hobby for Next.js plus
Neon Free for PostgreSQL, with `caselane.fabioux.com` attached directly to the
Vercel project. A direct custom domain is preferable to redirecting through a
`vercel.app` URL because the portfolio address remains canonical while Vercel
still provides automatic HTTPS and preview deployments.

See [deployment and operations](docs/DEPLOYMENT.md) for environment variables,
migration order, DNS, health checks, reset policy, backups, and rollback.

## Known limits

- Invitations use a local preview adapter; transactional email is deliberately
  deferred.
- Attachments, webhooks, full-text search, SSO, and automation rules are outside
  this release.
- The public demo is shared, rate-limited, and periodically reset. It is not a
  private sandbox for each visitor.
- Free hosting can cold-start or pause at quota limits and does not provide an
  uptime SLA.
- The CSP permits the inline bootstrap required by the current Next.js App
  Router strategy. A nonce-based policy would make every route dynamic.

## AI-assisted development disclosure

AI tools supported implementation, test generation, code search, and review.
Fabio owns the product decisions, architecture, acceptance criteria, security
boundaries, visual direction, and final validation. Generated work was treated
as a draft: it was inspected against the repository contracts, exercised in the
real UI, and required to pass PostgreSQL, browser, lint, secret, and production
build gates before acceptance.

## Documentation

- [Security policy and vulnerability reporting](SECURITY.md)
- [Product brief](docs/PRODUCT.md)
- [Scope and known boundaries](docs/SCOPE.md)
- [Technical architecture](docs/ARCHITECTURE.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Authentication and authorization](docs/AUTHORIZATION.md)
- [Interface specification](docs/UI_SPEC.md)
- [Test strategy and evidence](docs/TESTING.md)
- [Deployment and operations](docs/DEPLOYMENT.md)
- [Executable backlog](docs/BACKLOG.md)

## Portfolio integrity

CaseLane contains only fictional demonstration data. It does not reproduce
customer information, source code, or product concepts from private commercial
work.
