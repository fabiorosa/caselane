"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { SettingsActionState } from "@/app/(workspace)/[organizationSlug]/settings/actions";

type Action = (state: SettingsActionState, formData: FormData) => Promise<SettingsActionState>;

export function OrganizationSettingsForm({ action, name, editable }: { action: Action; name: string; editable: boolean }) {
  const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className="settings-form"><label><span>Workspace name</span><input aria-invalid={Boolean(state.fieldErrors?.name)} defaultValue={name} disabled={!editable} name="name" />{state.fieldErrors?.name?.map((error) => <small key={error}>{error}</small>)}</label>{editable ? <Submit label="Save workspace" /> : <p className="settings-note">Only the workspace owner can change this name.</p>}<Notice state={state} /></form>;
}

export function CategorySettingsForm({ action, archiveAction, category, editable }: { action: Action; archiveAction?: Action; category?: { name: string; color: string; archived: boolean }; editable: boolean }) {
  const [state, formAction] = useActionState(action, {});
  const [archiveState, archiveFormAction] = useActionState(archiveAction ?? action, {});
  return <div className={`settings-category ${category?.archived ? "archived" : ""}`}><form action={formAction} className="settings-category-fields"><label><span>Name</span><input aria-invalid={Boolean(state.fieldErrors?.name)} defaultValue={category?.name ?? ""} disabled={!editable || category?.archived} name="name" required />{state.fieldErrors?.name?.map((error) => <small key={error}>{error}</small>)}</label><label className="settings-color"><span>Color</span><input aria-label={`${category?.name ?? "New category"} color`} defaultValue={category?.color ?? "#d9a441"} disabled={!editable || category?.archived} name="color" type="color" /></label>{editable && !category?.archived ? <Submit label={category ? "Save" : "Add category"} /> : null}<Notice state={state} /></form>{archiveAction && editable ? <form action={archiveFormAction} className="settings-archive"><Submit label={category?.archived ? "Restore" : "Archive"} quiet /><Notice state={archiveState} /></form> : null}</div>;
}

function Submit({ label, quiet = false }: { label: string; quiet?: boolean }) { const { pending } = useFormStatus(); return <button className={quiet ? "quiet" : undefined} disabled={pending} type="submit">{pending ? "Saving..." : label}</button>; }
function Notice({ state }: { state: SettingsActionState }) { return state.error ? <p className="settings-error" role="alert">{state.error}</p> : state.success ? <p className="settings-success" role="status">{state.success}</p> : null; }
