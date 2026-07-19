import { describe, expect, it, vi } from "vitest";

import { clearSessionCookie, readSessionCookie, sessionCookieName, writeSessionCookie } from "./session-cookie";

describe("session cookie service", () => {
  it("writes an HTTP-only, same-site lax cookie", () => {
    const store = { get: vi.fn(), set: vi.fn() };
    writeSessionCookie(store, "opaque-token");

    expect(store.set).toHaveBeenCalledWith(sessionCookieName, "opaque-token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 2_592_000,
    });
  });

  it("reads and clears the current cookie", () => {
    const store = { get: vi.fn().mockReturnValue({ value: "opaque-token" }), set: vi.fn() };
    expect(readSessionCookie(store)).toBe("opaque-token");
    clearSessionCookie(store);
    expect(store.set).toHaveBeenLastCalledWith(sessionCookieName, "", expect.objectContaining({ maxAge: 0 }));
  });

  it("adds the Secure flag in production", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const store = { get: vi.fn(), set: vi.fn() };

    writeSessionCookie(store, "opaque-token");

    expect(store.set).toHaveBeenCalledWith(sessionCookieName, "opaque-token", expect.objectContaining({ secure: true }));
    process.env.NODE_ENV = previousNodeEnv;
  });
});
