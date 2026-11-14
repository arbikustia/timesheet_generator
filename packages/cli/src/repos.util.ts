import { basename } from "node:path";

import type { AutomationRepo, TimesheetDoc } from "@/types/timesheet.type";

import type { CliArgs, CliPaths } from "./cli.type";
import { readCliConfig, writeCliConfig } from "./worklog.util";

/**
 * Repositories for a snapshot: `--repo` paths, then the document (copied to config.json), then config.json.
 * @param {CliArgs} args - Arguments
 * @param {TimesheetDoc | null} doc - Document from `--doc`
 * @param {CliPaths} paths - CLI paths
 * @returns {Promise<AutomationRepo[]>} - Repositories with a path
 */
export const resolveRepos = async (args: CliArgs, doc: TimesheetDoc | null, paths: CliPaths): Promise<AutomationRepo[]> => {
  const config = await readCliConfig(paths);
  const docRepos = (doc?.automation.repos ?? []).filter((repo) => repo.path.trim());

  if (docRepos.length > 0) {
    await writeCliConfig(paths, { ...config, repos: docRepos });
  }

  const base = docRepos.length > 0 ? docRepos : config.repos;
  const extra = args.repos.filter((path) => !base.some((repo) => repo.path === path)).map((path) => ({ path, label: basename(path) }));

  return [...base, ...extra];
};
