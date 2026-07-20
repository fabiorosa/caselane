import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { WorkspaceTopbar } from "@/components/workspace-shell";
import { getDatabase } from "@/db/client";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createOverviewRepository } from "@/db/repositories/overview";
import { createSessionRepository } from "@/db/repositories/sessions";
import { overviewMetricHref, type OverviewMetric } from "@/domain/overview-metric-links";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export default async function OverviewPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  const database = getDatabase();
  const jar = await cookies();
  const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store));

  if (!user) redirect(`/sign-in?returnTo=/${organizationSlug}/overview`);

  const context = await resolveWorkspaceContext(createOrganizationContextRepository(database), user, organizationSlug);
  if (!context) notFound();

  const snapshot = await createOverviewRepository(database).getSnapshot(context.id, systemClock.now());
  const empty = snapshot.counts.open === 0 && snapshot.recentActivity.length === 0;

  return <main className="clients-page">
    <WorkspaceTopbar slug={context.slug} active="overview" isDemo={context.isDemo} />
    <div className="clients-content">
      <section className="clients-heading">
        <div>
          <p className="auth-kicker">Operational overview</p>
          <h1>{context.name}</h1>
          <p>See where client work needs attention, then move directly into the queue.</p>
        </div>
      </section>
      {empty ? <section className="clients-empty">
        <h2>Your workspace is ready</h2>
        <p>Add a client, then create the first case to start tracking ownership, deadlines, and communication.</p>
      </section> : <>
        <section className="overview-metrics" aria-label="Case health shortcuts">
          <Metric label="Open" metric="open" slug={context.slug} value={snapshot.counts.open} />
          <Metric label="Overdue" metric="overdue" slug={context.slug} value={snapshot.counts.overdue} warning />
          <Metric label="Unassigned" metric="unassigned" slug={context.slug} value={snapshot.counts.unassigned} />
          <Metric label="Waiting on client" metric="waitingOnClient" slug={context.slug} value={snapshot.counts.waitingOnClient} />
        </section>
        <section className="activity-ledger">
          <div className="client-directory-heading"><h2>Recent activity</h2><span>{snapshot.recentActivity.length}</span></div>
          {snapshot.recentActivity.map((activity) => <Link className="activity-row navigable-row" href={`/${context.slug}/cases/${activity.caseId}`} key={activity.id}>
            <div><strong>CL-{activity.caseSequence} · {activity.caseTitle}</strong><p>{activity.clientName} · {activity.eventType.replaceAll("_", " ").toLowerCase()}</p></div>
            <div><span>{activity.actorName ?? "System"}</span><time dateTime={activity.createdAt.toISOString()}>{activity.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></div>
          </Link>)}
        </section>
      </>}
    </div>
  </main>;
}

function Metric({ label, metric, slug, value, warning = false }: { label: string; metric: OverviewMetric; slug: string; value: number; warning?: boolean }) {
  const caseLabel = value === 1 ? "case" : "cases";

  return <Link className={warning && value ? "metric-warning" : undefined} href={overviewMetricHref(slug, metric)} aria-label={`View ${value} ${label.toLowerCase()} ${caseLabel}`}>
    <strong>{value}</strong>
    <span>{label}</span>
    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" /></svg>
  </Link>;
}
