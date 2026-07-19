export function safeReturnTo(returnTo: string | null): string | null {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.includes("\\")) {
    return null;
  }

  return returnTo;
}
