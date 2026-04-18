import type { CommandModule } from "yargs";
import { completionCommand, completeCommand } from "./completion.js";
import { deleteCommand } from "./delete.js";
import { helpCommand } from "./help.js";
import { listCommand } from "./list.js";
import { newCommand } from "./new.js";
import { resumeCommand } from "./resume.js";
import { viewCommand } from "./view.js";

export const commandModules = [
  newCommand,
  resumeCommand,
  listCommand,
  viewCommand,
  deleteCommand,
  helpCommand,
  completionCommand,
] as const satisfies ReadonlyArray<CommandModule>;

export const internalCommandModules = [
  completeCommand,
] as const satisfies ReadonlyArray<CommandModule>;
