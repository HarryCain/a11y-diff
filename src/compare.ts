import type {
  AccessibilityIssue,
  ComparisonResult,
  PageScan,
} from "./types.js";

export function issueKey(issue: AccessibilityIssue): string {
  return `${issue.ruleId}::${issue.target}`;
}

export function compareScans(
  baseline: PageScan,
  candidate: PageScan,
): ComparisonResult {
  const baselineByKey = new Map(
    baseline.issues.map((issue) => [issueKey(issue), issue]),
  );
  const candidateByKey = new Map(
    candidate.issues.map((issue) => [issueKey(issue), issue]),
  );

  const introduced = candidate.issues.filter(
    (issue) => !baselineByKey.has(issueKey(issue)),
  );
  const unchanged = candidate.issues.filter((issue) =>
    baselineByKey.has(issueKey(issue)),
  );
  const fixed = baseline.issues.filter(
    (issue) => !candidateByKey.has(issueKey(issue)),
  );

  return { introduced, fixed, unchanged };
}
