"use client";

import { useFormStatus } from "react-dom";
import { demoAccessAction } from "@/app/(auth)/actions";

const personas = [
  { value: "OWNER", label: "Owner", name: "Avery Brooks", copy: "Review the operation, clients, team, and every case." },
  { value: "MEMBER", label: "Team member", name: "Jordan Singh", copy: "Work assigned cases and collaborate with the internal team." },
  { value: "CLIENT", label: "Client", name: "Maya Chen", copy: "Submit requests, follow progress, and reply to the team." },
] as const;

export function DemoAccess({ error }: { error?: string }) {
  return <section className="demo-access" aria-labelledby="demo-access-title">
    <header><div><p className="auth-kicker">Public demo</p><h2 id="demo-access-title">Choose a perspective</h2></div><span>No password required</span></header>
    <div className="demo-personas">{personas.map((persona, index) => <form action={demoAccessAction} key={persona.value}>
      <input name="persona" type="hidden" value={persona.value} />
      <span className="demo-index">0{index + 1}</span>
      <div><strong>{persona.label}</strong><small>{persona.name}</small><p>{persona.copy}</p></div>
      <DemoSubmit label={persona.label} />
    </form>)}</div>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    <p className="demo-disclaimer">Shared fictional data resets regularly. Changes are visible to other demo visitors.</p>
  </section>;
}

function DemoSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button aria-label={`Explore as ${label}`} aria-live="polite" disabled={pending} type="submit">
    <span>{pending ? "Opening…" : "Explore"}</span>
    <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" /></svg>
  </button>;
}
