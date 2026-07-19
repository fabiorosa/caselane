import "server-only";

export const sessionCookieName = "caselane_session";

export interface SessionCookieStore {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: SessionCookieOptions): void;
}

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

function sessionCookieOptions(): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionLifetimeSeconds,
  };
}

export function readSessionCookie(store: SessionCookieStore): string | null {
  return store.get(sessionCookieName)?.value ?? null;
}

export function writeSessionCookie(store: SessionCookieStore, rawToken: string): void {
  store.set(sessionCookieName, rawToken, sessionCookieOptions());
}

export function clearSessionCookie(store: SessionCookieStore): void {
  store.set(sessionCookieName, "", { ...sessionCookieOptions(), maxAge: 0 });
}
