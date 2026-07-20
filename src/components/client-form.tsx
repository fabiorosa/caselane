"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import type { ClientFormState } from "@/app/(workspace)/[organizationSlug]/clients/actions";
import { PendingActionContent } from "@/components/pending-indicator";

type Defaults = Record<string, string | undefined>;

export function ClientForm({ action, cancelHref, defaults = {}, submitLabel }: { action: (state: ClientFormState, data: FormData) => Promise<ClientFormState>; cancelHref: string; defaults?: Defaults; submitLabel: string }) {
  const [state, formAction] = useActionState(action, {});
  const [dirty, setDirty] = useState(false);
  useEffect(() => { const guard = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard); }, [dirty]);
  const value = (key: string) => state.values?.[key] ?? defaults[key] ?? "";
  return <form action={formAction} className="client-editor" noValidate onChange={() => setDirty(true)}><fieldset><legend>Client identity</legend><label>Name<input aria-invalid={Boolean(state.fieldErrors?.name)} defaultValue={value("name")} name="name" required /></label>{state.fieldErrors?.name?.map((message) => <small key={message}>{message}</small>)}<label>External reference <span>Optional</span><input defaultValue={value("externalReference")} name="externalReference" /></label><label>Internal notes <span>Optional</span><textarea defaultValue={value("notes")} name="notes" rows={5} /></label></fieldset><fieldset><legend>Primary contact <span>Optional</span></legend><p>Add the person your team should contact first. Both name and email are required when this section is used.</p><label>Full name<input aria-invalid={Boolean(state.fieldErrors?.contactName)} defaultValue={value("contactName")} name="contactName" /></label>{state.fieldErrors?.contactName?.map((message) => <small key={message}>{message}</small>)}<label>Work email<input aria-invalid={Boolean(state.fieldErrors?.contactEmail)} defaultValue={value("contactEmail")} name="contactEmail" type="email" /></label>{state.fieldErrors?.contactEmail?.map((message) => <small key={message}>{message}</small>)}<label>Job title <span>Optional</span><input defaultValue={value("contactJobTitle")} name="contactJobTitle" /></label></fieldset>{state.error ? <p className="client-form-error" role="alert">{state.error}</p> : null}<div className="client-editor-actions"><Link href={cancelHref} onClick={(event) => { if (dirty && !window.confirm("Discard your unsaved changes?")) event.preventDefault(); }}>Cancel</Link><SubmitButton label={submitLabel} /></div></form>;
}

function SubmitButton({ label }: { label: string }) { const { pending } = useFormStatus(); return <button aria-busy={pending || undefined} className="pending-action" disabled={pending} type="submit"><PendingActionContent label={label} pending={pending} pendingLabel="Saving…" /></button>; }
