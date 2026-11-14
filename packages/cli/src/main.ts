import { readFileSync, realpathSync } from "node:fs";
import { homedir } from "node:os";

import type { CliIo } from "./cli.type";
import { runCli } from "./cli.util";
import { runCommand } from "./command.util";
import { runGit } from "./git.util";
import { getSchedulerPlatform } from "./scheduler.util";

/**
 * Write to stdout.
 * @param {string} text - Text
 * @returns {void}
 */
const writeOut = (text: string): void => {
  process.stdout.write(text);
};

/**
 * Write to stderr.
 * @param {string} text - Text
 * @returns {void}
 */
const writeErr = (text: string): void => {
  process.stderr.write(text);
};

/**
 * Current time.
 * @returns {Date} - Now
 */
const getNow = (): Date => new Date();

/**
 * Whether Node runs inside WSL (cron there needs the service to be started).
 * @returns {boolean} - True on WSL
 */
const isWsl = (): boolean => {
  try {
    return process.platform === "linux" && /microsoft/i.test(readFileSync("/proc/version", "utf8"));
  } catch {
    return false;
  }
};

const io: CliIo = {
  out: writeOut,
  err: writeErr,
  env: process.env,
  now: getNow,
  git: runGit,
  run: runCommand,
  host: { platform: getSchedulerPlatform(process.platform), homeDir: homedir(), isWsl: isWsl() },
  nodePath: process.execPath,
  scriptPath: realpathSync(process.argv[1]),
};

void runCli(process.argv.slice(2), io).then((code) => {
  process.exitCode = code;
});
