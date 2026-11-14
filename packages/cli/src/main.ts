import type { CliIo } from "./cli.type";
import { runCli } from "./cli.util";
import { runGit } from "./git.util";

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

const io: CliIo = { out: writeOut, err: writeErr, env: process.env, now: getNow, git: runGit };

void runCli(process.argv.slice(2), io).then((code) => {
  process.exitCode = code;
});
