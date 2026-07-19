import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { updateClientAction } from "../../actions";
import { ClientForm } from "@/components/client-form";
import { getDatabase } from "@/db/client";
import { createClientManagementRepository } from "@/db/repositories/client-management";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { canManageClients } from "@/services/client-list";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export default async function EditClientPage({ params }: { params: Promise<{ organizationSlug: string; clientId: string }> }) {
  const { organizationSlug, clientId } = await params;
  const database = getDatabase(); const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store));
  if (!user) redirect(`/sign-in?returnTo=/${organizationSlug}/clients`);
  const context = await resolveWorkspaceContext(createOrganizationContextRepository(database), user, organizationSlug);
  if (!context || !canManageClients(context.role)) notFound();
  const client = await createClientManagementRepository(database).findForEdit(context.id, clientId); if (!client) notFound();
  const defaults = Object.fromEntries(Object.entries(client).map(([key, value]) => [key, value ?? undefined]));
  return <main className="clients-page"><header className="team-topbar"><Link className="auth-brand" href={`/${context.slug}/overview`}><i aria-hidden="true"><b /><b /><b /></i>CaseLane</Link><Link className="quiet-button" href={`/${context.slug}/clients`}>Back to clients</Link></header><div className="client-editor-page"><p className="auth-kicker">Client directory</p><h1>Edit client</h1><p>Update client identity and the active primary contact.</p><ClientForm action={updateClientAction.bind(null, context.slug, clientId)} cancelHref={`/${context.slug}/clients`} defaults={defaults} submitLabel="Save changes" /></div></main>;
}
