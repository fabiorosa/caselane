import Link from "next/link";
import { cookies } from "next/headers";

import { getDatabase } from "@/db/client";
import { createInvitationRepository } from "@/db/repositories/invitations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { ExistingInvitationForm, NewInvitationForm } from "@/components/invitation-form";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { getInvitationDetails } from "@/services/accept-invitation";
import { getCurrentUserContext } from "@/services/session-service";
import { acceptExistingInvitationAction, acceptNewInvitationAction } from "./actions";

export default async function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const database = getDatabase();
  const cookieJar = await cookies();
  const cookieStore: SessionCookieStore = { get: (name) => cookieJar.get(name), set: () => undefined };
  const [invitation, user] = await Promise.all([
    getInvitationDetails(createInvitationRepository(database), systemClock.now(), token),
    getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(cookieStore)),
  ]);

  if (!invitation) return <InvitationFrame><p className="auth-kicker">Invitation unavailable</p><h1>This invitation cannot be used.</h1><p className="auth-description">It may be expired, revoked, already accepted, or invalid. Ask the workspace administrator for a new invitation.</p><Link className="auth-link" href="/sign-in">Back to sign in</Link></InvitationFrame>;

  const matchingUser = user?.email === invitation.email;
  return <InvitationFrame><p className="auth-kicker">{invitation.role.toLowerCase()} invitation</p><h1>Join {invitation.organizationName}</h1><p className="auth-description">This invitation was sent to <strong>{invitation.email}</strong>.</p>{user ? matchingUser ? <ExistingInvitationForm action={acceptExistingInvitationAction.bind(null, token)} /> : <><p className="form-error" role="alert">You are signed in as {user.email}. Sign in with {invitation.email} to accept this invitation.</p><Link className="auth-link" href={`/sign-in?returnTo=/accept-invite/${encodeURIComponent(token)}`}>Use another account</Link></> : <NewInvitationForm action={acceptNewInvitationAction.bind(null, token)} />}</InvitationFrame>;
}

function InvitationFrame({ children }: { children: React.ReactNode }) {
  return <main className="auth-page"><section className="auth-panel"><div className="auth-brand"><i aria-hidden="true"><b /><b /><b /></i>CaseLane</div>{children}</section></main>;
}
