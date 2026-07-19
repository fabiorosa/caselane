import "server-only";
import type { DemoAccessRepository } from "@/db/repositories/demo-access";
import type { SessionRepository } from "@/db/repositories/sessions";
import type { ActionResult } from "@/domain/action-result";
import { demoPersonaSchema } from "@/domain/demo-access";
import type { Clock } from "@/infrastructure/clock";
import { generateOpaqueToken } from "@/infrastructure/tokens";
import { createSession } from "@/services/session-service";

export async function startDemoSession(repository:DemoAccessRepository,sessions:Pick<SessionRepository,"create">,clock:Clock,enabled:boolean,input:unknown):Promise<ActionResult<{rawSessionToken:string;destination:string}>> {
  if(!enabled) return {ok:false,error:{code:"FORBIDDEN",message:"Demo access is not available."}};
  const parsed=demoPersonaSchema.safeParse(input); if(!parsed.success) return {ok:false,error:{code:"VALIDATION",message:"Choose a valid demo role."}};
  const account=await repository.findActivePersona(parsed.data); if(!account) return {ok:false,error:{code:"NOT_FOUND",message:"This demo role is currently unavailable."}};
  const rawSessionToken=generateOpaqueToken(); await createSession(sessions,clock,{userId:account.userId,rawToken:rawSessionToken});
  return {ok:true,data:{rawSessionToken,destination:account.role==="CLIENT"?`/portal/${account.slug}/requests`:`/${account.slug}/overview`}};
}
