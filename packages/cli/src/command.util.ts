import { spawn } from "node:child_process";

import type { CommandResult } from "./cli.type";

/**
 * Run a program without a shell (scheduler tools such as `crontab`, `launchctl`, `schtasks`).
 * @param {string} command - Program
 * @param {string[]} args - Arguments
 * @param {string} [input] - Text written to stdin
 * @returns {Promise<CommandResult>} - Exit code and output; a missing program gives code 127
 */
export const runCommand = (command: string, args: string[], input?: string): Promise<CommandResult> => {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => resolve({ code: 127, stdout, stderr: error.message }));
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    child.stdin.end(input ?? "");
  });
};
