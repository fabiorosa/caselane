import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/db/client";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { getCurrentUserContext } from "@/services/session-service";

export default async function WorkspacePage() {
  const cookieJar = await cookies();
  const cookieStore: SessionCookieStore = { get: (name) => cookieJar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(getDatabase()), systemClock, readSessionCookie(cookieStore));
  if (!user) redirect("/sign-in?returnTo=/workspace");

  const organizations = await createOrganizationContextRepository(getDatabase()).listAccessibleOrganizations(user.userId);
  if (organizations.length > 0) {
    const organization = organizations[0];
    redirect(organization.role === "CLIENT" ? `/portal/${organization.slug}/requests` : `/${organization.slug}/overview`);
  }

  return <main className="auth-page"><section className="auth-panel"><p className="auth-kicker">No workspace available</p><h1>You do not have an active workspace.</h1><p className="auth-description">Ask an owner or administrator to send you an invitation.</p></section></main>;
}
