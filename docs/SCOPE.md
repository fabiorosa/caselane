# Portfolio V1 scope

## Included

### Identity and tenancy

- Email/password authentication with secure password hashing.
- Organization creation and organization switcher.
- Owner, admin, member, and client roles.
- Invitation flow with expiring single-use tokens.
- Server-side tenant isolation for every protected operation.

### Clients

- Client organizations and contacts.
- Create, edit, search, filter, and archive.
- Request history on the client detail page.

### Cases

- Human-readable case number, title, description, category, priority, status,
  assignee, requester, due date, and timestamps.
- Statuses: New, Triaged, In progress, Waiting on client, Resolved, Closed.
- Internal notes and client-visible messages.
- Activity timeline for material changes.
- List and board views backed by the same records.
- Search, status, priority, assignee, and client filters.

### Client portal

- Submit and view requests belonging to the client.
- Add client-visible messages.
- Clear distinction between current status and next expected action.

### Operations dashboard

- Open, overdue, unassigned, and waiting-on-client counts.
- Work grouped by status and priority.
- Recent activity and personal queue.
- All figures derive from seeded or real records and are never presented as
  invented business claims.

### Product quality

- Responsive desktop and mobile layouts.
- Keyboard navigation, visible focus, semantic headings, and labelled forms.
- Honest loading, empty, validation, permission, and unexpected-error states.
- Seeded demo workspace with safe fictional data.
- Automated tests for authorization and the critical case lifecycle.
- CI checks, migrations, production build, and deployment documentation.

## Planned after V1

- Public intake forms and authenticated webhooks.
- Rule-based routing and automation runs with retry history.
- Email notifications.
- Object storage for file attachments.
- AI-assisted extraction, categorization, priority, and response drafting.
- Audit export and deeper operational reporting.

## Explicitly excluded

- Billing, subscriptions, and real payment collection.
- Native mobile applications.
- Real-time chat or presence.
- Fully customizable workflow builders.
- Calendar and time tracking.
- Marketplace integrations.
- Claims of compliance certification.
