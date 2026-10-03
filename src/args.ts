export interface CliOptions {
  urls: string[];
  output?: string;
  help: boolean;
}

export function parseArgs(args: string[]): CliOptions {
  const urls: string[] = [];
  let output: string | undefined;
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

    if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    }

    urls.push(argument);
  }

  if (output && urls.length !== 2) {
    throw new Error("An HTML report requires a baseline URL and a candidate URL.");
  }

  return { urls, output, help };
}
