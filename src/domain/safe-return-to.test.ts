import { describe, expect, it } from "vitest";

import { safeReturnTo } from "./safe-return-to";

describe("safeReturnTo", () => {
  it("accepts same-origin relative paths", () => {
    expect(safeReturnTo("/workspace?view=mine")).toBe("/workspace?view=mine");
  });

  it("rejects protocol-relative and backslash paths", () => {
    expect(safeReturnTo("//attacker.example")).toBeNull();
    expect(safeReturnTo("/\\attacker.example")).toBeNull();
    expect(safeReturnTo("https://attacker.example")).toBeNull();
  });
});
