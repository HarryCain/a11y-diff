import { describe, expect, it } from "vitest";

import { compareScans, issueKey } from "./compare.js";
import type { AccessibilityIssue, PageScan } from "./types.js";

function issue(ruleId: string, target: string): AccessibilityIssue {
  return {
    ruleId,
    target,
    impact: "serious",
    description: "Test description",
    help: "Test help",
    helpUrl: "https://example.com/help",
    html: `<div class="${target}"></div>`,
    failureSummary: "Test failure",
  };
}

function scan(issues: AccessibilityIssue[]): PageScan {
  return {
    url: "https://example.com/",
    scannedAt: "2026-10-03T00:00:00.000Z",
    issues,
  };
}

describe("issueKey", () => {
  it("combines the rule and target into a stable identity", () => {
    expect(issueKey(issue("image-alt", "img.logo"))).toBe(
      "image-alt::img.logo",
    );
  });
});

describe("compareScans", () => {
  it("separates introduced, fixed, and unchanged issues", () => {
    const existing = issue("image-alt", "img.logo");
    const fixed = issue("label", "input#email");
    const introduced = issue("color-contrast", "button.submit");

    const result = compareScans(
      scan([existing, fixed]),
      scan([existing, introduced]),
    );

    expect(result.introduced).toEqual([introduced]);
    expect(result.fixed).toEqual([fixed]);
    expect(result.unchanged).toEqual([existing]);
  });
});
