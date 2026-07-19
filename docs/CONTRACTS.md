# Application contracts

Server Actions are used for authenticated browser forms. Route Handlers are
reserved for health checks and future external integrations. Names below are
stable application-service contracts, independent of transport.

## Shared result contract

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" |
          "CONFLICT" | "VALIDATION" | "INVALID_TRANSITION";
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
```

Unexpected failures are thrown to the route error boundary and logged; they are
not disguised as validation errors.

## Identity services

### `registerOwner(input)`

Input: `name`, `email`, `password`, `workspaceName`, `acceptedTerms`.
Output: authenticated user summary and organization slug.
Side effects: user, organization, owner membership, default categories, session.

### `signIn(input)`

Input: `email`, `password`.
Output: user summary and accessible organizations.
Side effects: new session and cookie.

### `signOut()`

Input: current session.
Output: void.
Side effects: revoke session and clear cookie.

### `inviteMember(context, input)`

Input: `email`, `role` restricted to ADMIN or MEMBER.
Output: invitation summary; local adapter may include preview URL.

### `acceptInvitation(input)`

Input: raw token plus authenticated user or new-user name/password.
Output: organization slug and membership.

## Client services

### `listClients(context, query)`

Query: `search?`, `archived?`, `cursor?`, `limit?`.
Output: client list items, request counts, primary contact, next cursor.

### `getClient(context, clientId)`

Output: client, active contacts, recent cases, counts by open state.

### `createClient(context, input)`

Input: `name`, `externalReference?`, `notes?`, optional primary contact.
Validation: name 2..160; email valid; external reference <=100.

### `updateClient(context, clientId, input)`

Uses the same editable fields. Rejects archived clients unless restoring is the
explicit use case.

### `archiveClient(context, clientId)`

Blocks new cases and portal submissions while preserving existing history.

### `addClientContact`, `updateClientContact`, `archiveClientContact`

Enforce unique normalized email per organization. Exactly zero or one active
primary contact is allowed; setting one primary clears the previous primary in
the same transaction.

## Case services

### `listCases(context, query)`

Query fields:

- `search?`: title, displayed case number, or client name;
- `status?`: one or more statuses;
- `priority?`: one or more priorities;
- `assigneeId?`: UUID or `unassigned`;
- `clientId?`;
- `overdue?`;
- `cursor?`, `limit?`.

Output includes only list fields and next cursor.

### `getCase(context, caseNumber)`

Workspace output: case properties, client, requester, category, assignee,
messages of both visibility types, and activity timeline.

Portal output uses a separate `getPortalCase` contract and never returns
internal notes, internal activity metadata, assignee email, or other clients.

### `createCase(context, input)`

Input: `clientId`, `requesterContactId?`, `title`, `description`, `categoryId?`,
`priority`, `assigneeId?`, `dueAt?`.

Validation:

- title 4..180 after trimming;
- description 10..10,000;
- referenced client, contact, category, and assignee belong to organization;
- requester belongs to selected client;
- due date is valid ISO and may be today or later for new cases;
- only active clients accept new cases.

Side effects: allocate sequence, insert case, add `case.created` activity.

### `updateCaseDetails(context, caseId, input)`

Editable: title, description, category, priority, assignee, due date. Each
material changed field is summarized in one `case.updated` activity event.

### `changeCaseStatus(context, caseId, input)`

Input: `toStatus`, optional resolution note.
Uses `assertCaseTransition`. Setting RESOLVED sets `resolvedAt`; reopening clears
it. Setting CLOSED sets `closedAt`; reopening clears it. Adds activity event.

### `addCaseMessage(context, caseId, input)`

Input: `body` 1..10,000 and visibility. CLIENT role is forced to CLIENT
visibility regardless of submitted input. Adds message and activity atomically.

## Dashboard query

### `getOperationsOverview(context)`

Returns counts for active new, overdue, unassigned, and waiting-on-client cases;
the viewer's active queue; bounded recent activity; and open counts by active
team member. Counts come from the database and respect organization boundaries.

## Portal services

### `listPortalCases(context, query)`

Only cases for the authenticated contact's client. Filters: open/closed, search,
cursor, limit.

### `submitPortalCase(context, input)`

Input: title, description, optional category. Client and requester derive from
the authenticated relationship and cannot be supplied by the browser.

### `addPortalReply(context, caseId, input)`

Plain text body. Rejects cases outside the contact's client. Reopening a closed
case is not automatic; the team receives a new client reply activity.

## Health route

`GET /api/health`

- `200 { status: "ok", database: "reachable" }`
- `503 { status: "degraded", database: "unreachable" }`

Never returns stack traces, connection strings, versions, or table names.
