"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { PortalRequestFormState } from "@/app/portal/[organizationSlug]/requests/actions";
import { PendingActionContent } from "@/components/pending-indicator";
import { PremiumSelect } from "@/components/premium-select";

export function PortalRequestForm({ action, cancelHref, categories }: { action: (state: PortalRequestFormState, formData: FormData) => Promise<PortalRequestFormState>; cancelHref: string; categories: Array<{ id: string; name: string }>; }) {
  const [state, formAction] = useActionState(action, {}); const [categoryId, setCategoryId] = useState(state.values?.categoryId ?? "");
  const errors = (name: string) => state.fieldErrors?.[name]?.map((error) => <small className="portal-field-error" key={error}>{error}</small>);
  return <form action={formAction} className="portal-request-form" noValidate>
    <label><span>What do you need help with?</span><input aria-invalid={Boolean(state.fieldErrors?.title)} defaultValue={state.values?.title} name="title" placeholder="A short, specific title" required />{errors("title")}</label>
    <label><span>Request details</span><textarea aria-invalid={Boolean(state.fieldErrors?.description)} defaultValue={state.values?.description} name="description" placeholder="Include the context, desired outcome, and any timing that matters." required rows={8} />{errors("description")}</label>
    <div className="portal-category-field"><span id="portal-category-label">Category <small>Optional</small></span><PremiumSelect ariaLabelledBy="portal-category-label" name="categoryId" onChange={setCategoryId} options={[{ value: "", label: "Let the team decide" }, ...categories.map((item) => ({ value: item.id, label: item.name }))]} placeholder="Let the team decide" value={categoryId} />{errors("categoryId")}</div>
    {state.error ? <p className="portal-form-error" role="alert">{state.error}</p> : null}
    <div className="portal-form-actions"><Link href={cancelHref}>Cancel</Link><PortalSubmit /></div>
  </form>;
}

function PortalSubmit() { const { pending } = useFormStatus(); return <button aria-busy={pending || undefined} className="pending-action" disabled={pending} type="submit"><PendingActionContent label="Send request" pending={pending} pendingLabel="Sending request…" /></button>; }
