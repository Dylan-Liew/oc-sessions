import type { CommandModule } from "yargs";
import { runOpencodeWithStatus } from "../../services/opencode.js";
import { renameZellijTab } from "../../services/zellij.js";

export function runNewCommand(): never {
  renameZellijTab("opencode");
  const exitCode = runOpencodeWithStatus([], process.cwd());
  process.exit(exitCode);
}

export const newCommand: CommandModule = {
  command: "new",
  describe: "Start a new OpenCode session",
  handler: () => {
    runNewCommand();
  },
};
