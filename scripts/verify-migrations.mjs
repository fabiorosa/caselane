import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import postgres from "postgres";

const sourceUrl = process.env.TEST_DATABASE_URL;
if (!sourceUrl) throw new Error("TEST_DATABASE_URL is required for migration verification.");

const source = new URL(sourceUrl);
const databaseName = `caselane_migration_${randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(source); adminUrl.pathname = "/postgres";
const cleanUrl = new URL(source); cleanUrl.pathname = `/${databaseName}`;
const admin = postgres(adminUrl.toString(), { max: 1 });

try {
  await admin.unsafe(`create database "${databaseName}"`);
  const result = spawnSync(process.execPath, ["node_modules/drizzle-kit/bin.cjs", "migrate"], { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: cleanUrl.toString() }, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Fresh migration failed:\n${result.error?.message ?? ""}\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  const clean = postgres(cleanUrl.toString(), { max: 1 });
  const required = ["organizations", "users", "memberships", "clients", "cases", "rate_limits"];
  const rows = await clean`select table_name from information_schema.tables where table_schema = 'public'`;
  await clean.end();
  const present = new Set(rows.map((row) => row.table_name));
  const missing = required.filter((table) => !present.has(table));
  if (missing.length) throw new Error(`Fresh migration is missing tables: ${missing.join(", ")}`);
  console.log(`Fresh migration passed (${required.length} required tables verified).`);
} finally {
  await admin.unsafe(`drop database if exists "${databaseName}" with (force)`);
  await admin.end();
}
