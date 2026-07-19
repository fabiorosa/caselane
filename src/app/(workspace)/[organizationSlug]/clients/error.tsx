"use client";

export default function ClientsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="clients-page"><div className="clients-route-error"><p className="auth-kicker">Client directory unavailable</p><h1>We could not load the clients.</h1><p>Your filters and records were not changed. Try loading the directory again.</p><button onClick={reset} type="button">Try again</button></div></main>;
}
