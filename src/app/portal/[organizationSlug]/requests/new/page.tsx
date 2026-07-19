import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { PortalRequestForm } from "@/components/portal-request-form";
import { getDatabase } from "@/db/client";
import { getPortalCategories, resolvePortalIdentity } from "@/db/repositories/portal";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { getCurrentUserContext } from "@/services/session-service";
import { submitPortalRequestAction } from "../actions";
import { getServerEnvironment } from "@/env";

export default async function NewPortalRequestPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params; const database = getDatabase(); const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined }; const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store)); if (!user) redirect(`/sign-in?returnTo=/portal/${organizationSlug}/requests/new`); const identity = await resolvePortalIdentity(database, user.userId, organizationSlug); if (!identity) { if (getServerEnvironment().DEMO_ACCESS_ENABLED && organizationSlug === "orbit-labs") redirect("/sign-in?demoError=Choose+the+Client+perspective+to+open+the+portal."); notFound(); } const categories = await getPortalCategories(database, identity);
  return <main className="portal-page"><header className="portal-header"><Link href={`/portal/${organizationSlug}/requests`} className="portal-brand"><i aria-hidden="true"><b/><b/><b/></i>CaseLane</Link><div><span>{identity.clientName}</span><strong>{identity.contactName}</strong></div></header><div className="portal-editor"><Link className="portal-back" href={`/portal/${organizationSlug}/requests`}>Back to requests</Link><p className="portal-kicker">New request</p><h1>Tell the team what you need.</h1><p className="portal-intro">Your request enters the same operational queue the team uses, with your identity and organization attached automatically.</p><PortalRequestForm action={submitPortalRequestAction.bind(null, organizationSlug)} cancelHref={`/portal/${organizationSlug}/requests`} categories={categories} /></div></main>;
}
