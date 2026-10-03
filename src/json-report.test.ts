import { describe, expect, it } from "vitest";

import { formatJsonReport } from "./json-report.js";
import type {
  AccessibilityIssue,
  ComparisonResult,
  PageScan,
} from "./types.js";

const issue: AccessibilityIssue = {
  ruleId: "button-name",
  impact: "critical",
  description: "A button needs a name",
  help: "Buttons must have discernible text",
  helpUrl: "https://example.com/help",
  target: "button.checkout",
  html: "<button></button>",
  failureSummary: "The button has no text",
};

const baseline: PageScan = {
  url: "https://current.example.com/",
  scannedAt: "2026-10-03T00:00:00.000Z",
  issues: [],
};

const candidate: PageScan = {
  url: "https://preview.example.com/",
  scannedAt: "2026-10-03T00:00:01.000Z",
  issues: [issue],
};

const comparison: ComparisonResult = {
  introduced: [issue],
  fixed: [],
  unchanged: [],
};

describe("formatJsonReport", () => {
  it("creates a versioned machine-readable report", () => {
    const report = JSON.parse(
      formatJsonReport(baseline, candidate, comparison),
    ) as Record<string, unknown>;

    expect(report).toMatchObject({
      schemaVersion: 1,
      baseline: { issueCount: 0 },
      candidate: { issueCount: 1 },
      summary: {
        introduced: 1,
        fixed: 0,
        unchanged: 0,
        passed: false,
      },
      issues: {
        introduced: [{ ruleId: "button-name" }],
      },
    });
  });
});
