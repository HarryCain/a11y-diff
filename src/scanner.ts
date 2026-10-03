import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

import type { AccessibilityIssue, PageScan } from "./types.js";

export function validateWebUrl(value: string): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid URL: "${value}"`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`URL must start with http:// or https://: "${value}"`);
  }

  return url;
}

export async function scanPage(value: string): Promise<PageScan> {
  const url = validateWebUrl(value);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url.href, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    const axeResults = await new AxeBuilder({ page }).analyze();

    const issues: AccessibilityIssue[] = axeResults.violations.flatMap(
      (violation) =>
        violation.nodes.map((node) => ({
          ruleId: violation.id,
          impact: node.impact ?? violation.impact ?? null,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          target: node.target.map(String).join(" "),
          html: node.html,
          failureSummary: node.failureSummary ?? "No additional explanation available.",
        })),
    );

    return {
      url: url.href,
      scannedAt: new Date().toISOString(),
      issues,
    };
  } finally {
    await browser.close();
  }
}
