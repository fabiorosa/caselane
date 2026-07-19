import { AuthForm } from "@/components/auth-form";
import { registerAction } from "../actions";

export default function RegisterPage() {
  return <AuthPageFrame title="Set up your workspace" description="Start with your team’s request operation in one place."><AuthForm action={registerAction} mode="register" /></AuthPageFrame>;
}

function AuthPageFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="auth-page"><section className="auth-panel"><div className="auth-brand"><i aria-hidden="true"><b /><b /><b /></i>CaseLane</div><p className="auth-kicker">Request operations</p><h1>{title}</h1><p className="auth-description">{description}</p>{children}</section></main>;
}
