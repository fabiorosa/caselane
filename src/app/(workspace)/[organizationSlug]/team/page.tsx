import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { InviteMemberForm, TeamMutationForm } from "@/components/team-controls";
import { WorkspaceTopbar } from "@/components/workspace-shell";
import { getDatabase } from "@/db/client";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { createTeamRepository } from "@/db/repositories/team";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";
import { getTeamManagementData } from "@/services/team-query";
import { inviteTeamMemberAction, revokeTeamInvitationAction } from "./actions";

export default async function TeamPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const database = getDatabase();
  const cookieJar = await cookies();
  const cookieStore: SessionCookieStore = { get: (name) => cookieJar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(cookieStore));
  if (!user) redirect(`/sign-in?returnTo=/${organizationSlug}/team`);
  const context = await resolveWorkspaceContext(createOrganizationContextRepository(database), user, organizationSlug);
  if (!context) notFound();
  const { members, pendingInvitations } = await getTeamManagementData(createTeamRepository(database), context.id);
  const canManage = context.role === "OWNER" || context.role === "ADMIN";

  return <main className="team-page">
    <WorkspaceTopbar slug={context.slug} active="team" isDemo={context.isDemo} />
    <div className="team-content">
      <section className="team-heading"><p className="auth-kicker">Workspace access</p><h1>Team</h1><p>Manage who can work inside {context.name} and what they are allowed to change.</p></section>
      {canManage ? <section className="team-invite"><div><h2>Invite a teammate</h2><p>Invitations expire after seven days and can be revoked before acceptance.</p></div><InviteMemberForm action={inviteTeamMemberAction.bind(null, context.slug)} /></section> : <p className="team-permission">You can view the team, but only owners and administrators can change access.</p>}
      <section className="team-list-section"><div className="team-section-heading"><h2>Members</h2><span>{members.length}</span></div><div className="team-list">
        {members.length ? members.map((member) => {
          const protectedOwner = member.role === "OWNER";
          return <article className={`team-row ${member.active ? "" : "inactive"}`} key={member.userId}>
            <div className="team-person"><span>{initials(member.name)}</span><div><h3><Link href={`/${context.slug}/team/${member.userId}`}>{member.name}</Link></h3><p>{member.title ?? member.email}</p></div></div>
            <div className="team-state"><strong>{member.active ? "Active" : "Inactive"}</strong><span>{member.lastSeenAt ? `Last seen ${member.lastSeenAt.toLocaleDateString("en-US")}` : "No session activity"}</span></div>
            <div className="team-actions"><span className="team-role-label">{protectedOwner ? "Owner, protected" : member.role === "ADMIN" ? "Administrator" : "Member"}</span><Link className="team-open-profile" href={`/${context.slug}/team/${member.userId}`}>Open profile</Link></div>
          </article>;
        }) : <div className="team-empty"><h3>No team members yet</h3><p>Invite an administrator or member to start collaborating.</p></div>}
      </div></section>
      <section className="team-list-section"><div className="team-section-heading"><h2>Pending invitations</h2><span>{pendingInvitations.length}</span></div><div className="team-list">
        {pendingInvitations.length ? pendingInvitations.map((invitation) => <article className="team-row pending" key={invitation.id}><div className="team-person"><span>IN</span><div><h3>{invitation.email}</h3><p>{invitation.role === "ADMIN" ? "Administrator" : "Member"} · expires {invitation.expiresAt.toLocaleDateString("en-US")}</p></div></div><div className="team-actions">{canManage ? <TeamMutationForm action={revokeTeamInvitationAction.bind(null, context.slug, invitation.id)} destructive label="Revoke" /> : <span className="team-role-label">Pending</span>}</div></article>) : <div className="team-empty"><h3>No pending invitations</h3><p>New invitations will appear here until they are accepted or revoked.</p></div>}
      </div></section>
    </div>
  </main>;
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}
