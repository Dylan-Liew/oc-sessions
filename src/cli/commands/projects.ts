import type { CommandModule } from "yargs";
import { sanitizeInline } from "../../output/format.js";
import { formatTable } from "../../output/table.js";
import { listProjects, openSessionStore } from "../../services/sessions.js";

export function runProjectsCommand(): void {
  const db = openSessionStore();

  try {
    const rows = listProjects(db);
    process.stdout.write(
      formatTable(
        ["id", "sessions", "roots", "updated", "name", "worktree"],
        rows.map((row) => [
          row.projectId,
          row.sessions,
          row.rootSessions,
          row.lastUpdated,
          sanitizeInline(row.name),
          row.worktree,
        ]),
      ),
    );
  } finally {
    db.close();
  }
}

export const projectsCommand: CommandModule = {
  command: "projects",
  aliases: ["p"],
  describe: "List OpenCode projects and session counts",
  handler: () => {
    runProjectsCommand();
  },
};
