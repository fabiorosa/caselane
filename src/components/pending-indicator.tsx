import type { ReactNode } from "react";

export function PendingActionContent({ label, pending, pendingLabel }: { label: ReactNode; pending: boolean; pendingLabel: string }) {
  return <span className="pending-action-content"><PendingIndicator pending={pending} /><span aria-live="polite">{pending ? pendingLabel : label}</span></span>;
}

function PendingIndicator({ pending }: { pending: boolean }) {
  return <span aria-hidden="true" className="pending-indicator" data-pending={pending ? "true" : undefined}>
    <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.75" /><path d="M8 2.25a5.75 5.75 0 0 1 5.75 5.75" /></svg>
  </span>;
}
