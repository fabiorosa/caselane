"use client";

export default function PortalRequestsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="portal-page"><section className="portal-route-error"><p className="portal-kicker">Client portal</p><h1>Requests are unavailable.</h1><p>We could not load this portal right now. Your request data has not been changed.</p><button onClick={reset} type="button">Try again</button></section></main>;
}
