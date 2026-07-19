"use client";

import Link from "next/link";

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="auth-kicker">Authentication unavailable</p>
        <h1>We could not complete that request.</h1>
        <p className="auth-description">Your information was not changed. Try again, or return to the sign-in page.</p>
        <div className="auth-error-actions"><button className="auth-submit" onClick={reset} type="button">Try again</button><Link href="/sign-in">Back to sign in</Link></div>
      </section>
    </main>
  );
}
