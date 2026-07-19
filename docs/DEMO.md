# Demo and seed specification

## Purpose

The public demo proves a complete workflow without using real people, clients,
metrics, or data from Fabio's commercial products.

## Demo organization

Workspace: `Orbit Labs`

Team accounts:

- Owner: Avery Brooks, `owner@demo.caselane.dev`
- Admin: Morgan Ortiz, `admin@demo.caselane.dev`
- Member: Jordan Singh, `member@demo.caselane.dev`

Client account:

- Maya Chen, Northstar Legal, `client@demo.caselane.dev`

One public demo password is documented on the sign-in screen only in the demo
environment. Production-like environments outside the public demo must not seed
known credentials.

## Fictional clients

- Northstar Legal
- Hartwell Clinics
- Aperture Works

These names are fictional presentation data, not testimonials or claimed users.

## Seeded cases

Seed at least twelve cases distributed across all statuses, priorities,
assignees, clients, overdue/current dates, internal notes, public replies, and
activity events. Dates are derived relative to seed time so overdue and upcoming
views remain meaningful.

Required named scenarios:

- purchase order field request: new, high priority, unassigned;
- Q3 location roster: in progress, assigned;
- finance reviewer access: waiting on client;
- utilization export correction: urgent and overdue;
- contractor account archive: resolved;
- one closed case with complete lifecycle;
- one client-submitted case with public conversation;
- one case containing an internal note that must never appear in portal.

## Demo safety

- Demo data carries `isDemo` organization metadata before public launch; add a
  schema field or separate environment-level identifier through an ADR.
- Provide a deterministic reset mechanism restricted to deployment automation.
- Visitors cannot trigger reset, inspect other sessions, invite arbitrary
  external emails, or send real email.
- Rate limits protect sign in and mutations.
- Demo UI labels the workspace as sample data without overwhelming the product.
- Do not claim that seeded activity is live customer usage.

## Walkthrough

README and portfolio page will guide a reviewer through a 3 to 5 minute path:

1. sign in as owner;
2. inspect operational exceptions;
3. open the overdue utilization case;
4. review internal and client communication separation;
5. change or inspect a valid workflow transition;
6. sign in as client;
7. confirm the simplified portal and data boundary;
8. return to GitHub for architecture and test evidence.
