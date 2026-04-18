import type { CommandModule } from "yargs";
import { runOpencodeWithStatus } from "../../services/opencode.js";
export function runNewCommand(): never {
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
