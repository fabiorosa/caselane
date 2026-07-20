import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getDatabase } from "@/db/client";
import { listPortalRequests, resolvePortalIdentity } from "@/db/repositories/portal";
import { createSessionRepository } from "@/db/repositories/sessions";
import { nextAction, portalRequestQuerySchema } from "@/domain/portal";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { getCurrentUserContext } from "@/services/session-service";
import { getServerEnvironment } from "@/env";

export default async function PortalRequestsPage({ params, searchParams }: { params: Promise<{ organizationSlug: string }>; searchParams: Promise<Record<string,string|string[]|undefined>> }) {
  const { organizationSlug } = await params; const raw = await searchParams; const database = getDatabase(); const jar = await cookies(); const store: SessionCookieStore = { get: (name) => jar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(store)); if (!user) redirect(`/sign-in?returnTo=/portal/${organizationSlug}/requests`);
  const identity = await resolvePortalIdentity(database, user.userId, organizationSlug); if (!identity) { if (getServerEnvironment().DEMO_ACCESS_ENABLED && organizationSlug === "orbit-labs") redirect("/sign-in?demoError=Choose+the+Client+perspective+to+open+the+portal."); notFound(); }
  const one = (key:string) => Array.isArray(raw[key]) ? raw[key]?.[0] : raw[key]; const parsed = portalRequestQuerySchema.safeParse({ state: one("state") ?? "open", search: one("search") || undefined }); const query = parsed.success ? parsed.data : portalRequestQuerySchema.parse({});
  const requests = await listPortalRequests(database, identity, query); const created = one("created");
  return <main className="portal-page"><PortalHeader identity={identity} /><div className="portal-content">
    <section className="portal-heading"><div><p className="portal-kicker">Client portal</p><h1>Your requests</h1><p>Track open work, see what happens next, or send something new to {identity.organizationName}.</p></div><Link className="portal-primary" href={`/portal/${organizationSlug}/requests/new`}>New request</Link></section>
    {created ? <p className="portal-success" role="status">Request CL-{created} was sent to the team.</p> : null}
    <form className="portal-filters"><label><span>Find a request</span><input defaultValue={query.search} name="search" placeholder="Title or request number" type="search" /></label><input name="state" type="hidden" value={query.state} /><button type="submit">Search</button></form>
    <nav aria-label="Request state" className="portal-tabs"><Link aria-current={query.state === "open" ? "page" : undefined} href={`?state=open`}>Open requests</Link><Link aria-current={query.state === "closed" ? "page" : undefined} href={`?state=closed`}>Resolved and closed</Link></nav>
    <section className="portal-request-list" aria-label="Requests">{requests.length ? requests.map((item) => <Link className="portal-request-row navigable-row" href={`/portal/${organizationSlug}/requests/${item.id}`} key={item.id}><div><span className="portal-case-number">CL-{item.sequence}</span><h2>{item.title}</h2><p>{label(item.status)}</p></div><div className="portal-next-action"><span>Next action</span><strong>{nextAction(item.status)}</strong></div><time dateTime={item.lastActivityAt.toISOString()}>{item.lastActivityAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</time></Link>) : <div className="portal-empty"><h2>{query.search ? "No requests match your search" : query.state === "open" ? "No open requests" : "No completed requests"}</h2><p>{query.search ? "Try another title or request number." : "When work reaches this stage, it will appear here."}</p>{!query.search && query.state === "open" ? <Link href={`/portal/${organizationSlug}/requests/new`}>Send your first request</Link> : null}</div>}</section>
  </div></main>;
}

function PortalHeader({ identity }: { identity: Awaited<ReturnType<typeof resolvePortalIdentity>> & {} }) { return <header className="portal-header"><Link href={`/portal/${identity!.organizationSlug}/requests`} className="portal-brand"><i aria-hidden="true"><b/><b/><b/></i>CaseLane</Link><div><span>{identity!.clientName}</span><strong>{identity!.contactName}</strong></div></header>; }
function label(value:string) { return value.toLowerCase().replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase()); }
