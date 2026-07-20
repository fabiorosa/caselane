export type LogLevel = "info" | "warn" | "error";
export type LogValue = string | number | boolean | null | undefined;

const sensitiveKey = /authorization|cookie|password|secret|token|database.?url|connection/i;

export function redactMetadata(metadata: Record<string, LogValue>): Record<string, LogValue> {
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, sensitiveKey.test(key) ? "[REDACTED]" : value]));
}

export function writeLog(level: LogLevel, event: string, context: { requestId: string; userId?: string; organizationId?: string; metadata?: Record<string, LogValue> }): void {
  const record = {
    timestamp: new Date().toISOString(),
    level,
    event,
    requestId: context.requestId,
    ...(context.userId ? { userId: context.userId } : {}),
    ...(context.organizationId ? { organizationId: context.organizationId } : {}),
    ...(context.metadata ? { metadata: redactMetadata(context.metadata) } : {}),
  };

  const serialized = JSON.stringify(record);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.info(serialized);
}
