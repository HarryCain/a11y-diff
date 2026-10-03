export type Impact = "minor" | "moderate" | "serious" | "critical" | null;

export interface AccessibilityIssue {
  ruleId: string;
  impact: Impact;
  description: string;
  help: string;
  helpUrl: string;
  target: string;
  html: string;
  failureSummary: string;
}

export interface PageScan {
  url: string;
  scannedAt: string;
  issues: AccessibilityIssue[];
}

export interface ComparisonResult {
  introduced: AccessibilityIssue[];
  fixed: AccessibilityIssue[];
  unchanged: AccessibilityIssue[];
}
