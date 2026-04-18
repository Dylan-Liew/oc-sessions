import process from "node:process";
import type { CommandModule } from "yargs";
import { fail } from "../../lib/errors.js";
import { runOpencodeWithStatus } from "../../services/opencode.js";
import { getLatestSessionForDirectory, openSessionStore } from "../../services/sessions.js";

const EMPTY_PROMPT = "";

function getLatestSessionId(directory: string): string | undefined {
  const db = openSessionStore();

  try {
    return getLatestSessionForDirectory(db, directory)?.sessionId;
  } finally {
    db.close();
  }
}

export function runNewCommand(args: string[]): never {
  const [title, ...promptParts] = args;

  if (!title) {
    fail("Missing required title");
  }

  const directory = process.cwd();
  const latestBefore = getLatestSessionId(directory);
  const prompt = promptParts.length > 0 ? promptParts.join(" ") : EMPTY_PROMPT;
  const commandParts = ["run", "--title", title, prompt];
  const exitCode = runOpencodeWithStatus(commandParts, directory);

  if (exitCode === 0) {
    const latestAfter = getLatestSessionId(directory);

    if (!latestAfter || latestAfter === latestBefore) {
      process.stderr.write(
        `Warning: opencode run completed but could not confirm creation of a new titled session for "${title}".\n`,
      );
    }
  }

  process.exit(exitCode);
}

export const newCommand: CommandModule = {
  command: "new <title> [prompt...]",
  describe: "Start a new titled OpenCode session",
  builder: (yargs) =>
    yargs
      .positional("title", {
        describe: "Title to apply to the newly created session",
        type: "string",
      })
      .positional("prompt", {
        describe: "Optional prompt to send to OpenCode",
        type: "string",
        array: true,
      }),
  handler: (argv) => {
    const { prompt, title } = argv as { prompt?: unknown; title?: unknown };
    const promptParts = Array.isArray(prompt) ? prompt.map(String) : [String(prompt ?? "")];
    runNewCommand([String(title ?? ""), ...promptParts]);
  },
};
