"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ContactActionState } from "@/app/(workspace)/[organizationSlug]/clients/actions";
import { PendingActionContent } from "@/components/pending-indicator";

type Contact = { id: string; name: string; email: string; jobTitle: string | null; isPrimary: boolean };

export function ContactEditor({ action, archiveAction, contact }: { action: (state: ContactActionState, data: FormData) => Promise<ContactActionState>; archiveAction?: () => Promise<void>; contact?: Contact }) {
  const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className="contact-editor"><div><label>Name<input aria-invalid={Boolean(state.fieldErrors?.name)} defaultValue={contact?.name} name="name" required />{state.fieldErrors?.name?.map((message) => <small key={message}>{message}</small>)}</label><label>Email<input aria-invalid={Boolean(state.fieldErrors?.email)} defaultValue={contact?.email} name="email" required type="email" />{state.fieldErrors?.email?.map((message) => <small key={message}>{message}</small>)}</label><label>Role <span>Optional</span><input aria-invalid={Boolean(state.fieldErrors?.jobTitle)} defaultValue={contact?.jobTitle ?? ""} name="jobTitle" />{state.fieldErrors?.jobTitle?.map((message) => <small key={message}>{message}</small>)}</label><label className="primary-check"><input defaultChecked={contact?.isPrimary} name="isPrimary" type="checkbox" /> Primary contact</label></div>{state.error ? <p role="alert">{state.error}</p> : state.success ? <p className="success" role="status">{state.success}</p> : null}<footer>{archiveAction ? <ArchiveContact action={archiveAction} /> : <span />}<SaveContact label={contact ? "Save contact" : "Add contact"} /></footer></form>;
}

function SaveContact({ label }: { label: string }) { const { pending } = useFormStatus(); return <button aria-busy={pending || undefined} className="contact-save pending-action" disabled={pending} type="submit"><PendingActionContent label={label} pending={pending} pendingLabel="Saving…" /></button>; }
function ArchiveContact({ action }: { action: () => Promise<void> }) { const { pending } = useFormStatus(); return <button aria-busy={pending || undefined} className="danger-text pending-action" disabled={pending} formAction={action} onClick={(event) => { if (!window.confirm("Archive this contact?")) event.preventDefault(); }} type="submit"><PendingActionContent label="Archive" pending={pending} pendingLabel="Archiving…" /></button>; }

export function ArchiveClientButton({ action }: { action: () => Promise<void> }) { return <form action={action}><ArchiveClientSubmit /></form>; }
function ArchiveClientSubmit() { const { pending } = useFormStatus(); return <button aria-busy={pending || undefined} className="client-archive-action pending-action" disabled={pending} onClick={(event) => { if (!window.confirm("Archive this client? Existing case history will remain available.")) event.preventDefault(); }} type="submit"><PendingActionContent label="Archive client" pending={pending} pendingLabel="Archiving…" /></button>; }
