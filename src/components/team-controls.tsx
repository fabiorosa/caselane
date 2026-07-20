"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import type { TeamActionState } from "@/app/(workspace)/[organizationSlug]/team/actions";
import { PendingActionContent } from "@/components/pending-indicator";
import { PremiumSelect } from "@/components/premium-select";

export function InviteMemberForm({ action }: { action: (state: TeamActionState, formData: FormData) => Promise<TeamActionState> }) {
  const [state, formAction] = useActionState(action, {}); const [role, setRole] = useState("MEMBER");
  return <form action={formAction} className="team-invite-form" noValidate><label><span>Work email</span><input aria-invalid={Boolean(state.fieldErrors?.email)} name="email" type="email" /></label><div className="team-select-field"><span id="invite-role">Role</span><PremiumSelect ariaLabelledBy="invite-role" invalid={Boolean(state.fieldErrors?.role)} name="role" onChange={setRole} options={[{ value: "MEMBER", label: "Member" }, { value: "ADMIN", label: "Administrator" }]} placeholder="Member" value={role} /></div><PendingButton label="Send invitation" />{state.error ? <p className="team-feedback error" role="alert">{state.error}</p> : null}{state.success ? <p className="team-feedback" role="status">{state.success}</p> : null}{state.previewUrl ? <p className="team-preview"><strong>Local preview</strong><a href={state.previewUrl}>{state.previewUrl}</a></p> : null}</form>;
}

export function TeamProfileForm({ action, member }: { action: (state: TeamActionState, formData: FormData) => Promise<TeamActionState>; member: { name: string; title: string | null; role: "ADMIN" | "MEMBER" } }) {
  const [state, formAction] = useActionState(action, {}); const [role, setRole] = useState(member.role);
  return <form action={formAction} className="team-profile-form" noValidate><label><span>Full name</span><input aria-invalid={Boolean(state.fieldErrors?.name)} defaultValue={member.name} name="name" /></label><label><span>Job title</span><input aria-invalid={Boolean(state.fieldErrors?.title)} defaultValue={member.title ?? ""} name="title" placeholder="Operations lead" /></label><div className="team-select-field"><span id="profile-role">Workspace role</span><PremiumSelect ariaLabelledBy="profile-role" invalid={Boolean(state.fieldErrors?.role)} name="role" onChange={(value) => setRole(value as "ADMIN" | "MEMBER")} options={[{ value: "MEMBER", label: "Member" }, { value: "ADMIN", label: "Administrator" }]} placeholder="Member" value={role} /></div><div className="team-profile-submit"><PendingButton label="Save profile" /></div>{state.error ? <p className="team-feedback error" role="alert">{state.error}</p> : null}{state.success ? <p className="team-feedback" role="status">{state.success}</p> : null}</form>;
}

export function RoleForm({ action, currentRole }: { action: (state: TeamActionState, formData: FormData) => Promise<TeamActionState>; currentRole: "ADMIN" | "MEMBER" }) {
  const [state, formAction] = useActionState(action, {}); const [role, setRole] = useState(currentRole);
  return <form action={formAction} className="team-inline-form"><span className="sr-only" id="team-role-label">Team role</span><PremiumSelect ariaLabelledBy="team-role-label" name="role" onChange={(value) => setRole(value as "ADMIN" | "MEMBER")} options={[{ value: "MEMBER", label: "Member" }, { value: "ADMIN", label: "Administrator" }]} placeholder="Member" value={role} /><PendingButton label="Save role" />{state.error ? <span className="inline-error" role="alert">{state.error}</span> : null}</form>;
}

export function TeamMutationForm({ action, label, destructive = false }: { action: (state: TeamActionState) => Promise<TeamActionState>; label: string; destructive?: boolean }) {
  const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className="team-mutation-form"><PendingButton destructive={destructive} label={label} />{state.error ? <span className="inline-error" role="alert">{state.error}</span> : null}</form>;
}

function PendingButton({ label, destructive = false }: { label: string; destructive?: boolean }) {
  const { pending } = useFormStatus();
  return <button aria-busy={pending || undefined} className={destructive ? "team-button danger pending-action" : "team-button pending-action"} disabled={pending} type="submit"><PendingActionContent label={label} pending={pending} pendingLabel="Working…" /></button>;
}
