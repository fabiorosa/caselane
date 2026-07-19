import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { getDatabase } from "@/db/client";
import { WorkspaceTopbar } from "@/components/workspace-shell";
import { createClientRepository } from "@/db/repositories/clients";
import { createOrganizationContextRepository } from "@/db/repositories/organizations";
import { createSessionRepository } from "@/db/repositories/sessions";
import { systemClock } from "@/infrastructure/clock";
import { readSessionCookie, type SessionCookieStore } from "@/infrastructure/session-cookie";
import { canManageClients, listClients, parseClientListSearchParams, type ClientListSearchParams } from "@/services/client-list";
import { resolveWorkspaceContext } from "@/services/organization-context";
import { getCurrentUserContext } from "@/services/session-service";

export default async function ClientsPage({ params, searchParams }: { params: Promise<{ organizationSlug: string }>; searchParams: Promise<ClientListSearchParams> }) {
  const { organizationSlug } = await params;
  const database = getDatabase();
  const cookieJar = await cookies();
  const cookieStore: SessionCookieStore = { get: (name) => cookieJar.get(name), set: () => undefined };
  const user = await getCurrentUserContext(createSessionRepository(database), systemClock, readSessionCookie(cookieStore));
  if (!user) redirect(`/sign-in?returnTo=/${organizationSlug}/clients`);
  const context = await resolveWorkspaceContext(createOrganizationContextRepository(database), user, organizationSlug);
  if (!context) notFound();
  const query = parseClientListSearchParams(await searchParams);
  const page = await listClients(createClientRepository(database), context.id, query);
  const hasFilters = Boolean(query.search) || query.archived;
  const canManage = canManageClients(context.role);

  return <main className="clients-page">
    <WorkspaceTopbar slug={context.slug} active="clients" isDemo={context.isDemo} />
    <div className="clients-content">
      <section className="clients-heading"><div><p className="auth-kicker">Client directory</p><h1>Clients</h1><p>Keep client identity, contacts, and request history attached to the work.</p></div>{canManage ? <Link className="client-primary-action" href={`/${context.slug}/clients/new`}>New client</Link> : <span className="access-label">Read-only access</span>}</section>
      <form className="client-filters" method="get"><label>Search<input defaultValue={query.search} name="search" placeholder="Client name" type="search" /></label><label>Status<select defaultValue={query.archived ? "true" : "false"} name="archived"><option value="false">Active clients</option><option value="true">Archived clients</option></select></label><button type="submit">Apply filters</button>{hasFilters ? <Link href={`/${context.slug}/clients`}>Clear</Link> : null}</form>
      <section className="client-directory" aria-labelledby="client-directory-title"><div className="client-directory-heading"><h2 id="client-directory-title">{query.archived ? "Archived clients" : "Active clients"}</h2><span>{page.items.length}</span></div>
        {page.items.length ? <div className="client-rows">{page.items.map((client) => <article className="client-row" key={client.id}><div><h3><Link href={`/${context.slug}/clients/${client.id}`}>{client.name}</Link></h3><p>{client.externalReference ? `Reference ${client.externalReference}` : "No external reference"}</p></div><div><span>Primary contact</span><strong>{client.primaryContactName ?? "Not assigned"}</strong><small>{client.primaryContactEmail ?? "Add a contact to this client"}</small></div><div className="client-volume"><span>Requests</span><strong>{client.requestCount}</strong></div>{client.archivedAt ? <time dateTime={client.archivedAt.toISOString()}>Archived {client.archivedAt.toLocaleDateString("en-US")}</time> : <span className="client-active-state">Active</span>}</article>)}</div>
          : hasFilters ? <div className="clients-empty"><h3>No clients match these filters</h3><p>Clear the search or change the status to return to the full directory.</p><Link href={`/${context.slug}/clients`}>Clear filters</Link></div>
          : <div className="clients-empty"><h3>{query.archived ? "No archived clients" : "No clients yet"}</h3><p>{query.archived ? "Clients will remain here after they are archived." : canManage ? "Create the first client to connect contacts and requests." : "An owner or administrator can add the first client."}</p>{canManage && !query.archived ? <Link href={`/${context.slug}/clients/new`}>Create first client</Link> : null}</div>}
      </section>
      {page.nextCursor ? <nav className="client-pagination" aria-label="Client pages"><Link href={nextPageHref(context.slug, query, page.nextCursor)}>Next page</Link></nav> : null}
    </div>
  </main>;
}

function nextPageHref(slug: string, query: ReturnType<typeof parseClientListSearchParams>, cursor: string): string {
  const params = new URLSearchParams({ cursor, archived: String(query.archived), limit: String(query.limit) });
  if (query.search) params.set("search", query.search);
  return `/${slug}/clients?${params.toString()}`;
}
