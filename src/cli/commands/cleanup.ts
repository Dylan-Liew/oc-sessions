import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import type { CommandModule } from "yargs";
import {
  deleteUnusedProjects,
  getSessionStorePath,
  openSessionStoreWritable,
  sessionExists,
} from "../../services/sessions.js";

interface CleanupResult {
  projectsRemoved: number;
  sessionDiffFilesRemoved: number;
  vacuumed: boolean;
}

function removeStaleSessionDiffFiles(): number {
  const db = openSessionStoreWritable();
  const dbPath = getSessionStorePath();
  const sessionDiffDir = path.join(path.dirname(dbPath), "storage", "session_diff");

  try {
    if (!fs.existsSync(sessionDiffDir)) {
      return 0;
    }

    const entries = fs.readdirSync(sessionDiffDir, { withFileTypes: true });
    let removed = 0;

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const match = /^ses_[^.]+\.json$/.exec(entry.name);

      if (!match) {
        continue;
      }

      const sessionId = entry.name.slice(0, -".json".length);

      if (sessionExists(db, sessionId)) {
        continue;
      }

      fs.unlinkSync(path.join(sessionDiffDir, entry.name));
      removed += 1;
    }

    return removed;
  } finally {
    db.close();
  }
}

export function runCleanupCommand(vacuum: boolean): void {
  const db = openSessionStoreWritable();

  try {
    const projectsRemoved = deleteUnusedProjects(db);

    if (vacuum) {
      db.prepare("VACUUM").run();
    }

    db.close();

    const sessionDiffFilesRemoved = removeStaleSessionDiffFiles();
    const result: CleanupResult = {
      projectsRemoved,
      sessionDiffFilesRemoved,
      vacuumed: vacuum,
    };

    process.stdout.write(
      `Cleanup complete. projects_removed=${result.projectsRemoved} session_diff_removed=${result.sessionDiffFilesRemoved} vacuum=${result.vacuumed ? "yes" : "no"}\n`,
    );
  } finally {
    if (db.open) {
      db.close();
    }
  }
}

export const cleanupCommand: CommandModule = {
  command: "cleanup",
  describe: "Clean stale OpenCode DB/cache artifacts",
  builder: (yargs) =>
    yargs.option("vacuum", {
      type: "boolean",
      default: false,
      describe: "Run SQLite VACUUM to reclaim DB disk space",
    }),
  handler: (argv) => {
    runCleanupCommand(Boolean((argv as { vacuum?: unknown }).vacuum));
  },
};
