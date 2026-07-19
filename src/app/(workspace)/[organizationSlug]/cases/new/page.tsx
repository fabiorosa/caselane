import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createCaseAction } from "../actions";
import { CaseIntakeForm } from "@/components/case-intake-form";
import { WorkspaceTopbar } from "@/components/workspace-shell";
import { getDatabase } from "@/db/client";
import { getCaseIntakeOptions } from "@/db/repositories/case-intake";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export default async function NewCasePage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params; const database = getDatabase(); const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store)); if (!user) redirect(`/sign-in?returnTo=/${organizationSlug}/cases/new`);
  const context = await resolveWorkspaceContext(createOrganizationContextRepository(database), user, organizationSlug); if (!context || context.role === "CLIENT") notFound();
  const options = await getCaseIntakeOptions(database, context.id);
  return <main className="clients-page"><WorkspaceTopbar slug={context.slug} active="cases" isDemo={context.isDemo} /><div className="case-intake-page"><p className="auth-kicker">Case intake</p><h1>New case</h1><p>Capture the request, connect it to the right client, and make ownership clear from the start.</p>{options.clients.length ? <CaseIntakeForm action={createCaseAction.bind(null, context.slug)} cancelHref={`/${context.slug}/cases`} options={options} /> : <div className="clients-empty"><h2>Add a client first</h2><p>A case needs an active client before it can enter the queue.</p></div>}</div></main>;
}
