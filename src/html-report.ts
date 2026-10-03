import type {
  AccessibilityIssue,
  ComparisonResult,
  PageScan,
} from "./types.js";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function issueCard(issue: AccessibilityIssue): string {
  const impact = issue.impact ?? "unknown";

  return `
    <article class="issue-card">
      <div class="issue-heading">
        <h3>${escapeHtml(issue.ruleId)}</h3>
        <span class="impact impact-${escapeHtml(impact)}">${escapeHtml(impact)}</span>
      </div>
      <p>${escapeHtml(issue.help)}</p>
      <dl>
        <div>
          <dt>Element</dt>
          <dd><code>${escapeHtml(issue.target)}</code></dd>
        </div>
        <div>
          <dt>HTML</dt>
          <dd><code>${escapeHtml(issue.html)}</code></dd>
        </div>
        <div>
          <dt>Why it failed</dt>
          <dd>${escapeHtml(issue.failureSummary)}</dd>
        </div>
      </dl>
      <a href="${escapeHtml(issue.helpUrl)}" target="_blank" rel="noreferrer">Learn how to fix this issue</a>
    </article>`;
}

function issueSection(
  title: string,
  description: string,
  issues: AccessibilityIssue[],
  emptyMessage: string,
): string {
  return `
    <section class="issue-section">
      <h2>${escapeHtml(title)}</h2>
      <p class="section-description">${escapeHtml(description)}</p>
      ${
        issues.length > 0
          ? `<div class="issue-list">${issues.map(issueCard).join("")}</div>`
          : `<p class="empty-state">${escapeHtml(emptyMessage)}</p>`
      }
    </section>`;
}

export function formatHtmlReport(
  baseline: PageScan,
  candidate: PageScan,
  comparison: ComparisonResult,
): string {
  const passed = comparison.introduced.length === 0;
  const statusLabel = passed ? "Passed" : "Regressions detected";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>a11y-diff report</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #172033;
        background: #f4f7fb;
      }
      * { box-sizing: border-box; }
      body { margin: 0; }
      main { width: min(1040px, calc(100% - 32px)); margin: 40px auto 72px; }
      header { padding: 32px; color: white; background: #172033; border-radius: 20px; box-shadow: 0 16px 44px #17203324; }
      h1 { margin: 0 0 8px; font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -0.04em; }
      h2 { margin: 0; font-size: 1.5rem; }
      h3 { margin: 0; font-size: 1rem; }
      p { line-height: 1.6; }
      .subtitle { margin: 0; color: #c7d2e8; }
      .status { display: inline-flex; margin-top: 24px; padding: 8px 12px; border-radius: 999px; font-weight: 700; }
      .status-pass { color: #064e3b; background: #a7f3d0; }
      .status-fail { color: #7f1d1d; background: #fecaca; }
      .urls { display: grid; gap: 12px; margin-top: 24px; }
      .url-row { display: grid; grid-template-columns: 90px 1fr; gap: 8px; }
      .url-row span { color: #9fb0cf; font-weight: 700; }
      .url-row code { overflow-wrap: anywhere; }
      .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0 40px; }
      .summary-card { padding: 22px; background: white; border: 1px solid #dfe6f1; border-radius: 16px; }
      .summary-card strong { display: block; font-size: 2rem; }
      .summary-card span { color: #52617a; }
      .issue-section { margin-top: 36px; }
      .section-description { margin: 6px 0 18px; color: #52617a; }
      .issue-list { display: grid; gap: 16px; }
      .issue-card { padding: 22px; background: white; border: 1px solid #dfe6f1; border-radius: 16px; box-shadow: 0 8px 24px #1720330d; }
      .issue-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
      .impact { padding: 4px 9px; border-radius: 999px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
      .impact-critical { color: #7f1d1d; background: #fee2e2; }
      .impact-serious { color: #7c2d12; background: #ffedd5; }
      .impact-moderate { color: #713f12; background: #fef9c3; }
      .impact-minor, .impact-unknown { color: #334155; background: #e2e8f0; }
      dl { display: grid; gap: 12px; margin: 18px 0; }
      dl div { display: grid; grid-template-columns: 110px 1fr; gap: 12px; }
      dt { color: #52617a; font-weight: 700; }
      dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
      code { font-family: "SFMono-Regular", Consolas, monospace; }
      a { color: #2357d9; font-weight: 700; }
      .empty-state { padding: 18px; color: #166534; background: #dcfce7; border-radius: 12px; }
      footer { margin-top: 48px; color: #64748b; font-size: 0.9rem; }
      @media (max-width: 680px) {
        main { margin-top: 16px; }
        header { padding: 24px; }
        .summary { grid-template-columns: 1fr; }
        .url-row, dl div { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Accessibility comparison</h1>
        <p class="subtitle">Generated by a11y-diff</p>
        <div class="status ${passed ? "status-pass" : "status-fail"}">${statusLabel}</div>
        <div class="urls">
          <div class="url-row"><span>Baseline</span><code>${escapeHtml(baseline.url)}</code></div>
          <div class="url-row"><span>Candidate</span><code>${escapeHtml(candidate.url)}</code></div>
        </div>
      </header>

      <section class="summary" aria-label="Comparison summary">
        <div class="summary-card"><strong>${comparison.introduced.length}</strong><span>Introduced</span></div>
        <div class="summary-card"><strong>${comparison.fixed.length}</strong><span>Fixed</span></div>
        <div class="summary-card"><strong>${comparison.unchanged.length}</strong><span>Unchanged</span></div>
      </section>

      ${issueSection(
        "Introduced issues",
        "Problems found in the candidate that were not found in the baseline.",
        comparison.introduced,
        "No new automatically detectable accessibility issues were introduced.",
      )}
      ${issueSection(
        "Fixed issues",
        "Problems found in the baseline but no longer found in the candidate.",
        comparison.fixed,
        "No existing issues were fixed in this comparison.",
      )}
      ${issueSection(
        "Unchanged issues",
        "Problems that appear in both versions.",
        comparison.unchanged,
        "No unchanged issues were found.",
      )}

      <footer>
        Automated testing cannot prove that a page is fully accessible. Manual keyboard and screen-reader testing is still necessary.
      </footer>
    </main>
  </body>
</html>`;
}
