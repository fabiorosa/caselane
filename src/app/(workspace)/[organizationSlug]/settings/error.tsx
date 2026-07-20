"use client";

export default function SettingsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="clients-route-error"><p className="auth-kicker">Settings unavailable</p><h1>Settings could not be loaded.</h1><p>No workspace details were changed. Try the request again.</p><button onClick={reset}>Try again</button></main>;
}
