"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { CaseStatus } from "@/domain/case-workflow";
import type { WorkroomActionState } from "@/app/(workspace)/[organizationSlug]/cases/[caseId]/actions";
import { PremiumSelect } from "@/components/premium-select";

type Action = (state: WorkroomActionState, data: FormData) => Promise<WorkroomActionState>;
type Option = { id: string; name: string };

export function CaseDetailsForm({ action, updatedAt, priority, categoryId, assigneeId, dueAt, categories, members }: { action: Action; updatedAt: string; priority: string; categoryId: string; assigneeId: string; dueAt: string; categories: Option[]; members: Option[] }) {
  const [state, formAction] = useActionState(action, {}); const [priorityValue, setPriority] = useState(priority); const [category, setCategory] = useState(categoryId); const [assignee, setAssignee] = useState(assigneeId);
  return <form action={formAction} className="workroom-details-form"><input name="expectedUpdatedAt" type="hidden" value={updatedAt} /><div className="workroom-field"><span id="workroom-priority">Priority</span><PremiumSelect ariaLabelledBy="workroom-priority" name="priority" onChange={setPriority} options={["LOW","NORMAL","HIGH","URGENT"].map((value) => ({ value, label: label(value) }))} placeholder="Normal" value={priorityValue} /></div><div className="workroom-field"><span id="workroom-category">Category</span><PremiumSelect ariaLabelledBy="workroom-category" name="categoryId" onChange={setCategory} options={[{ value: "", label: "No category" }, ...categories.map((item) => ({ value: item.id, label: item.name }))]} placeholder="No category" value={category} /></div><div className="workroom-field"><span id="workroom-assignee">Assignee</span><PremiumSelect ariaLabelledBy="workroom-assignee" name="assigneeId" onChange={setAssignee} options={[{ value: "", label: "Unassigned" }, ...members.map((item) => ({ value: item.id, label: item.name }))]} placeholder="Unassigned" value={assignee} /></div><label className="workroom-field"><span>Due date</span><input defaultValue={dueAt} name="dueAt" type="date" /></label><FormNotice state={state} /><Submit label="Save details" pendingLabel="Saving…" /></form>;
}

export function CaseStatusActions({ action, status, updatedAt, transitions }: { action: Action; status: CaseStatus; updatedAt: string; transitions: CaseStatus[] }) {
  const [state, formAction] = useActionState(action, {});
  return <form action={formAction} className="status-actions"><input name="expectedUpdatedAt" type="hidden" value={updatedAt} /><div><span>Current status</span><strong className={`queue-status status-${status.toLowerCase().replaceAll("_", "-")}`}>{label(status)}</strong></div>{transitions.map((next) => <button key={next} name="toStatus" type="submit" value={next}>{actionLabel(status, next)}</button>)}<FormNotice state={state} /></form>;
}

export function CaseMessageComposer({ action, updatedAt }: { action: Action; updatedAt: string }) {
  const [state, formAction] = useActionState(action, {}); const [visibility, setVisibility] = useState("INTERNAL");
  return <form action={formAction} className={`message-composer ${visibility === "INTERNAL" ? "is-internal" : "is-client"}`}><input name="expectedUpdatedAt" type="hidden" value={updatedAt} /><header><div><span id="message-visibility">Visibility</span><strong>{visibility === "INTERNAL" ? "Team only" : "Visible to client"}</strong></div><PremiumSelect ariaLabelledBy="message-visibility" name="visibility" onChange={setVisibility} options={[{ value: "INTERNAL", label: "Internal note" }, { value: "CLIENT", label: "Client reply" }]} placeholder="Internal note" value={visibility} /></header><textarea aria-label={visibility === "INTERNAL" ? "Internal note" : "Client reply"} name="body" placeholder={visibility === "INTERNAL" ? "Add context only your team should see…" : "Write a reply the client can read…"} rows={5} /><p>{visibility === "INTERNAL" ? "Never shared with client users." : "This message will appear in the client portal."}</p><FormNotice state={state} /><Submit label={visibility === "INTERNAL" ? "Add internal note" : "Send client reply"} pendingLabel="Sending…" /></form>;
}

function Submit({ label: text, pendingLabel }: { label: string; pendingLabel: string }) { const { pending } = useFormStatus(); return <button disabled={pending} type="submit">{pending ? pendingLabel : text}</button>; }
function FormNotice({ state }: { state: WorkroomActionState }) { return state.error ? <p className="workroom-error" role="alert">{state.error}</p> : state.success ? <p className="workroom-success" role="status">{state.success}</p> : null; }
function label(value: string) { return value.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()); }
function actionLabel(from: CaseStatus, to: CaseStatus) { if (to === "IN_PROGRESS" && ["RESOLVED","CLOSED"].includes(from)) return "Reopen case"; return { NEW: "Move to new", TRIAGED: "Mark triaged", IN_PROGRESS: "Start work", WAITING_ON_CLIENT: "Wait on client", RESOLVED: "Resolve case", CLOSED: "Close case" }[to]; }
