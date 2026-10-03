import type {
  AccessibilityIssue,
  ComparisonResult,
  PageScan,
} from "./types.js";

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function formatIssue(issue: AccessibilityIssue): string {
  const impact = issue.impact ?? "unknown";

  return [
    `  ${issue.ruleId} (${impact})`,
    `  Element: ${issue.target}`,
    `  Problem: ${issue.help}`,
    `  Learn more: ${issue.helpUrl}`,
  ].join("\n");
}

export function formatScan(scan: PageScan): string {
  const header = [
    "Accessibility scan",
    `URL: ${scan.url}`,
    `Found ${plural(scan.issues.length, "issue")}.`,
  ].join("\n");

  if (scan.issues.length === 0) {
    return `${header}\n\nNo automatically detectable accessibility issues found.`;
  }

  return `${header}\n\n${scan.issues.map(formatIssue).join("\n\n")}`;
}

export function formatComparison(
  baseline: PageScan,
  candidate: PageScan,
  comparison: ComparisonResult,
): string {
  const summary = [
    "Accessibility comparison",
    `Baseline:  ${baseline.url}`,
    `Candidate: ${candidate.url}`,
    "",
    `Introduced: ${plural(comparison.introduced.length, "issue")}`,
    `Fixed:      ${plural(comparison.fixed.length, "issue")}`,
    `Unchanged:  ${plural(comparison.unchanged.length, "issue")}`,
  ].join("\n");

  if (comparison.introduced.length === 0) {
    return `${summary}\n\nNo new automatically detectable accessibility issues were introduced.`;
  }

  return [
    summary,
    "",
    "New issues:",
    comparison.introduced.map(formatIssue).join("\n\n"),
  ].join("\n");
}
