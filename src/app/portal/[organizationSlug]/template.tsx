export default function PortalTemplate({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="route-content-boundary">{children}</div>;
}
