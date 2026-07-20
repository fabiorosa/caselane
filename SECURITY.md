# Security policy

CaseLane is a public portfolio application that uses fictional, shared demo
data. Its security model is still treated as a production engineering concern:
authentication, authorization, tenant isolation, secret handling, and portal
visibility are enforced on the server and covered by automated tests.

## Supported version

Security fixes are applied to the latest commit on the public `master` branch.
Older commits and local forks are not supported releases.

## Public demo access

The Owner, Team member, and Client **Explore** buttons intentionally create a
demo session without asking for a password. This is not an authentication
bypass. The server accepts only a fixed persona identifier and issues a normal
opaque database session after verifying that:

- public demo access is enabled for the deployment;
- the target workspace is explicitly marked as demo data;
- the seeded user and membership are active; and
- a Client persona still has an active relationship with the seeded client.

The feature is disabled by default. Demo identities have access only to shared,
fictional data, are rate-limited, and can be reset deterministically. A fresh
browser that opens a protected route without choosing a persona is redirected
to sign-in.

## Security boundaries

- Authentication alone grants no workspace access. Every protected operation
  resolves an active organization membership on the server.
- Tenant-owned queries require organization context. Cross-tenant identifiers
  return a not-found result rather than disclosing record existence.
- Client users use a separate portal authorization boundary and can access only
  requests belonging to their client relationship.
- Internal notes are excluded by portal queries on the server; they are never
  fetched and hidden in the browser.
- Passwords use Argon2id. Session and invitation tokens are random, opaque, and
  stored as SHA-256 hashes.
- Production cookies are HTTP-only, Secure, and SameSite=Lax.
- Public authentication and invitation operations use PostgreSQL-backed rate
  limits keyed by HMAC rather than raw identity values.
- Security headers include CSP, frame protection, content-type protection,
  referrer policy, permissions policy, and HSTS on the public deployment.
- Secrets must not be committed, logged, exposed through `NEXT_PUBLIC_*`, or
  included in public evidence.

The detailed capability matrix and invariants live in
[docs/AUTHORIZATION.md](docs/AUTHORIZATION.md). Architecture controls and known
tradeoffs are recorded in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and
[docs/DECISIONS.md](docs/DECISIONS.md).

## Verification

Pull requests and release candidates are expected to pass:

- PostgreSQL integration and tenant-isolation tests;
- migration verification against a real PostgreSQL instance;
- Owner, Team member, Client, mobile, and privacy browser journeys;
- lint, strict TypeScript production build, and repository secret scanning;
- live HTTPS, health endpoint, security-header, and protected-route checks.

Commands and evidence requirements are documented in
[docs/TESTING.md](docs/TESTING.md).

## Reporting a vulnerability

Please do not open a public issue containing exploit details, credentials,
personal data, or other sensitive information. Report the problem privately to
the repository owner through GitHub, including:

1. the affected route or component;
2. clear reproduction steps;
3. the observed and expected behavior;
4. the potential impact; and
5. a minimal proof of concept, with secrets removed.

Do not access data that is not yours, degrade the public demo, run denial-of-
service tests, or use social engineering. Good-faith reports will be reviewed
and handled according to severity; no fixed response-time SLA is promised for
this portfolio project.

## Scope and limitations

The shared demo is not a private sandbox and must never contain real customer
or personal data. Free-tier hosting can cold-start or pause at provider quota
limits. Transactional email, password recovery, SSO, file uploads, and a
third-party error-monitoring provider are outside the current release scope.

