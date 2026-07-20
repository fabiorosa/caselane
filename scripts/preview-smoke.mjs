const baseUrl = process.env.PREVIEW_URL?.replace(/\/$/, "");
if (!baseUrl) throw new Error("PREVIEW_URL is required.");

const health = await fetch(`${baseUrl}/api/health`, { redirect: "manual" });
if (health.status !== 200) throw new Error(`Health check returned ${health.status}.`);
const body = await health.json();
if (body.status !== "ok" || body.database !== "reachable") throw new Error("Health response is degraded or malformed.");
for (const header of ["content-security-policy", "x-content-type-options", "x-frame-options"]) {
  if (!health.headers.get(header)) throw new Error(`Missing security header: ${header}`);
}
const signIn = await fetch(`${baseUrl}/sign-in`, { redirect: "manual" });
if (signIn.status !== 200) throw new Error(`Sign-in smoke returned ${signIn.status}.`);
console.log(`Preview smoke passed for ${new URL(baseUrl).host}.`);
