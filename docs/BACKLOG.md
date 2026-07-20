# Portfolio-first delivery backlog

This is the canonical implementation order. CaseLane is a public portfolio
product, never a disposable MVP. Work on one ticket at a time. A ticket is done
only when its complete user journey, authorization, validation, states, tests,
documentation, lint, and production build pass.

Status values: `todo`, `doing`, `review`, `done`, `blocked`.

## Delivered foundation

### CL-F01 — Product, repository, schema, CI, and environment

Status: done.

Independent public portfolio repository; product and architecture documents;
responsive visual system; PostgreSQL schema and migrations; CI; port 3108 and
PostgreSQL port 55432 contracts.

### CL-F02 — Identity, tenancy, invitations, and team management

Status: done.

Registration, sign-in, sessions, organizations, tenant context, invitations,
team roles, last-owner protection, cross-tenant tests, and complete M1 browser
review. Fabio accepted this foundation on 2026-07-19.

### CL-F03 — Client data foundation

Status: done.

Client/contact validation, normalized email, tenant-scoped repositories, cursor
pagination, archive behavior, transactional primary contacts, URL-owned client
filters, and initial client directory states. This incorporates former tickets
CL-201 through CL-203.

## Vertical 1: Internal request operation

### CL-V101 — Demo workspace, product shell, and real overview

Status: done. Dependencies: delivered foundation.

Create a deterministic fictional demo workspace and reset command protected by
an environment guard. Replace the sparse overview with real PostgreSQL-derived
open, overdue, unassigned, and waiting-on-client counts; recent activity; and a
plain-language onboarding state for a new workspace. Establish one consistent
workspace shell and navigation across Overview, Clients, Cases, and Team. Label
demo data honestly and never show invented business outcomes.

Acceptance: a first-time reviewer understands what CaseLane does, where to begin,
and which records are demonstration data; every visible figure is database-backed;
reset is safe and repeatable; desktop/mobile/keyboard states pass.

Tests: deterministic seed/reset, exact aggregate counts, empty workspace, tenant
isolation, navigation, no hardcoded operational metrics.

### CL-V102 — Complete client workspace

Status: done. Dependencies: CL-V101.

Finish the existing create/edit implementation and deliver the complete journey:
directory, create with optional primary contact, client detail, edit, contact
add/edit/archive, recent request summary, archive confirmation, archived state,
and read-only MEMBER presentation. No client action may lead to a missing route.

Acceptance: OWNER/ADMIN can create and manage a client without leaving the
journey; MEMBER can read but cannot mutate; preserved form input, natural field
errors, conflicts, unsaved-change protection, empty/no-result/loading/error
states, and mobile layout are complete.

Tests: valid/invalid forms, duplicate contact email, primary invariant, archive
effects, member restrictions, missing/cross-tenant behavior, browser journey.

Existing work absorbed: former CL-204 is substantially implemented and browser-
validated but remains open until this complete client journey is delivered.

### CL-V103 — Case intake and operational queue

Status: done. Dependencies: CL-V102.

Implement atomic organization case numbers and the complete create-case journey.
Deliver a real case queue with search, status, priority, assignee, client,
overdue, cursor pagination, list/board switch, new-workspace onboarding, empty
results, loading, error, and mobile states. Creating a case immediately places
it in the queue and creates immutable `case.created` activity.

Acceptance: a reviewer creates a request for a real client/contact and can find
it in the queue without explanation; all references are tenant-scoped; archived
clients are blocked; no presentation sample cases remain.

Tests: concurrent sequence allocation, rollback, invalid references, filters,
combined pagination stability, URL behavior, keyboard creation, isolation.

### CL-V104 — Case workroom and trustworthy lifecycle

Status: done. Dependencies: CL-V103.

Build the case detail workroom: identity and description, client/requester,
category, priority, assignee, due date, allowed status actions, internal notes,
client-visible replies, resolution/reopen behavior, and chronological activity.
Every material mutation and activity event commit together.

Acceptance: an internal reviewer opens a case, triages it, assigns it, writes an
internal note and client reply, waits on the client, resolves it, reopens it,
closes it, and can trust the resulting timeline. Visibility is unmistakable and
the workflow works on mobile and keyboard.

Tests: query shape without N+1, full transition matrix, timestamps, permissions,
message visibility, rollback, stale concurrency, event accuracy, isolation.

Vertical 1 review gate: using seeded or freshly created records, a reviewer can
understand the product and complete client → case → assignment → communication →
resolution without assistance. OWNER and MEMBER experiences are coherent, all
figures are real, cross-tenant tests pass, and no route is a placeholder.

### CL-Q101 — Remove dash-heavy public copy

Status: done. Dependency: Vertical 1 review.

Audit every user-visible string, browser title, metadata field, public document,
and seeded presentation record. Remove em dashes and other conspicuous
dash-heavy phrasing, beginning with the browser window title, and rewrite the
surrounding copy naturally rather than mechanically replacing punctuation.

Acceptance: no public-facing CaseLane surface uses em dashes, title metadata is
clean, copy still reads naturally in US English, and tests prevent regressions
in centrally defined metadata and presentation copy.

Completed: browser metadata now uses a clean separator, the public README uses
plain product language, and each seeded demo case has a specific operational
description. Regression tests protect the metadata and seed copy.

### CL-Q102 — Team management workspace

Status: done. Dependency: CL-V104.

Replace the thin inline team list with a complete management workspace. Keep
invitation as creation, add a member profile route, allow authorized managers
to update a member's name, job title, workspace role, and active access, show
effective permissions and assigned-case context, and keep deactivation
reversible instead of deleting identities referenced by operational history.
Use the premium select component throughout this journey.

Acceptance: an owner can invite a teammate, open their profile, understand
their access, edit profile and role, deactivate and reactivate access, and see
their assigned workload. Members can inspect the directory and profiles but
cannot mutate access. The owner remains protected, cross-tenant identifiers do
not resolve, keyboard and mobile flows are complete, and no native select is
used in the team-management journey.

Tests: profile validation, permissions, owner protection, tenant isolation,
profile update, access lifecycle, query shape, and production build.

### CL-Q103 — One-click public demo access

Status: done. Dependency: Vertical 2 review.

Add server-issued one-click sessions for the seeded owner, member, and client
personas. The feature must be disabled by default, require an explicitly demo
organization and active membership, never send a password to the browser, and
route each role to its correct product surface. Present the personas as one
deliberate login journey and keep conventional authentication available.

Acceptance: a portfolio reviewer enters all three product perspectives without
credentials; production-like environments without the explicit demo flag cannot
invoke the shortcut; inactive, missing, non-demo, or mismatched personas fail
safely; switching from workspace to portal no longer ends in unexplained 404.

Tests: environment flag, persona validation, demo-only repository selection,
session issuance, disabled-state rejection, role destination, mobile and build.

### CL-Q104 — Perceived performance and pending feedback

Status: done. Dependency: CL-Q103.

Replace static empty loading blocks with content-shaped route skeletons across
the workspace and Client portal. Preserve the real layout during database
waits, use one restrained transform-only sweep, expose honest busy semantics,
and disable motion for visitors who request reduced motion. Add explicit pending
feedback to one-click demo access, case transitions, and archive actions.

Acceptance: every database-backed portfolio route has a structured fallback;
no navigation wait presents an unexplained empty shell; high-impact mutations
disable repeated submission and announce their pending state; desktop and
mobile skeletons match the surrounding geometry; reduced-motion, PostgreSQL,
lint, production build, and real-browser gates pass.

Acceptance evidence: 16 database-backed routes use content-shaped workspace,
authentication, or portal fallbacks; demo, lifecycle, and archive actions
expose pending feedback;
the transform-only sweep is removed under reduced motion; desktop and 390 px
browser review showed stable geometry with no horizontal overflow. All 117
tests, PostgreSQL, lint, secret scan, and production build passed.

## Vertical 2: Client participation

### CL-V201 — Portal identity and request submission

Status: done. Dependencies: Vertical 1 review accepted for continued delivery on 2026-07-19.

Resolve CLIENT identity to one organization/client contact through a separate
portal authorization boundary. Deliver the simpler portal shell, request list,
request submission, validation, archived/inactive rules, and mobile states.

Acceptance: a client signs in, sees only its organization, submits a request,
and the internal queue receives the same record. Submitted client/contact,
assignee, and priority cannot be spoofed.

### CL-V202 — Shared client conversation

Status: done. Dependencies: CL-V201.

Deliver portal request detail, readable status and next action, client-visible
conversation, replies, and safe activity. Internal notes and internal metadata
must be absent at the SQL selection, returned object, HTML, and network levels.

Acceptance: internal user replies, client sees and responds, both follow the
same case, and adversarial tests prove internal content never crosses the portal
boundary.

Vertical 2 review gate: a reviewer completes the same request from both roles;
the operation stays aligned and internal information remains private.

## Vertical 3: Public portfolio release

### CL-V301 — Settings, accessibility, and operational hardening

Status: done. Dependencies: Vertical 2 review.

Complete organization/category settings, rate limiting, security headers,
structured redacted logs, health degradation, production cookie verification,
responsive and accessibility audit, and secret scan.

Acceptance evidence: tenant-scoped settings and permission tests, PostgreSQL
rate-limit integration tests, live health and security-header checks, production
cookie assertions, and desktop/mobile browser review all passed on 2026-07-19.

### CL-V302 — Release-grade automated walkthrough

Status: done. Dependencies: CL-V301.

Run migrations from zero and add the required PostgreSQL integration harness,
Playwright owner/member/client journeys, keyboard/mobile lifecycle, CI migration
consistency, and preview smoke suite.

Acceptance evidence: an empty disposable database migrated successfully; all
114 PostgreSQL tests ran without skips; four Chromium walkthroughs covered the
Owner signal-to-queue path, Team member permissions, the Client mobile request
and reply loop, INTERNAL-note privacy, and keyboard navigation; local preview
smoke, migration consistency, lint, secret scan, and production build passed.

### CL-V303 — Portfolio documentation, deployment, and evidence

Status: done. Dependencies: CL-V302.

Complete the English README, architecture and tradeoffs, AI-assisted development
disclosure framed around ownership/review, screenshots, demo credentials, known
limits, walkthrough video, managed PostgreSQL and Next.js deployment, HTTPS,
backup/log/health policy, final domain, tagged release, and portfolio links.

Acceptance evidence: the public Vercel deployment and Neon PostgreSQL database
are live at `https://caselane.vercel.app`; production migrations, deterministic
demo reset, protected-route redirect, Owner, Team member, Client, workroom, and
portal privacy checks passed. The repository includes a discoverable English
security policy, deployment runbook, screenshots, walkthrough video, known
limits, and live-product link. The Vercel URL is canonical for this release;
the custom domain is a documented optional improvement after Fabio reorganizes
the parent domain hosting.

Final gate: a reviewer can discover, understand, and complete the documented
demo without assistance; production and public source agree; no private data,
secrets, localhost references, fabricated metrics, or unfinished routes remain.

## Demonstration extensions after release

### CL-Q105 — Full-row navigation targets

Status: done. Dependency: v1.0.0 release.

Audit action-free lists whose primary purpose is opening a detail record and
make the complete visual row or card a native link. Preserve keyboard access,
visible focus, restrained hover feedback, mobile layout, and text selection.
Do not apply the pattern to rows containing forms, buttons, email links, or
other competing actions.

Acceptance: case list and board, client directory, overview activity, client
case history, and Client portal request rows expose their complete surface as
one link; action-bearing lists remain unchanged; regression tests, real browser
validation, PostgreSQL, lint, secret scan, and production build pass.

Acceptance evidence: all six eligible collections use one native link per row
or card, while team members, invitations, contacts, and Settings retain their
competing actions. A real click in the right-side metadata area opened the
correct case. At 390 px, the case target measured 343 by 100 px with no page
overflow. All 120 PostgreSQL tests, four Chromium walkthroughs, lint, secret
scan, and the production build passed.

### CL-Q106 — Status legibility and interaction polish

Status: done. Dependency: CL-Q105.

Improve status-chip contrast and spacing across queue and workroom surfaces.
Audit complete-row navigation, then add restrained feedback for row activation,
status actions, and message composition. Honor reduced-motion preferences and
preserve mobile layouts.

Acceptance: every status chip has readable white text and deliberate padding;
eligible record collections remain complete native links; interaction feedback
is brief and functional; reduced-motion behavior, regression tests, real
browser validation, PostgreSQL tests, lint, secret scan, and the production
build pass.

Acceptance evidence: queue and workroom status chips render with white text,
9 px horizontal padding, and a minimum 26 px height. The complete-row audit
found no missed action-free collections. A real click at the far edge of a
client case-history row opened the correct workroom; at a 375 px viewport the
target measured 343 by 78 px with no page overflow. Row activation, status
actions, and composer focus use brief functional feedback covered by the global
reduced-motion rule. All 121 PostgreSQL tests, four Chromium walkthroughs,
lint, secret scan, and the production build passed.

### CL-Q107 — Premium select consistency

Status: done. Dependency: CL-Q106.

Replace every remaining native product select with the existing accessible
PremiumSelect. Preserve GET filters, server-action form values, keyboard
selection, responsive sizing, and the restrained dark visual system.

Acceptance: client-directory and case-queue filters, plus inline team-role
editing, open a CaseLane listbox rather than a browser-native menu; selected
values submit correctly; no audited native select remains; real desktop/mobile
browser validation, PostgreSQL tests, lint, secret scan, and production build
pass.

Acceptance evidence: the complete source audit found and replaced three native
select surfaces: Client directory status, four Case queue filters, and inline
Team role editing. The shared listbox now also accepts Enter and Space on an
active option. A real browser check applied Archived clients and In progress
filters with their query values preserved; desktop and 375 px review found no
native select or horizontal overflow. All 123 PostgreSQL tests, four Chromium
walkthroughs, lint, secret scan, and the production build passed.

- Webhook intake with idempotency.
- Rule-based routing with run and retry history.
- AI suggestions with structured output, evaluation, and human approval.
