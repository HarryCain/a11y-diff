import type { ComparisonResult, PageScan } from "./types.js";

export function formatJsonReport(
  baseline: PageScan,
  candidate: PageScan,
  comparison: ComparisonResult,
): string {
  return JSON.stringify(
    {
      schemaVersion: 1,
      baseline: {
        url: baseline.url,
        scannedAt: baseline.scannedAt,
        issueCount: baseline.issues.length,
      },
      candidate: {
        url: candidate.url,
        scannedAt: candidate.scannedAt,
        issueCount: candidate.issues.length,
      },
      summary: {
        introduced: comparison.introduced.length,
        fixed: comparison.fixed.length,
        unchanged: comparison.unchanged.length,
        passed: comparison.introduced.length === 0,
      },
      issues: comparison,
    },
    null,
    2,
  );
}
