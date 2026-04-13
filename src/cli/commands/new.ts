import process from "node:process";
import { fail } from "../../lib/errors.js";
import { runOpencodeWithStatus } from "../../services/opencode.js";
import {
  listRootSessionsForDirectory,
  openSessionStore,
  openSessionStoreWritable,
  setSessionTitle,
} from "../../services/sessions.js";

function getRootSessionIdsForDirectory(directory: string): Set<string> {
  const db = openSessionStore();

  try {
    return new Set(listRootSessionsForDirectory(db, directory).map((session) => session.sessionId));
  } finally {
    db.close();
  }
}

function applyTitleToNewestNewSession(directory: string, title: string, existingIds: Set<string>): void {
  const readDb = openSessionStore();
  let sessionId: string | undefined;

  try {
    const sessions = listRootSessionsForDirectory(readDb, directory);
    sessionId = sessions.find((session) => !existingIds.has(session.sessionId))?.sessionId;
  } finally {
    readDb.close();
  }

  if (!sessionId) {
    return;
  }

  const writeDb = openSessionStoreWritable();

  try {
    setSessionTitle(writeDb, sessionId, title);
  } finally {
    writeDb.close();
  }
}

export function runNewCommand(args: string[]): never {
  const [title, ...promptParts] = args;

  if (!title) {
    fail("Missing required title");
  }

  const directory = process.cwd();
  const existingIds = getRootSessionIdsForDirectory(directory);
  const prompt = promptParts.length > 0 ? promptParts.join(" ") : title;
  const exitCode = runOpencodeWithStatus(["--prompt", prompt], directory);

  if (exitCode === 0) {
    applyTitleToNewestNewSession(directory, title, existingIds);
  }

  process.exit(exitCode);
}
