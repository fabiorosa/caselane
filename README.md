# CaseLane

CaseLane is a multi-tenant client request operations platform built as a
production-minded Product Engineering portfolio project.

It helps small service teams receive, triage, own, and resolve client requests
without losing context across inboxes, messages, and spreadsheets.

## Status

The product is under active development. The V1 scope and delivery status are
tracked in [`docs/SCOPE.md`](docs/SCOPE.md) and
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Product walkthrough

The completed portfolio release will demonstrate this lifecycle:

1. a client submits a request;
2. a team member triages and owns it;
3. internal notes remain private while client messages stay visible;
4. the case moves through a controlled workflow;
5. every material change appears in its activity history.

## Intended stack

- Next.js, React, and TypeScript
- PostgreSQL with versioned migrations
- Server-side authentication and role-based authorization
- Tailwind CSS with a product-specific design system
- Automated tests and GitHub Actions
- Independent production deployment

## Documentation

- [Product brief](docs/PRODUCT.md)
- [Portfolio V1 scope](docs/SCOPE.md)
- [Delivery roadmap](docs/ROADMAP.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Technical architecture](docs/ARCHITECTURE.md)
- [Authentication and authorization](docs/AUTHORIZATION.md)
- [Application contracts](docs/CONTRACTS.md)
- [Interface specification](docs/UI_SPEC.md)
- [Executable backlog](docs/BACKLOG.md)
- [Test strategy](docs/TESTING.md)
- [Demo specification](docs/DEMO.md)
- [Current session state](docs/SESSION_STATE.md)

## Local development

The application uses port `3108` so it does not claim the common port `3000`.
For the usual development loop, start PostgreSQL in Docker and run Next.js on
the host:

```bash
npm install
docker compose up -d db
npm run db:migrate
npm run dev
```

The application is then available at `http://localhost:3108` and PostgreSQL at
`localhost:55432`.

To test the production container and database together:

```bash
docker compose --profile full up --build
```

The Docker setup is a local and CI convenience. Production remains portable to
managed PostgreSQL and a Next.js-compatible host.

## Portfolio integrity

CaseLane uses fictional demonstration data. It does not contain source code,
customer information, or product concepts from private commercial projects.
