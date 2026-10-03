# a11y-diff

[![CI](https://github.com/HarryCain/a11y-diff/actions/workflows/ci.yml/badge.svg)](https://github.com/HarryCain/a11y-diff/actions/workflows/ci.yml)

`a11y-diff` is a command-line tool that compares two versions of a webpage and
reports accessibility problems introduced by the newer version.

Think of it as a spell-checker for website accessibility. Existing scanners can
find problems; this project focuses on identifying which problems are **new**.

## Current features

- Scan one webpage for automatically detectable accessibility issues.
- Compare a baseline page with a candidate page.
- Classify issues as introduced, fixed, or unchanged.
- Generate a portable, styled HTML report.
- Return exit code `1` when the candidate introduces an issue, making the tool
  suitable for future CI use.
- Validate input and close the browser even when a scan fails.

## Requirements

- Node.js 20 or newer
- npm

## Setup

```bash
npm install
npx playwright install chromium
npm run build
```

## Use

Scan one page:

```bash
npm start -- https://example.com
```

Compare a current page with a proposed new version:

```bash
npm start -- https://current.example.com https://preview.example.com
```

Generate an HTML report:

```bash
npm start -- \
  https://current.example.com \
  https://preview.example.com \
  --output reports/accessibility.html
```

During development, run the TypeScript source directly:

```bash
npm run dev -- https://example.com
```

Run the quality checks:

```bash
npm run check
npm test
npm run build
```

Run only the fast unit tests:

```bash
npm run test:unit
```

Run only the browser-based integration test:

```bash
npm run test:integration
```

`npm test` builds the CLI and runs both groups.

## Continuous integration

The workflow in `.github/workflows/ci.yml` runs automatically for pushes and
pull requests targeting `main`. GitHub provides a fresh Ubuntu machine that:

1. Checks out the repository.
2. Installs Node.js 24 and restores npm's download cache.
3. Reproduces dependencies from `package-lock.json` with `npm ci`.
4. Installs Chromium and the Linux libraries it needs.
5. Checks TypeScript and runs all unit and end-to-end tests.

The workflow has read-only repository permissions. Its concurrency setting also
cancels an older run when newer code is pushed to the same branch.

## Try the included demo

Start a local server in one terminal:

```bash
python3 -m http.server 4173 --directory examples
```

In another terminal, run:

```bash
npm start -- \
  http://127.0.0.1:4173/baseline.html \
  http://127.0.0.1:4173/candidate.html \
  --output reports/demo.html
```

The candidate intentionally contains an unnamed button and an image without
alternative text, so the command should report two introduced issues.

## Architecture

```text
URLs typed in the terminal
          |
          v
      src/cli.ts          reads input and coordinates the program
          |
      src/args.ts         turns raw command text into structured options
          |
          v
    src/scanner.ts        opens Chromium and runs axe-core
          |
          v
      src/types.ts        defines the data passed between modules
          |
          v
    src/compare.ts        labels issues introduced/fixed/unchanged
          |
          v
     src/format.ts        creates readable terminal output
          |
          v
  src/html-report.ts      creates a portable visual report
```

The comparison currently identifies an issue using its axe rule ID plus its
CSS target. For example, `image-alt::img.logo` means the `image-alt` rule failed
on `img.logo`.

## What this project does not claim

Automated tools cannot prove that a website is fully accessible. They can only
find certain machine-detectable problems. Manual testing with a keyboard,
screen reader, and human judgment is still necessary.

For a detailed code tour, vocabulary, and interview explanation, read
[`docs/HOW_IT_WORKS.md`](docs/HOW_IT_WORKS.md).
