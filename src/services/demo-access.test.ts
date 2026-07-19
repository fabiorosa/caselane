import { describe,expect,it,vi } from "vitest";
import { startDemoSession } from "./demo-access";
const clock={now:()=>new Date("2026-07-19T12:00:00Z")};
describe("demo access",()=>{
  it("rejects the shortcut when the deployment flag is disabled",async()=>{const repository={findActivePersona:vi.fn()};const sessions={create:vi.fn()};expect(await startDemoSession(repository,sessions,clock,false,"OWNER")).toMatchObject({ok:false,error:{code:"FORBIDDEN"}});expect(repository.findActivePersona).not.toHaveBeenCalled();});
  it("issues a real session and role destination for an available persona",async()=>{const repository={findActivePersona:vi.fn().mockResolvedValue({userId:"user",role:"CLIENT",slug:"orbit-labs"})};const sessions={create:vi.fn().mockResolvedValue({id:"session"})};const result=await startDemoSession(repository,sessions,clock,true,"CLIENT");expect(result).toMatchObject({ok:true,data:{destination:"/portal/orbit-labs/requests"}});expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({userId:"user",tokenHash:expect.any(String),expiresAt:new Date("2026-08-18T12:00:00Z")}));});
  it("rejects unknown and unavailable personas",async()=>{const repository={findActivePersona:vi.fn().mockResolvedValue(null)};const sessions={create:vi.fn()};expect(await startDemoSession(repository,sessions,clock,true,"ADMIN")).toMatchObject({ok:false,error:{code:"VALIDATION"}});expect(await startDemoSession(repository,sessions,clock,true,"MEMBER")).toMatchObject({ok:false,error:{code:"NOT_FOUND"}});});
});
