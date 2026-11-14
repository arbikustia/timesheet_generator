import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { READ_ONLY_GIT_COMMANDS } from "./cli.config";

const execFileAsync = promisify(execFile);

/**
 * Refuse anything but read-only git commands (`config` only with `--get`).
 * @param {string[]} args - Git arguments
 * @returns {void}
 */
export const assertReadOnlyGit = (args: string[]): void => {
  const [command] = args;

  if (!READ_ONLY_GIT_COMMANDS.includes(command) || (command === "config" && !args.includes("--get"))) {
    throw new Error(`Perintah git tidak diizinkan (read-only): git ${args.join(" ")}`);
  }
};

/**
 * Run a read-only git command in a repository. `GIT_OPTIONAL_LOCKS=0` stops `git status` from refreshing
 * the index, so nothing is ever written to `.git/`.
 * @param {string} repoPath - Repository folder
 * @param {string[]} args - Git arguments
 * @returns {Promise<string>} - Stdout
 */
export const runGit = async (repoPath: string, args: string[]): Promise<string> => {
  assertReadOnlyGit(args);

  const { stdout } = await execFileAsync("git", args, {
    cwd: repoPath,
    env: { ...process.env, GIT_OPTIONAL_LOCKS: "0", LC_ALL: "C" },
    maxBuffer: 16 * 1024 * 1024,
  });

  return stdout;
};
