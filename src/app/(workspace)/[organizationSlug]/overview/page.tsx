import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { WorkspaceTopbar } from "@/components/workspace-shell";
import { getDatabase } from "@/db/client";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createOverviewRepository } from "@/db/repositories/overview";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export default async function OverviewPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params; const database = getDatabase(); const jar = await cookies();
  const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store));
  if (!user) redirect(`/sign-in?returnTo=/${organizationSlug}/overview`);
  const context = await resolveWorkspaceContext(createOrganizationContextRepository(database), user, organizationSlug); if (!context) notFound();
  const snapshot = await createOverviewRepository(database).getSnapshot(context.id, systemClock.now());
  const empty = snapshot.counts.open === 0 && snapshot.recentActivity.length === 0;
  return <main className="clients-page"><WorkspaceTopbar slug={context.slug} active="overview" isDemo={context.isDemo} /><div className="clients-content"><section className="clients-heading"><div><p className="auth-kicker">Operational overview</p><h1>{context.name}</h1><p>See where client work needs attention, then move directly into the queue.</p></div></section>{empty ? <section className="clients-empty"><h2>Your workspace is ready</h2><p>Add a client, then create the first case to start tracking ownership, deadlines, and communication.</p></section> : <><section className="overview-metrics" aria-label="Case health"><Metric label="Open" value={snapshot.counts.open} /><Metric label="Overdue" value={snapshot.counts.overdue} warning /><Metric label="Unassigned" value={snapshot.counts.unassigned} /><Metric label="Waiting on client" value={snapshot.counts.waitingOnClient} /></section><section className="activity-ledger"><div className="client-directory-heading"><h2>Recent activity</h2><span>{snapshot.recentActivity.length}</span></div>{snapshot.recentActivity.map((a) => <article key={a.id}><div><strong>CL-{a.caseSequence} · {a.caseTitle}</strong><p>{a.clientName} · {a.eventType.replaceAll("_", " ").toLowerCase()}</p></div><div><span>{a.actorName ?? "System"}</span><time dateTime={a.createdAt.toISOString()}>{a.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></div></article>)}</section></>}</div></main>;
}
function Metric({ label, value, warning = false }: { label: string; value: number; warning?: boolean }) { return <div className={warning && value ? "metric-warning" : undefined}><strong>{value}</strong><span>{label}</span></div>; }
