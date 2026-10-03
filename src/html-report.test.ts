import { describe, expect, it } from "vitest";

import { escapeHtml, formatHtmlReport } from "./html-report.js";
import type {
  AccessibilityIssue,
  ComparisonResult,
  PageScan,
} from "./types.js";

const dangerousIssue: AccessibilityIssue = {
  ruleId: "image-alt",
  impact: "critical",
  description: "An image needs alternative text",
  help: "Images must have alternative text",
  helpUrl: "https://example.com/help?a=1&b=2",
  target: "img[data-name='<unsafe>']",
  html: "<img src=x onerror=alert('unsafe')>",
  failureSummary: "Fix <all> of the following",
};

const baseline: PageScan = {
  url: "https://current.example.com/?a=1&b=2",
  scannedAt: "2026-10-03T00:00:00.000Z",
  issues: [],
};

const candidate: PageScan = {
  url: "https://preview.example.com/",
  scannedAt: "2026-10-03T00:00:01.000Z",
  issues: [dangerousIssue],
};

const comparison: ComparisonResult = {
  introduced: [dangerousIssue],
  fixed: [],
  unchanged: [],
};

describe("escapeHtml", () => {
  it("escapes characters that have meaning in HTML", () => {
    expect(escapeHtml(`<script data-name="test">'&'</script>`)).toBe(
      "&lt;script data-name=&quot;test&quot;&gt;&#039;&amp;&#039;&lt;/script&gt;",
    );
  });
});

describe("formatHtmlReport", () => {
  it("renders the comparison and escapes scanned page content", () => {
    const html = formatHtmlReport(baseline, candidate, comparison);

    expect(html).toContain("Regressions detected");
    expect(html).toContain("image-alt");
    expect(html).toContain("&lt;img src=x onerror=alert(&#039;unsafe&#039;)&gt;");
    expect(html).not.toContain("<img src=x onerror");
  });
});
