import "server-only";

import { z } from "zod";

const databaseUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
    message: "must be a PostgreSQL connection URL",
  });

const environmentSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  APP_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  DEMO_ACCESS_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});

export type ServerEnvironment = z.infer<typeof environmentSchema>;

export class EnvironmentConfigurationError extends Error {
  readonly fields: string[];

  constructor(fields: string[]) {
    super(`Invalid server environment configuration: ${fields.join(", ")}.`);
    this.name = "EnvironmentConfigurationError";
    this.fields = fields;
  }
}

export function parseServerEnvironment(source: Record<string, string | undefined>): ServerEnvironment {
  const result = environmentSchema.safeParse({
    DATABASE_URL: source.DATABASE_URL,
    APP_URL: source.APP_URL,
    SESSION_SECRET: source.SESSION_SECRET,
    DEMO_ACCESS_ENABLED: source.DEMO_ACCESS_ENABLED,
  });

  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new EnvironmentConfigurationError(fields);
  }

  return result.data;
}

let cachedEnvironment: ServerEnvironment | undefined;

export function getServerEnvironment(): ServerEnvironment {
  cachedEnvironment ??= parseServerEnvironment(process.env);
  return cachedEnvironment;
}
