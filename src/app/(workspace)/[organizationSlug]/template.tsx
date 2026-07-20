export default function WorkspaceTemplate({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="route-content-boundary">{children}</div>;
}
