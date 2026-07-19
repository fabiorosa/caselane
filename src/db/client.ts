import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

import { getServerEnvironment } from "@/env";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnection {
  database: Database;
  close(): Promise<void>;
}

export interface HealthQueryAdapter {
  executeHealthQuery(): Promise<void>;
}

export function createDatabaseConnection(databaseUrl: string): DatabaseConnection {
  const client = postgres(databaseUrl, {
    max: 10,
    onnotice: () => undefined,
  });

  return {
    database: drizzle(client, { schema }),
    close: () => closePostgresClient(client),
  };
}

async function closePostgresClient(client: Sql): Promise<void> {
  await client.end({ timeout: 5 });
}

export async function checkDatabaseHealth(adapter: HealthQueryAdapter): Promise<"reachable" | "unreachable"> {
  try {
    await adapter.executeHealthQuery();
    return "reachable";
  } catch {
    return "unreachable";
  }
}

function createHealthQueryAdapter(connection: DatabaseConnection): HealthQueryAdapter {
  return {
    async executeHealthQuery() {
      await connection.database.execute("select 1");
    },
  };
}

const globalForDatabase = globalThis as typeof globalThis & {
  caselaneDatabaseConnection?: DatabaseConnection;
  caselaneShutdownHandlersInstalled?: boolean;
};

export function getDatabaseConnection(): DatabaseConnection {
  globalForDatabase.caselaneDatabaseConnection ??= createDatabaseConnection(
    getServerEnvironment().DATABASE_URL,
  );

  return globalForDatabase.caselaneDatabaseConnection;
}

export function getDatabase(): Database {
  return getDatabaseConnection().database;
}

export async function getDatabaseHealth(): Promise<"reachable" | "unreachable"> {
  return checkDatabaseHealth(createHealthQueryAdapter(getDatabaseConnection()));
}

export async function closeDatabaseConnection(): Promise<void> {
  const connection = globalForDatabase.caselaneDatabaseConnection;
  globalForDatabase.caselaneDatabaseConnection = undefined;
  await connection?.close();
}

export function installDatabaseShutdownHandlers(
  register: (signal: "SIGINT" | "SIGTERM", handler: () => void) => void = (signal, handler) => {
    process.once(signal, handler);
  },
): void {
  if (globalForDatabase.caselaneShutdownHandlersInstalled) {
    return;
  }

  const shutdown = () => {
    void closeDatabaseConnection();
  };

  register("SIGINT", shutdown);
  register("SIGTERM", shutdown);
  globalForDatabase.caselaneShutdownHandlersInstalled = true;
}
