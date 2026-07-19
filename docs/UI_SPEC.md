# V1 interface specification

## Global shell

- Desktop sidebar: product mark, organization switcher, workspace navigation,
  management navigation, and signed-in user menu.
- Mobile: sidebar becomes an accessible modal drawer with scrim, close action,
  focus management, and Escape support.
- Top bar: breadcrumb, search entry point, context actions.
- Routes show loading skeletons shaped like real content, not fake progress text.
- Route errors explain what failed and offer retry or safe navigation.
- Destructive confirmation states name the affected record and consequence.

## Authentication routes

### Register

Fields: full name, work email, password, workspace name, terms checkbox.
Includes field errors, password guidance, submit loading, duplicate-account
guidance, and link to sign in. On success, redirects to overview.

### Sign in

Fields: email, password. Includes generic credential error, disabled submit,
pending state, and registration link. Demo credentials appear in a separate
clearly labelled panel only in demo deployments.

### Accept invitation

Shows organization and invited role after safe token validation. Handles:
authenticated matching user, new user form, wrong signed-in email, expired,
revoked, used, and invalid token.

## Overview

The existing visual shell is the baseline. Replace presentation arrays with
`getOperationsOverview` without changing the information hierarchy.

Required states:

- populated operation;
- new empty workspace with onboarding actions;
- no cases matching a filter;
- partial aggregate failure must fail the whole query, not show mixed invented
  values;
- mobile tables become readable stacked rows.

Metric controls set real case filters. Search navigates or filters real data.
"New case" opens a route or accessible dialog backed by `createCase`.

## Case list

- Default excludes CLOSED and orders by last activity.
- URL owns filters so views are linkable and refresh-safe.
- Search, status, priority, assignee, client, overdue, and clear-all controls.
- List and board views share filters and records.
- Board columns represent statuses and may use explicit status controls in V1;
  drag and drop is optional and cannot be the only accessible mechanism.
- Empty workspace and no-result states are distinct.
- Pagination preserves filters.

## Case creation

Fields in order: client, requester, title, description, category, priority,
assignee, due date. Client is selected before requester. Changing client clears
an incompatible requester. Submit preserves values on validation error. Cancel
warns only when meaningful unsaved input exists.

## Case detail

- Header: case number, client, status, title, priority, owner, due date.
- Main column: description, conversation composer, chronological messages.
- Internal note and client reply are separate explicit modes with persistent
  visibility label near the composer and submit button.
- Activity timeline distinguishes people from system events.
- Status transitions show only permitted next states but the server rechecks.
- Overdue, waiting, resolved, and closed states use text plus color.
- Client replies never render internal notes even transiently.

## Client list and detail

- Search, active/archived filter, primary contact, and open-case count.
- Create/edit forms validate name and contact details.
- Detail shows identity, contacts, open work, and recent history.
- Archive confirmation explains that history remains and new requests stop.
- MEMBER sees read-only management actions omitted.

## Team

- Member list: name, email, role, status, last seen when available.
- Invite form for OWNER/ADMIN.
- Role update and deactivation obey the capability matrix.
- Last owner controls are disabled with an explanation and protected server-side.

## Settings

V1 supports organization display name and category management. Slug editing,
ownership transfer, deletion, billing, and custom workflow configuration are
not present.

## Client portal

- Visually related to CaseLane but simpler and lighter in information density.
- Client cannot see internal navigation, team workload, internal statuses, or
  internal activity.
- Request list separates open and closed.
- New request form asks only title, description, and optional category.
- Detail shows status in plain language, next expected action, public
  conversation, and reply composer.

## Copy and content rules

- Natural US English, concise and operational.
- No buzzwords, fake testimonials, fake performance gains, or fake precision.
- Demo data is fictional but plausible and labelled in the demo environment.
- Buttons name actions: `Create case`, `Send reply`, `Archive client`.
- Avoid generic `Submit`, `OK`, `Oops`, and unexplained error codes.

## Accessibility acceptance

- Logical heading order and landmarks.
- Every form control has a persistent accessible name.
- Errors are associated with fields and announced after submit.
- Dialogs trap focus, close with Escape, return focus, and have labelled titles.
- Status and priority are not communicated by color alone.
- Interactive targets are at least 40px on touch layouts.
- Normal text contrast >=4.5:1 and large text >=3:1.
- Full critical lifecycle works by keyboard.
- Reduced-motion preference removes nonessential transitions.
