"use client";
export default function CasesError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <main className="clients-route-error"><p className="auth-kicker">Queue unavailable</p><h1>Cases could not be loaded.</h1><p>Your filters and data were not changed. Try the request again.</p><button onClick={reset}>Try again</button></main>; }
