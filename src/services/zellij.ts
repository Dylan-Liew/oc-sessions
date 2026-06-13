import { spawnSync } from "node:child_process";

function sanitizeTabName(name: string): string {
  return name.replace(/[\t\n\r]+/g, " ").trim().slice(0, 80);
}

export function renameZellijTab(name: string): void {
  if (!process.env.ZELLIJ) {
    return;
  }

  const tabName = sanitizeTabName(name);

  if (!tabName) {
    return;
  }

  spawnSync("zellij", ["action", "rename-tab", tabName], { stdio: "ignore" });
}
