export type ReportFormat = "html" | "json";

export interface CliOptions {
  urls: string[];
  output?: string;
  format: ReportFormat;
  help: boolean;
}

export function parseArgs(args: string[]): CliOptions {
  const urls: string[] = [];
  let output: string | undefined;
  let format: ReportFormat = "html";
  let formatWasProvided = false;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === "--help" || argument === "-h") {
      help = true;
      continue;
    }

    if (argument === "--output" || argument === "-o") {
      const value = args[index + 1];

      if (!value || value.startsWith("-")) {
        throw new Error(`${argument} requires a file path.`);
      }

      output = value;
      index += 1;
      continue;
    }

    if (argument.startsWith("--output=")) {
      output = argument.slice("--output=".length);

      if (!output) {
        throw new Error("--output requires a file path.");
      }

      continue;
    }

    if (argument === "--format") {
      const value = args[index + 1];

      if (!value || value.startsWith("-")) {
        throw new Error("--format requires html or json.");
      }

      if (value !== "html" && value !== "json") {
        throw new Error(`Unsupported report format: ${value}`);
      }

      format = value;
      formatWasProvided = true;
      index += 1;
      continue;
    }

    if (argument.startsWith("--format=")) {
      const value = argument.slice("--format=".length);

      if (value !== "html" && value !== "json") {
        throw new Error(`Unsupported report format: ${value || "(empty)"}`);
      }

      format = value;
      formatWasProvided = true;
      continue;
    }

    if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    }

    urls.push(argument);
  }

  if (output && urls.length !== 2) {
    throw new Error("A report requires a baseline URL and a candidate URL.");
  }

  if (formatWasProvided && !output) {
    throw new Error("--format requires --output.");
  }

  return { urls, output, format, help };
}
