"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { InvitationFormState } from "@/app/(auth)/accept-invite/[token]/actions";

export function NewInvitationForm({ action }: { action: (state: InvitationFormState, formData: FormData) => Promise<InvitationFormState> }) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="auth-form" noValidate>
      <label className="field-control" htmlFor="name"><span>Full name</span><input aria-describedby={state.fieldErrors?.name ? "name-error" : undefined} aria-invalid={Boolean(state.fieldErrors?.name)} autoComplete="name" id="name" name="name" />{state.fieldErrors?.name?.map((error) => <small className="field-error" id="name-error" key={error}>{error}</small>)}</label>
      <label className="field-control" htmlFor="password"><span>Password</span><input aria-describedby={state.fieldErrors?.password ? "password-error" : "password-hint"} aria-invalid={Boolean(state.fieldErrors?.password)} autoComplete="new-password" id="password" name="password" type="password" /><small id="password-hint">Use 12 to 128 characters. Spaces are allowed.</small>{state.fieldErrors?.password?.map((error) => <small className="field-error" id="password-error" key={error}>{error}</small>)}</label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <PendingButton label="Create account and join" />
    </form>
  );
}

export function ExistingInvitationForm({ action }: { action: (state: InvitationFormState) => Promise<InvitationFormState> }) {
  const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className="auth-form">{state.error ? <p className="form-error" role="alert">{state.error}</p> : null}<PendingButton label="Join workspace" /></form>;
}

function PendingButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="auth-submit" disabled={pending} type="submit">{pending ? "Joining…" : label}</button>;
}
