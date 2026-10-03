import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

function runCli(args: string[]): Promise<ProcessResult> {
  return new Promise((resolveProcess, reject) => {
    const child = spawn(process.execPath, [resolve("dist/cli.js"), ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolveProcess({ code, stdout, stderr });
    });
  });
}

describe("a11y-diff CLI", () => {
  let server: Server;
  let serverUrl: string;

  beforeAll(async () => {
    const [baseline, candidate] = await Promise.all([
      readFile(resolve("examples/baseline.html"), "utf8"),
      readFile(resolve("examples/candidate.html"), "utf8"),
    ]);

    server = createServer((request, response) => {
      if (request.url === "/baseline.html") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(baseline);
        return;
      }

      if (request.url === "/candidate.html") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(candidate);
        return;
      }

      response.writeHead(404);
      response.end("Not found");
    });

    await new Promise<void>((resolveListen, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolveListen);
    });

    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("The test server did not receive a TCP port.");
    }

    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolveClose, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolveClose();
      });
    });
  });

  it(
    "scans two pages, reports regressions, and writes an HTML report",
    async () => {
      const temporaryDirectory = await mkdtemp(join(tmpdir(), "a11y-diff-test-"));
      const reportPath = join(temporaryDirectory, "report.html");

      try {
        const result = await runCli([
          `${serverUrl}/baseline.html`,
          `${serverUrl}/candidate.html`,
          "--output",
          reportPath,
        ]);

        expect(result.code).toBe(1);
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("Introduced: 2 issues");
        expect(result.stdout).toContain("button-name");
        expect(result.stdout).toContain("image-alt");

        const report = await readFile(reportPath, "utf8");
        expect(report).toContain("Regressions detected");
        expect(report).toContain("button-name");
        expect(report).toContain("image-alt");
      } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    },
    30_000,
  );

  it(
    "writes a versioned JSON report for automated consumers",
    async () => {
      const temporaryDirectory = await mkdtemp(join(tmpdir(), "a11y-diff-test-"));
      const reportPath = join(temporaryDirectory, "report.json");

      try {
        const result = await runCli([
          `${serverUrl}/baseline.html`,
          `${serverUrl}/candidate.html`,
          "--output",
          reportPath,
          "--format",
          "json",
        ]);

        expect(result.code).toBe(1);
        expect(result.stderr).toBe("");
        expect(result.stdout).toContain("JSON report:");

        const report = JSON.parse(await readFile(reportPath, "utf8")) as {
          schemaVersion: number;
          summary: { introduced: number; passed: boolean };
          issues: { introduced: Array<{ ruleId: string }> };
        };

        expect(report.schemaVersion).toBe(1);
        expect(report.summary).toMatchObject({ introduced: 2, passed: false });
        expect(report.issues.introduced.map((issue) => issue.ruleId)).toEqual([
          "button-name",
          "image-alt",
        ]);
      } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    },
    30_000,
  );
});
