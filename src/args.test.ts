import { describe, expect, it } from "vitest";

import { parseArgs } from "./args.js";

describe("parseArgs", () => {
  it("reads two URLs and an output path", () => {
    expect(
      parseArgs([
        "https://current.example.com",
        "https://preview.example.com",
        "--output",
        "reports/result.html",
      ]),
    ).toEqual({
      urls: ["https://current.example.com", "https://preview.example.com"],
      output: "reports/result.html",
      help: false,
    });
  });

  it("supports the short and equals forms of output", () => {
    expect(parseArgs(["one", "two", "-o", "report.html"]).output).toBe(
      "report.html",
    );
    expect(parseArgs(["one", "two", "--output=report.html"]).output).toBe(
      "report.html",
    );
  });

  it("rejects missing values and unknown options", () => {
    expect(() => parseArgs(["one", "two", "--output"])).toThrow(
      "requires a file path",
    );
    expect(() => parseArgs(["one", "two", "--wat"])).toThrow(
      "Unknown option",
    );
  });
});
