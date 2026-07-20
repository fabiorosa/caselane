"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { CaseFormState } from "@/app/(workspace)/[organizationSlug]/cases/actions";
import { PendingActionContent } from "@/components/pending-indicator";
import { PremiumSelect, type PremiumSelectOption } from "@/components/premium-select";

type Options = {
  clients: Array<{ id: string; name: string }>;
  contacts: Array<{ id: string; clientId: string; name: string; email: string }>;
  categories: Array<{ id: string; name: string }>;
  members: Array<{ id: string; name: string }>;
};

const priorities: PremiumSelectOption[] = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function CaseIntakeForm({ action, cancelHref, options }: {
  action: (state: CaseFormState, data: FormData) => Promise<CaseFormState>;
  cancelHref: string;
  options: Options;
}) {
  const [state, formAction] = useActionState(action, {});
  const initialValue = (key: string) => state.values?.[key] ?? "";
  const [clientId, setClientId] = useState(initialValue("clientId"));
  const [requesterId, setRequesterId] = useState(initialValue("requesterContactId"));
  const [priority, setPriority] = useState(initialValue("priority") || "NORMAL");
  const [categoryId, setCategoryId] = useState(initialValue("categoryId"));
  const [assigneeId, setAssigneeId] = useState(initialValue("assigneeId"));
  const requesterOptions = options.contacts
    .filter((item) => item.clientId === clientId)
    .map((item) => ({ value: item.id, label: `${item.name} · ${item.email}` }));
  const fieldError = (key: string) => state.fieldErrors?.[key]?.map((message) => (
    <small className="case-field-error" key={message}>{message}</small>
  ));

  return (
    <form action={formAction} className="case-intake-form" noValidate>
      <fieldset>
        <legend>Request</legend>
        <div className="case-field">
          <FieldHeading id="case-client-label" label="Client" />
          <PremiumSelect
            ariaLabelledBy="case-client-label"
            invalid={Boolean(state.fieldErrors?.clientId)}
            name="clientId"
            onChange={(nextClientId) => {
              setClientId(nextClientId);
              setRequesterId("");
            }}
            options={options.clients.map((item) => ({ value: item.id, label: item.name }))}
            placeholder="Choose a client"
            value={clientId}
          />
          {fieldError("clientId")}
        </div>
        <div className="case-field">
          <FieldHeading id="case-requester-label" label="Requester" optional />
          <PremiumSelect
            ariaLabelledBy="case-requester-label"
            disabled={!clientId}
            invalid={Boolean(state.fieldErrors?.requesterContactId)}
            name="requesterContactId"
            onChange={setRequesterId}
            options={[{ value: "", label: "No requester selected" }, ...requesterOptions]}
            placeholder={clientId ? "No requester selected" : "Choose a client first"}
            value={requesterId}
          />
          {fieldError("requesterContactId")}
        </div>
        <label className="case-field wide">
          <FieldHeading label="Title" />
          <input aria-invalid={Boolean(state.fieldErrors?.title)} defaultValue={initialValue("title")} name="title" required />
          {fieldError("title")}
        </label>
        <label className="case-field wide">
          <FieldHeading label="Description" />
          <textarea aria-invalid={Boolean(state.fieldErrors?.description)} defaultValue={initialValue("description")} name="description" required rows={7} />
          {fieldError("description")}
        </label>
      </fieldset>
      <fieldset>
        <legend>Ownership</legend>
        <div className="case-field">
          <FieldHeading id="case-priority-label" label="Priority" />
          <PremiumSelect ariaLabelledBy="case-priority-label" name="priority" onChange={setPriority} options={priorities} placeholder="Normal" value={priority} />
          {fieldError("priority")}
        </div>
        <div className="case-field">
          <FieldHeading id="case-category-label" label="Category" optional />
          <PremiumSelect ariaLabelledBy="case-category-label" name="categoryId" onChange={setCategoryId} options={[{ value: "", label: "No category" }, ...options.categories.map((item) => ({ value: item.id, label: item.name }))]} placeholder="No category" value={categoryId} />
          {fieldError("categoryId")}
        </div>
        <div className="case-field">
          <FieldHeading id="case-assignee-label" label="Assignee" optional />
          <PremiumSelect ariaLabelledBy="case-assignee-label" name="assigneeId" onChange={setAssigneeId} options={[{ value: "", label: "Unassigned" }, ...options.members.map((item) => ({ value: item.id, label: item.name }))]} placeholder="Unassigned" value={assigneeId} />
          {fieldError("assigneeId")}
        </div>
        <label className="case-field">
          <FieldHeading label="Due date" optional />
          <input aria-invalid={Boolean(state.fieldErrors?.dueAt)} defaultValue={initialValue("dueAt")} name="dueAt" type="date" />
          {fieldError("dueAt")}
        </label>
      </fieldset>
      {state.error ? <p className="client-form-error" role="alert">{state.error}</p> : null}
      <div className="client-editor-actions"><Link href={cancelHref}>Cancel</Link><SubmitCase /></div>
    </form>
  );
}

function FieldHeading({ id, label, optional = false }: { id?: string; label: string; optional?: boolean }) {
  return <span className="case-field-heading" id={id}><b>{label}</b><small aria-hidden={!optional}>{optional ? "Optional" : "\u00a0"}</small></span>;
}

function SubmitCase() {
  const { pending } = useFormStatus();
  return <button aria-busy={pending || undefined} className="pending-action" disabled={pending} type="submit"><PendingActionContent label="Create case" pending={pending} pendingLabel="Creating…" /></button>;
}
