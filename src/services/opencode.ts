import { spawnSync } from "node:child_process";
import process from "node:process";
import { fail } from "../lib/errors.js";

export function ensureOpencodeAvailable(): void {
  const result = spawnSync("opencode", ["--version"], {
    stdio: "ignore",
  });

  if (result.error || result.status !== 0) {
    fail("Missing required command: opencode");
  }
}

export function readOpencode(parts: string[]): string {
  const result = spawnSync("opencode", parts, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    fail(`Failed to run opencode: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || "").trim();
    fail(`Failed to run opencode: ${stderr || `exit code ${result.status}`}`);
  }

  return (result.stdout || "").trim();
}

export function runOpencode(parts: string[], cwd: string): never {
  const result = spawnSync("opencode", parts, {
    cwd,
    stdio: "inherit",
  });

  if (result.error) {
    fail(`Failed to run opencode: ${result.error.message}`);
  }

  process.exit(result.status ?? 1);
}
