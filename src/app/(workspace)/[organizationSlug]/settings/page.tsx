import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { setCategoryArchivedAction, saveCategoryAction, updateOrganizationAction } from "./actions";
import { OrganizationSettingsForm, CategorySettingsForm } from "@/components/settings-controls";
import { WorkspaceTopbar } from "@/components/workspace-shell";
import { getDatabase } from "@/db/client";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { createSettingsRepository } from "@/db/repositories/settings";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export default async function SettingsPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params; const database = getDatabase(); const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store)); if (!user) redirect(`/sign-in?returnTo=/${organizationSlug}/settings`);
  const context = await resolveWorkspaceContext(createOrganizationContextRepository(database), user, organizationSlug); if (!context || context.role === "CLIENT") notFound();
  const settings = await createSettingsRepository(database).get(context.id); if (!settings) notFound();
  const canEditCategories = context.role === "OWNER" || context.role === "ADMIN";
  return <main className="clients-page"><WorkspaceTopbar slug={context.slug} active="settings" isDemo={context.isDemo} /><div className="settings-page"><header><p className="auth-kicker">Workspace settings</p><h1>Shape the operation</h1><p>Keep the workspace identity and request categories clear for both the team and clients.</p></header><section className="settings-section"><div><h2>Workspace identity</h2><p>This name appears across the internal workspace and client portal.</p></div><OrganizationSettingsForm action={updateOrganizationAction.bind(null, context.slug)} editable={context.role === "OWNER"} name={settings.organization.name} /></section><section className="settings-section settings-categories"><div><h2>Request categories</h2><p>Categories keep intake consistent without turning the workflow into a custom builder.</p></div><div className="settings-category-list">{settings.categories.length === 0 ? <p className="settings-empty">No request categories yet.</p> : null}{settings.categories.map((category) => <CategorySettingsForm action={saveCategoryAction.bind(null, context.slug, category.id)} archiveAction={setCategoryArchivedAction.bind(null, context.slug, category.id, !category.archived)} category={category} editable={canEditCategories} key={category.id} />)}{canEditCategories ? <CategorySettingsForm action={saveCategoryAction.bind(null, context.slug, null)} editable /> : null}</div></section></div></main>;
}
