import type { CommandModule } from "yargs";
import { cleanupCommand } from "./cleanup.js";
import { completionCommand, completeCommand } from "./completion.js";
import { deleteCommand } from "./delete.js";
import { helpCommand } from "./help.js";
import { listCommand } from "./list.js";
import { newCommand } from "./new.js";
import { projectsCommand } from "./projects.js";
import { renameCommand } from "./rename.js";
import { resumeCommand } from "./resume.js";
import { viewCommand } from "./view.js";

export const commandModules = [
  newCommand,
  resumeCommand,
  listCommand,
  viewCommand,
  renameCommand,
  deleteCommand,
  projectsCommand,
  cleanupCommand,
  helpCommand,
  completionCommand,
] as const satisfies ReadonlyArray<CommandModule>;

export const internalCommandModules = [
  completeCommand,
] as const satisfies ReadonlyArray<CommandModule>;
