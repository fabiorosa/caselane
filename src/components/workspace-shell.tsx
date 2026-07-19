import Link from "next/link";

export function WorkspaceTopbar({ slug, active, isDemo }: { slug: string; active: "overview" | "clients" | "cases" | "team"; isDemo: boolean }) {
  return <header className="team-topbar"><Link className="auth-brand" href={`/${slug}/overview`}><i aria-hidden="true"><b /><b /><b /></i>CaseLane</Link><nav aria-label="Workspace">{(["overview", "clients", "cases", "team"] as const).map((item) => <Link aria-current={active === item ? "page" : undefined} href={`/${slug}/${item}`} key={item}>{item[0].toUpperCase() + item.slice(1)}</Link>)}</nav>{isDemo ? <span className="demo-label">Sample data</span> : null}</header>;
}
