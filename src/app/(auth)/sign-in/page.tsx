import { AuthForm } from "@/components/auth-form";
import { signInAction } from "../actions";
import { DemoAccess } from "@/components/demo-access";
import { getServerEnvironment } from "@/env";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; demoError?:string }> }) {
  const { returnTo,demoError } = await searchParams; const demoEnabled=getServerEnvironment().DEMO_ACCESS_ENABLED;
  return <main className={`auth-page ${demoEnabled?"auth-page-with-demo":""}`}><section className="auth-panel"><div className="auth-panel-inner"><div className="auth-brand"><i aria-hidden="true"><b /><b /><b /></i>CaseLane</div><p className="auth-kicker">Request operations</p><h1>Welcome back</h1><p className="auth-description">Sign in to continue working with your team.</p><AuthForm action={signInAction} mode="sign-in" returnTo={returnTo} /></div></section>{demoEnabled?<DemoAccess error={demoError}/>:null}</main>;
}
