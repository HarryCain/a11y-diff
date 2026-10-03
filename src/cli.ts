#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parseArgs } from "./args.js";
import { compareScans } from "./compare.js";
import { formatComparison, formatScan } from "./format.js";
import { formatHtmlReport } from "./html-report.js";
import { formatJsonReport } from "./json-report.js";
import { scanPage } from "./scanner.js";

const HELP = `a11y-diff - find accessibility regressions between two web pages

Usage:
  a11y-diff <url>
  a11y-diff <baseline-url> <candidate-url> [--output <file>] [--format html|json]

Examples:
  a11y-diff https://example.com
  a11y-diff https://example.com https://preview.example.com
  a11y-diff https://example.com https://preview.example.com --output report.html
  a11y-diff https://example.com https://preview.example.com --output report.json --format json`;

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(HELP);
    return;
  }

  if (options.urls.length < 1 || options.urls.length > 2) {
    console.error(HELP);
    process.exitCode = 2;
    return;
  }

  if (options.urls.length === 1) {
    console.log(`Scanning ${options.urls[0]}...\n`);
    const scan = await scanPage(options.urls[0]);
    console.log(formatScan(scan));
    return;
  }

  const [baselineUrl, candidateUrl] = options.urls;
  console.log(`Scanning baseline: ${baselineUrl}`);
  const baseline = await scanPage(baselineUrl);

  console.log(`Scanning candidate: ${candidateUrl}\n`);
  const candidate = await scanPage(candidateUrl);

  const comparison = compareScans(baseline, candidate);
  console.log(formatComparison(baseline, candidate, comparison));

  if (options.output) {
    const outputPath = resolve(options.output);
    const report =
      options.format === "json"
        ? formatJsonReport(baseline, candidate, comparison)
        : formatHtmlReport(baseline, candidate, comparison);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, report, "utf8");
    console.log(`\n${options.format.toUpperCase()} report: ${outputPath}`);
  }

  if (comparison.introduced.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nScan failed: ${message}`);
  process.exitCode = 2;
});
