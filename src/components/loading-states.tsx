type WorkspaceVariant = "overview" | "list" | "detail" | "settings";
type PortalVariant = "list" | "detail" | "form";

function Block({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton-block ${className}`.trim()} />;
}

function WorkspaceLoadingHeader() {
  return <header className="team-topbar skeleton-topbar" aria-hidden="true">
    <span className="auth-brand"><i><b /><b /><b /></i>CaseLane</span>
    <nav><Block className="skeleton-nav" /><Block className="skeleton-nav" /><Block className="skeleton-nav" /><Block className="skeleton-nav" /><Block className="skeleton-nav" /></nav>
    <Block className="skeleton-demo-label" />
  </header>;
}

function WorkspaceBody({ variant }: { variant: WorkspaceVariant }) {
  if (variant === "overview") return <>
    <div className="skeleton-metrics">{Array.from({ length: 4 }, (_, index) => <div key={index}><Block className="skeleton-metric-value" /><Block className="skeleton-label" /></div>)}</div>
    <div className="skeleton-section-heading"><Block className="skeleton-subheading" /><Block className="skeleton-count" /></div>
    <div className="skeleton-rows">{Array.from({ length: 5 }, (_, index) => <div key={index}><span><Block className="skeleton-row-title" /><Block className="skeleton-row-copy" /></span><Block className="skeleton-row-meta" /></div>)}</div>
  </>;

  if (variant === "detail") return <div className="skeleton-detail-grid">
    <div><Block className="skeleton-back" /><Block className="skeleton-detail-title" /><Block className="skeleton-copy-wide" /><div className="skeleton-panel"><Block className="skeleton-subheading" /><Block className="skeleton-field" /><Block className="skeleton-field" /><Block className="skeleton-field" /></div></div>
    <aside><Block className="skeleton-subheading" /><Block className="skeleton-field" /><Block className="skeleton-field" /><Block className="skeleton-field" /></aside>
  </div>;

  if (variant === "settings") return <div className="skeleton-settings">
    {Array.from({ length: 3 }, (_, index) => <section key={index}><div><Block className="skeleton-subheading" /><Block className="skeleton-copy-medium" /></div><div><Block className="skeleton-field" /><Block className="skeleton-field" />{index ? <Block className="skeleton-field" /> : null}</div></section>)}
  </div>;

  return <>
    <div className="skeleton-filter-panel"><Block className="skeleton-filter-wide" /><Block className="skeleton-filter" /><Block className="skeleton-filter" /></div>
    <div className="skeleton-section-heading"><Block className="skeleton-subheading" /><Block className="skeleton-count" /></div>
    <div className="skeleton-rows">{Array.from({ length: 6 }, (_, index) => <div key={index}><span><Block className="skeleton-row-title" /><Block className="skeleton-row-copy" /></span><Block className="skeleton-row-meta" /></div>)}</div>
  </>;
}

export function WorkspaceRouteLoading({ variant = "list" }: { variant?: WorkspaceVariant }) {
  return <main className="clients-page route-loading" aria-busy="true" aria-label="Loading workspace">
    <WorkspaceLoadingHeader />
    <div className="clients-content skeleton-content">
      <div className="skeleton-heading"><Block className="skeleton-kicker" /><Block className="skeleton-title" /><Block className="skeleton-copy-wide" /></div>
      <WorkspaceBody variant={variant} />
    </div>
    <span className="sr-only" role="status">Loading workspace</span>
  </main>;
}

function PortalLoadingHeader() {
  return <header className="portal-header skeleton-portal-header" aria-hidden="true">
    <span className="portal-brand"><i><b /><b /><b /></i>CaseLane</span>
    <div><Block className="skeleton-portal-client" /><Block className="skeleton-portal-user" /></div>
  </header>;
}

export function PortalRouteLoading({ variant = "list" }: { variant?: PortalVariant }) {
  return <main className="portal-page route-loading" aria-busy="true" aria-label="Loading client portal">
    <PortalLoadingHeader />
    <div className={variant === "list" ? "portal-content skeleton-content" : "portal-editor skeleton-content"}>
      <div className="skeleton-heading"><Block className="skeleton-kicker" /><Block className="skeleton-title" /><Block className="skeleton-copy-wide" /></div>
      {variant === "list" ? <><div className="skeleton-filter-panel portal-skeleton-filter"><Block className="skeleton-filter-wide" /><Block className="skeleton-filter" /></div><div className="skeleton-rows portal-skeleton-rows">{Array.from({ length: 4 }, (_, index) => <div key={index}><span><Block className="skeleton-row-title" /><Block className="skeleton-row-copy" /></span><Block className="skeleton-row-meta" /></div>)}</div></> : null}
      {variant === "detail" ? <div className="skeleton-portal-detail"><Block className="skeleton-field" /><Block className="skeleton-field" /><Block className="skeleton-panel-tall" /></div> : null}
      {variant === "form" ? <div className="skeleton-portal-form"><Block className="skeleton-field" /><Block className="skeleton-field" /><Block className="skeleton-textarea" /><Block className="skeleton-button" /></div> : null}
    </div>
    <span className="sr-only" role="status">Loading client portal</span>
  </main>;
}

export function AuthRouteLoading({ label }: { label: string }) {
  return <main className="auth-page route-loading" aria-busy="true" aria-label={label}>
    <section className="auth-panel skeleton-auth-panel" aria-hidden="true">
      <span className="auth-brand"><i><b /><b /><b /></i>CaseLane</span>
      <Block className="skeleton-kicker" />
      <Block className="skeleton-auth-title" />
      <Block className="skeleton-copy-wide" />
      <div className="skeleton-auth-fields"><Block className="skeleton-field" /><Block className="skeleton-field" /><Block className="skeleton-button" /></div>
    </section>
    <span className="sr-only" role="status">{label}</span>
  </main>;
}
