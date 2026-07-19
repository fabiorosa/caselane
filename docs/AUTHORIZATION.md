# Authentication and authorization specification

## Authentication decision

V1 uses application-owned email/password authentication and opaque database
sessions. OAuth and password reset email are deferred until an email provider
is selected. Demo accounts are seeded, not implemented as an authentication
bypass.

## Registration

1. Accept name, email, password, workspace name, and terms acknowledgement.
2. Normalize email by trimming and lowercasing.
3. Validate password: 12 to 128 characters; allow password managers and spaces;
   do not impose composition tricks.
4. Hash password with Argon2id.
5. In one transaction create user, organization, OWNER membership, default
   categories, and session.
6. Create the secure session cookie and redirect to the workspace overview.
7. Duplicate email returns a sign-in-oriented conflict message without
   disclosing any password or account metadata.

## Sign in and sign out

- Sign in accepts normalized email and password.
- Failure always returns the same invalid-credentials response.
- Disabled users and inactive memberships cannot enter a workspace.
- Successful sign in rotates to a new random 256-bit session token.
- Sessions expire after 30 days and update `lastSeenAt` at most once per hour.
- Sign out deletes the current session and clears the cookie.
- Password change is outside V1; seeded demo credentials are public and contain
  no sensitive data.

## Invitation flow

1. OWNER or ADMIN supplies email and role. They cannot invite another OWNER.
2. Service creates a 256-bit token, stores its SHA-256 hash, and returns the raw
   token only to the email adapter.
3. Token expires after 7 days and is single use.
4. Existing users authenticate, then accept the membership.
5. New users provide name and password, creating their user and membership in
   one transaction.
6. Acceptance validates token status, expiry, normalized email, and organization.
7. Revoked, expired, used, or mismatched invitations fail safely.
8. In local/demo mode, an invitation URL may be displayed in a clearly labelled
   development panel; production never exposes it to unrelated users.

## Roles

- `OWNER`: exactly one required active owner per organization in V1.
- `ADMIN`: manages operation, clients, categories, and non-owner members.
- `MEMBER`: works cases and views internal workspace data.
- `CLIENT`: portal-only access scoped to one client organization.

## Capability matrix

| Capability | Owner | Admin | Member | Client |
|---|---:|---:|---:|---:|
| View workspace dashboard | yes | yes | yes | no |
| View all organization cases | yes | yes | yes | no |
| Create internal case | yes | yes | yes | no |
| Triage, assign, prioritize | yes | yes | yes | no |
| Change case status | yes | yes | yes | no |
| Add internal note | yes | yes | yes | no |
| Add client-visible reply | yes | yes | yes | yes, own client |
| View internal notes | yes | yes | yes | no |
| Manage clients and contacts | yes | yes | view only | no |
| Archive client | yes | yes | no | no |
| Invite admin/member | yes | yes | no | no |
| Change member role | yes | yes, except owner | no | no |
| Deactivate member | yes | yes, except owner | no | no |
| Transfer ownership | deferred | no | no | no |
| Manage organization settings | yes | limited | no | no |
| Submit portal request | no | no | no | yes, own client |
| View portal request | no | no | no | yes, own client |

## Authorization invariants

- Authentication alone grants no organization access.
- Every workspace operation checks active membership for the target organization.
- Every client operation also checks the contact-to-client relationship.
- A slug, UUID, sequence number, or hidden button never counts as authorization.
- Cross-tenant access returns `NOT_FOUND` unless the user is already authorized
  to know the record exists.
- An organization cannot deactivate or demote its only OWNER.
- CLIENT users never share the workspace layout or workspace query services.
- Internal notes are excluded server-side from every portal response.

## Required authorization tests

- Anonymous user rejected from every protected read and mutation.
- Active member can access their organization.
- Same user cannot access an organization without membership.
- Member cannot mutate clients or team roles.
- Admin cannot alter OWNER membership.
- Client sees only its own client's cases and CLIENT messages.
- Client cannot infer another case by UUID or case number.
- Archived client and inactive membership rules are enforced.
- Last-owner protection survives concurrent requests through a transaction or
  database lock.
