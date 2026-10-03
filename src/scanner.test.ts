import { describe, expect, it } from "vitest";

import { validateWebUrl } from "./scanner.js";

describe("validateWebUrl", () => {
  it("accepts HTTP and HTTPS web addresses", () => {
    expect(validateWebUrl("https://example.com").href).toBe(
      "https://example.com/",
    );
    expect(validateWebUrl("http://localhost:3000").href).toBe(
      "http://localhost:3000/",
    );
  });

  it("rejects invalid and unsupported addresses", () => {
    expect(() => validateWebUrl("not a URL")).toThrow("Invalid URL");
    expect(() => validateWebUrl("file:///secret.txt")).toThrow(
      "URL must start with http:// or https://",
    );
  });
});
