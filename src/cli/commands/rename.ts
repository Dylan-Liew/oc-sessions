import process from "node:process";
import type { CommandModule } from "yargs";
import { fail } from "../../lib/errors.js";
import { resolveSessionIdInteractively } from "../session-picker.js";
import { getSession, openSessionStoreWritable, setSessionTitle } from "../../services/sessions.js";

export async function runRenameCommand(input: string, titleParts: string[]): Promise<void> {
  const title = titleParts.join(" ").trim();

  if (!title) {
    fail("Specify a new title.");
  }

  const db = openSessionStoreWritable();

  try {
    const id = await resolveSessionIdInteractively(db, input, { allowTitle: true });
    const session = getSession(db, id);

    if (!session) {
      fail(`Session not found: ${id}`);
    }

    setSessionTitle(db, id, title);
    process.stdout.write(`Renamed ${id}\n${session.title} -> ${title}\n`);
  } finally {
    db.close();
  }
}

export const renameCommand: CommandModule = {
  command: "rename <session> <title...>",
  aliases: ["mv"],
  describe: "Rename a session title",
  builder: (yargs) =>
    yargs
      .positional("session", {
        describe: "Session ID, unique prefix, or title",
        type: "string",
      })
      .positional("title", {
        describe: "New session title",
        type: "string",
        array: true,
      }),
  handler: async (argv) => {
    const args = argv as { session?: unknown; title?: unknown };
    const title = Array.isArray(args.title) ? args.title.map(String) : [String(args.title ?? "")];
    await runRenameCommand(String(args.session ?? ""), title);
  },
};
