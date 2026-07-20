import { NextResponse } from "next/server";
import { getDatabaseHealth } from "@/db/client";
import { writeLog } from "@/infrastructure/logger";

type DatabaseHealth = Awaited<ReturnType<typeof getDatabaseHealth>>;

export function createHealthResponse(database: DatabaseHealth, requestId: string): NextResponse {
  return NextResponse.json(
    { status: database === "reachable" ? "ok" : "degraded", database },
    { status: database === "reachable" ? 200 : 503, headers: { "x-request-id": requestId, "cache-control": "no-store" } },
  );
}

export async function GET(): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const database = await getDatabaseHealth();

  if (database === "unreachable") {
    writeLog("warn", "health.degraded", { requestId, metadata: { database } });
  }
  return createHealthResponse(database, requestId);
}
