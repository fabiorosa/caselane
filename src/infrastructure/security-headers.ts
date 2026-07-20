const production = process.env.NODE_ENV === "production";

// The App Router streams a small inline bootstrap before hydration. A nonce-based
// policy would force every route to render dynamically, so the baseline policy
// permits that bootstrap while still restricting scripts to this origin.
const scriptSources = ["'self'", "'unsafe-inline'", ...(production ? [] : ["'unsafe-eval'"])];
const connectSources = ["'self'", ...(production ? [] : ["ws:", "wss:"] )];

export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSources.join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src ${connectSources.join(" ")}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(production ? ["upgrade-insecure-requests"] : []),
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
] as const;
