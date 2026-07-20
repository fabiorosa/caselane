"use client";

import Link from "next/link";
import { useState } from "react";

import { PremiumSelect, type PremiumSelectOption } from "@/components/premium-select";

type DirectoryFiltersProps = {
  archived: boolean;
  clearHref: string;
  hasFilters: boolean;
  search?: string;
};

export function ClientDirectoryFilters({ archived, clearHref, hasFilters, search }: DirectoryFiltersProps) {
  const [archivedValue, setArchivedValue] = useState(archived ? "true" : "false");

  return <form className="client-filters" method="get"><label>Search<input defaultValue={search} name="search" placeholder="Client name" type="search" /></label><div className="filter-select-field"><span id="client-status-filter">Status</span><PremiumSelect ariaLabelledBy="client-status-filter" name="archived" onChange={setArchivedValue} options={[{ value: "false", label: "Active clients" }, { value: "true", label: "Archived clients" }]} placeholder="Active clients" value={archivedValue} /></div><button type="submit">Apply filters</button>{hasFilters ? <Link href={clearHref}>Clear</Link> : null}</form>;
}

type CaseQueueFiltersProps = {
  assigneeId?: string;
  clearHref: string;
  clientId?: string;
  clients: PremiumSelectOption[];
  hasFilters: boolean;
  members: PremiumSelectOption[];
  overdue: boolean;
  priority?: string;
  search?: string;
  status?: string;
  view: "list" | "board";
};

const statusOptions: PremiumSelectOption[] = ["NEW", "TRIAGED", "IN_PROGRESS", "WAITING_ON_CLIENT", "RESOLVED", "CLOSED"].map((value) => ({ value, label: value.split("_").map((part) => part[0] + part.slice(1).toLowerCase()).join(" ") }));
const priorityOptions: PremiumSelectOption[] = ["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }));

export function CaseQueueFilters({ assigneeId, clearHref, clientId, clients, hasFilters, members, overdue, priority, search, status, view }: CaseQueueFiltersProps) {
  const [statusValue, setStatusValue] = useState(status ?? "");
  const [priorityValue, setPriorityValue] = useState(priority ?? "");
  const [assigneeValue, setAssigneeValue] = useState(assigneeId ?? "");
  const [clientValue, setClientValue] = useState(clientId ?? "");

  return <form className="case-queue-filters"><label>Search<input defaultValue={search} name="search" placeholder="Title or case number" type="search" /></label><div className="filter-select-field"><span id="queue-status-filter">Status</span><PremiumSelect ariaLabelledBy="queue-status-filter" name="status" onChange={setStatusValue} options={[{ value: "", label: "All statuses" }, ...statusOptions]} placeholder="All statuses" value={statusValue} /></div><div className="filter-select-field"><span id="queue-priority-filter">Priority</span><PremiumSelect ariaLabelledBy="queue-priority-filter" name="priority" onChange={setPriorityValue} options={[{ value: "", label: "All priorities" }, ...priorityOptions]} placeholder="All priorities" value={priorityValue} /></div><div className="filter-select-field"><span id="queue-assignee-filter">Assignee</span><PremiumSelect ariaLabelledBy="queue-assignee-filter" name="assigneeId" onChange={setAssigneeValue} options={[{ value: "", label: "Anyone" }, { value: "unassigned", label: "Unassigned" }, ...members]} placeholder="Anyone" value={assigneeValue} /></div><div className="filter-select-field"><span id="queue-client-filter">Client</span><PremiumSelect ariaLabelledBy="queue-client-filter" name="clientId" onChange={setClientValue} options={[{ value: "", label: "All clients" }, ...clients]} placeholder="All clients" value={clientValue} /></div><label className="overdue-check"><input defaultChecked={overdue} name="overdue" type="checkbox" value="true" /> Overdue only</label><input name="view" type="hidden" value={view} /><button type="submit">Apply</button>{hasFilters ? <Link href={clearHref}>Clear</Link> : null}</form>;
}
