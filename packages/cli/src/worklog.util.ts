import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import { CONFIG_FILE, WORKLOG_FILE } from "./cli.config";
import { type CliConfig, CliConfigSchema, type CliPaths, type WorklogLine, WorklogLineSchema, type WorklogRead } from "./cli.type";

/**
 * Data folder of the CLI: `$TIMESHEET_HOME`, else `~/.timesheet` (always outside work repositories).
 * @param {Partial<Record<string, string>>} env - Environment variables
 * @returns {CliPaths} - Folder, worklog and config paths
 */
export const getCliPaths = (env: Partial<Record<string, string>>): CliPaths => {
  const home = env.TIMESHEET_HOME || join(homedir(), ".timesheet");

  return { home, worklog: join(home, WORKLOG_FILE), config: join(home, CONFIG_FILE) };
};

/**
 * Append one line to the worklog (append-only; a crash can at worst leave a partial last line).
 * @param {CliPaths} paths - CLI paths
 * @param {WorklogLine} line - Line to append
 * @returns {Promise<void>} - Resolves when written
 */
export const appendWorklogLine = async (paths: CliPaths, line: WorklogLine): Promise<void> => {
  await mkdir(paths.home, { recursive: true });
  await appendFile(paths.worklog, `${JSON.stringify(WorklogLineSchema.parse(line))}\n`, "utf8");
};

/**
 * Parse worklog text; broken or unknown lines are counted and skipped.
 * @param {string} text - File contents
 * @returns {WorklogRead} - Valid lines and the number of skipped ones
 */
export const parseWorklog = (text: string): WorklogRead => {
  const rows = text.split("\n").filter((row) => row.trim());
  const lines: WorklogLine[] = [];

  rows.forEach((row) => {
    try {
      const parsed = WorklogLineSchema.safeParse(JSON.parse(row));

      if (parsed.success) {
        lines.push(parsed.data);
      }
    } catch {
      // A partial last line (process killed mid-write) is skipped.
    }
  });

  return { lines, invalidLines: rows.length - lines.length };
};

/**
 * Read the worklog; a missing file is an empty worklog.
 * @param {CliPaths} paths - CLI paths
 * @returns {Promise<WorklogRead>} - Lines
 */
export const readWorklog = async (paths: CliPaths): Promise<WorklogRead> => {
  try {
    return parseWorklog(await readFile(paths.worklog, "utf8"));
  } catch {
    return { lines: [], invalidLines: 0 };
  }
};

/**
 * Read `config.json`; missing or broken files give the defaults.
 * @param {CliPaths} paths - CLI paths
 * @returns {Promise<CliConfig>} - Config
 */
export const readCliConfig = async (paths: CliPaths): Promise<CliConfig> => {
  try {
    const parsed = CliConfigSchema.safeParse(JSON.parse(await readFile(paths.config, "utf8")));

    return parsed.success ? parsed.data : CliConfigSchema.parse({});
  } catch {
    return CliConfigSchema.parse({});
  }
};

/**
 * Save the machine-specific repository list next to the worklog (other keys are kept).
 * @param {CliPaths} paths - CLI paths
 * @param {CliConfig} config - Config to write
 * @returns {Promise<void>} - Resolves when written
 */
export const writeCliConfig = async (paths: CliPaths, config: CliConfig): Promise<void> => {
  await mkdir(paths.home, { recursive: true });
  await writeFile(paths.config, `${JSON.stringify(config, null, 2)}\n`, "utf8");
};
