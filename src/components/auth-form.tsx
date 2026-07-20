"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthFormState } from "@/app/(auth)/actions";
import { PendingActionContent } from "@/components/pending-indicator";

interface AuthFormProps {
  mode: "register" | "sign-in";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  returnTo?: string | null;
}

const initialState: AuthFormState = {};

export function AuthForm({ mode, action, returnTo }: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const isRegistration = mode === "register";

  return (
    <form className="auth-form" action={formAction} noValidate>
      {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}
      {isRegistration ? <Field label="Full name" name="name" autoComplete="name" errors={state.fieldErrors?.name} /> : null}
      <Field label="Work email" name="email" type="email" autoComplete="email" errors={state.fieldErrors?.email} />
      <Field label="Password" name="password" type="password" autoComplete={isRegistration ? "new-password" : "current-password"} errors={state.fieldErrors?.password} hint={isRegistration ? "Use 12 to 128 characters. Spaces are allowed." : undefined} />
      {isRegistration ? <Field label="Workspace name" name="workspaceName" autoComplete="organization" errors={state.fieldErrors?.workspaceName} /> : null}
      {isRegistration ? (
        <label className="terms-control">
          <input name="acceptedTerms" type="checkbox" />
          <span>I agree to the terms of use.</span>
        </label>
      ) : null}
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <SubmitButton>{isRegistration ? "Create workspace" : "Sign in"}</SubmitButton>
      <p className="auth-switch">
        {isRegistration ? "Already have an account?" : "Need a workspace?"}{" "}
        <Link href={isRegistration ? "/sign-in" : "/register"}>{isRegistration ? "Sign in" : "Create one"}</Link>
      </p>
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete, errors, hint }: { label: string; name: string; type?: string; autoComplete: string; errors?: string[]; hint?: string }) {
  const errorId = `${name}-error`;
  return (
    <label className="field-control" htmlFor={name}>
      <span>{label}</span>
      <input aria-describedby={errors?.length ? errorId : undefined} aria-invalid={Boolean(errors?.length)} autoComplete={autoComplete} id={name} name={name} type={type} />
      {hint ? <small>{hint}</small> : null}
      {errors?.map((error) => <small className="field-error" id={errorId} key={error}>{error}</small>)}
    </label>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <button aria-busy={pending || undefined} className="auth-submit pending-action" disabled={pending} type="submit"><PendingActionContent label={children} pending={pending} pendingLabel="Working…" /></button>;
}
