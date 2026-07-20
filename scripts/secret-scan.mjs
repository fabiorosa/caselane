import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const tracked = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" }).split("\0").filter(Boolean);
const forbiddenFiles = /(^|\/)(\.env|id_rsa|id_ed25519|.*\.(pem|key|p12|pfx))$/i;
const patterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["GitHub token", /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["OpenAI-style secret", /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
];

const findings = [];
for (const file of tracked) {
  if (file === "scripts/secret-scan.mjs") continue;
  if (forbiddenFiles.test(file)) { findings.push(`${file}: sensitive filename`); continue; }
  const content = readFileSync(file);
  if (content.length > 5_000_000 || content.includes(0)) continue;
  const text = content.toString("utf8");
  for (const [label, pattern] of patterns) if (pattern.test(text)) findings.push(`${file}: ${label}`);
}

if (findings.length) {
  console.error(`Secret scan failed:\n${findings.map((finding) => `- ${finding}`).join("\n")}`);
  process.exitCode = 1;
} else console.log(`Secret scan passed (${tracked.length} tracked files checked).`);
