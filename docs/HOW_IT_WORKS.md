# How a11y-diff works

## The short explanation

`a11y-diff` receives two URLs: a baseline representing the current website and
a candidate representing a proposed update. It opens each URL in an automated
Chromium browser, runs axe-core, converts the results into a smaller internal
format, and compares those results. A problem found only in the candidate is an
accessibility regression.

## The data flow

1. The user types URLs into a terminal command.
2. `cli.ts` reads the command-line arguments.
3. `scanner.ts` validates each URL and launches Chromium through Playwright.
4. axe-core inspects the rendered page and returns rule violations.
5. The scanner flattens the results into `AccessibilityIssue` objects.
6. `compare.ts` assigns each issue a key made from its rule ID and CSS target.
7. The comparison classifies each key as introduced, fixed, or unchanged.
8. `format.ts` converts the result into readable terminal text.
9. If `--output` is present, `html-report.ts` creates a standalone webpage and
   the CLI writes it to disk.
10. The CLI returns exit code `1` if it found a regression.

## What each file does

### `src/cli.ts`

CLI means **command-line interface**. This is the program's entry point: the
first code that runs. It reads `process.argv`, which is Node's list of terminal
arguments, and coordinates the other modules.

It accepts:

- One URL to perform a normal scan.
- Two URLs to perform a regression comparison.
- `--help` or `-h` to display instructions.
- `--output <file>` or `-o <file>` to save a comparison as HTML.

The CLI is also responsible for creating the report directory and writing the
finished HTML string to the selected file.

### `src/args.ts`

Terminal input arrives as a plain array of strings. The argument parser turns
that raw array into a `CliOptions` object containing URLs, an optional output
path, and the help flag. It also rejects missing values and unknown options.

### `src/scanner.ts`

The scanner has two responsibilities:

- Confirm the input is a valid HTTP or HTTPS URL.
- Open the page and collect accessibility violations.

Playwright launches a **headless** Chromium browser. Headless means the browser
runs without displaying a normal window. The scanner creates a browser context,
which is an isolated session comparable to a fresh incognito window.

The `finally` block always closes Chromium. `finally` runs whether the scan
succeeds or throws an error, preventing abandoned browser processes.

### `src/types.ts`

An interface describes the required shape of an object. For example, every
`AccessibilityIssue` must have a rule ID, target, severity, explanation, and
help URL. TypeScript checks these contracts before the program runs.

### `src/compare.ts`

The comparison module is intentionally independent of the browser. It accepts
ordinary data, which makes it fast and easy to test.

An issue key currently looks like:

```text
button-name::button.checkout
```

The part before `::` is the axe rule. The part after it is the page element's
CSS target.

- Candidate key absent from baseline: **introduced**.
- Baseline key absent from candidate: **fixed**.
- Key present in both: **unchanged**.

A JavaScript `Map` stores keys for efficient lookup. Without a map, the program
might repeatedly search every issue in the other array.

### `src/format.ts`

The formatter controls presentation only. Keeping it separate means a future
HTML or JSON report can be added without changing the scanner or comparison.

### `src/html-report.ts`

The HTML formatter turns the same comparison object into a complete, styled
webpage. The CSS is embedded in the file, so the report has no external assets
and can be opened on another computer.

Every value originating from a scanned page is HTML-escaped before it enters the
report. Escaping changes characters such as `<` into `&lt;`, making the browser
display them as text instead of interpreting them as executable markup. This
prevents a scanned page from injecting code into its report.

### `src/compare.test.ts`

This file contains unit tests. A unit test gives one small piece of code known
input and verifies the output. The test creates one existing issue, one fixed
issue, and one introduced issue, then confirms each lands in the right group.

### `src/cli.integration.test.ts`

The integration test checks the entire built application:

1. Node starts a temporary HTTP server on an automatically selected free port.
2. The server provides the baseline and candidate sample pages.
3. Vitest starts the compiled CLI as a child process.
4. The CLI launches Chromium, scans both pages, and writes a temporary report.
5. The test verifies exit code `1`, the two expected issue names, and the report.
6. A `finally` block removes the exact temporary directory, and `afterAll`
   closes the server.

This is slower than a unit test but catches wiring problems that isolated tests
cannot, such as a broken CLI entry point, missing build output, browser failures,
or a report that was never written.

## Dependencies

### Node.js

The runtime that executes the compiled JavaScript outside a web browser.

### npm

The package manager. It downloads dependencies and runs the commands defined in
`package.json`.

### TypeScript

JavaScript with static type checking. The `npm run check` command finds many
mistakes without executing the program. `npm run build` compiles `.ts` source
files into `.js` files inside `dist/`.

### Playwright

Browser automation software. It launches Chromium, opens a URL, and gives
axe-core access to the rendered page.

### axe-core

The accessibility rules engine. It knows how to detect problems such as missing
image descriptions and unnamed buttons. This project does not recreate those
rules; its contribution is running, normalizing, comparing, and presenting them.

### Vitest

The test runner. It discovers test files, executes them, and reports whether the
expected behavior matched the actual behavior.

## Important terms

- **Accessibility (a11y):** making software usable by people with disabilities.
  `a11y` is shorthand because eleven letters occur between `a` and `y`.
- **Baseline:** the current or known version used as the comparison reference.
- **Candidate:** the proposed new version being evaluated.
- **Regression:** something that used to work but became worse after a change.
- **CSS selector/target:** text that identifies an element on a webpage, such as
  `button.checkout` or `img.logo`.
- **Module:** a file that exports code for other files to import.
- **Dependency:** an external package the project relies on.
- **Exit code:** a number a program returns to the operating system. `0` means
  success, `1` means accessibility regressions were found, and `2` means the
  command or scan failed.
- **CI (continuous integration):** an automated system that runs checks whenever
  developers submit code changes.
- **Workflow:** a YAML file describing automated jobs and the events that start
  them.
- **Runner:** the temporary computer GitHub provides to execute a workflow.
- **Job:** a group of steps executed together on one runner.
- **Step:** one action or shell command inside a job.
- **`npm ci`:** a clean, reproducible install using the exact lockfile versions;
  it is preferred over `npm install` in automated environments.
- **Unit test:** a fast test of one small function or module in isolation.
- **Integration test:** a test that proves multiple real components work
  together.
- **End-to-end test:** a form of integration test that exercises the application
  from its public entry point through its final output.
- **Child process:** a separate program launched and observed by another program.
- **Ephemeral port:** a currently free network port automatically selected by
  the operating system for temporary use.
- **HTML escaping:** converting special characters into safe text so untrusted
  content cannot change the structure or behavior of a generated webpage.

## Honest limitations

The current matching method is deliberately simple. If a page redesign changes
an element's CSS selector, the same underlying problem may look fixed at the old
selector and introduced at the new one. A later version could use additional
element information to make matching more stable.

Scanning one page does not crawl an entire website. Authentication, screenshots,
JSON output, and a reusable GitHub Action are future features, not current
features.

Most importantly, automated accessibility scanning catches only some kinds of
problems. Human testing remains necessary.

## GitHub Actions workflow

`.github/workflows/ci.yml` defines continuous integration for the repository.
GitHub Actions reads this YAML file and creates a fresh Ubuntu runner for every
push or pull request targeting `main`.

- `actions/checkout` copies the repository onto the runner.
- `actions/setup-node` installs Node.js and caches npm downloads.
- `npm ci` installs the exact dependency versions in `package-lock.json`.
- `playwright install --with-deps chromium` installs Chromium and required Linux
  system libraries.
- `npm run check` performs static TypeScript checking.
- `npm test` builds the production CLI and runs all unit and end-to-end tests.

The workflow requests only read access to repository contents. A concurrency
group cancels obsolete runs when newer code is pushed to the same branch.

## Interview-ready explanation

> I built a TypeScript command-line tool that detects accessibility regressions
> between a production webpage and a proposed version. Playwright opens both
> pages in headless Chromium, and axe-core analyzes their rendered HTML. I
> normalize axe's nested output into issue objects and match issues using the
> rule ID and CSS target. That lets the tool distinguish newly introduced,
> fixed, and unchanged issues. The comparison logic is isolated from browser
> automation, so it can be unit tested. The tool returns a failing exit code
> when it detects a regression, which prepares it for CI integration.

Likely follow-up questions:

**Why not write your own accessibility rules?**

Accessibility standards are complex, so the project uses the established
axe-core engine. The project's original work is orchestration, normalization,
regression matching, reporting, and eventually CI integration.

**Why use a real browser?**

Modern websites generate content with JavaScript. A real browser evaluates that
JavaScript and produces the rendered page that users actually interact with.

**Why separate the files?**

Each module has one responsibility. In particular, pure comparison logic can be
tested without starting a slow browser.

**What would you improve next?**

Add JSON output, more reliable matching, screenshots, and package the scanner as
a reusable GitHub Action.
