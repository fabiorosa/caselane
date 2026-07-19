export function assertDemoResetEnvironment(environment) {
  if (environment.ALLOW_DEMO_RESET !== "true") throw new Error("Demo reset is disabled. Set ALLOW_DEMO_RESET=true in deployment automation.");
  if (!environment.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  if (!environment.DEMO_PASSWORD || environment.DEMO_PASSWORD.length < 12) throw new Error("DEMO_PASSWORD must contain at least 12 characters.");
}
