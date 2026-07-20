"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { PortalReplyState } from "@/app/portal/[organizationSlug]/requests/actions";
import { PendingActionContent } from "@/components/pending-indicator";
export function PortalReplyForm({action}:{action:(state:PortalReplyState,data:FormData)=>Promise<PortalReplyState>}) { const [state,formAction]=useActionState(action,{}); return <form action={formAction} className="portal-reply-form" noValidate><label><span>Reply to the team</span><textarea aria-invalid={Boolean(state.fieldErrors?.body)} name="body" placeholder="Add the information the team needs." rows={5}/></label>{state.fieldErrors?.body?.map(error=><small key={error}>{error}</small>)}{state.error?<p role="alert">{state.error}</p>:null}{state.success?<p className="portal-reply-success" role="status">{state.success}</p>:null}<ReplyButton/></form> }
function ReplyButton(){const {pending}=useFormStatus();return <button aria-busy={pending || undefined} className="pending-action" disabled={pending} type="submit"><PendingActionContent label="Send reply" pending={pending} pendingLabel="Sending reply…" /></button>}
