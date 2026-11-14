import { stat } from "node:fs/promises";
import { basename, join } from "node:path";

import type { AutomationRepo } from "@/types/timesheet.type";

import type { ChangedFile, GitRunner, GitSnapshotLine, MtimeReader, SnapshotContext, StatusEntry } from "./cli.type";
import { parseNumstat, parsePorcelainV2, sumLineCounts } from "./git-status.util";
import { extractTicket } from "./ticket.util";
import { toLocalDate, toLocalTimestamp } from "./time.util";

/**
 * Modification time of a file; never reads its contents.
 * @param {string} path - File path
 * @returns {Promise<number | null>} - Time in ms, or null when missing
 */
export const readMtime: MtimeReader = async (path: string): Promise<number | null> => {
  try {
    return (await stat(path)).mtimeMs;
  } catch {
    return null;
  }
};

/**
 * Untracked paths modified on the snapshot day (older untracked files are not today's work).
 * @param {StatusEntry[]} entries - Untracked entries
 * @param {string} repoPath - Repository folder
 * @param {Date} now - Snapshot time
 * @param {MtimeReader} mtimeOf - Reads modification times
 * @returns {Promise<StatusEntry[]>} - Entries touched today
 */
export const filterTouchedToday = async (entries: StatusEntry[], repoPath: string, now: Date, mtimeOf: MtimeReader): Promise<StatusEntry[]> => {
  const today = toLocalDate(now);
  const mtimes = await Promise.all(entries.map((entry) => mtimeOf(join(repoPath, entry.path))));

  return entries.filter((_, index) => {
    const mtime = mtimes[index];

    return mtime !== null && toLocalDate(new Date(mtime)) === today;
  });
};

/**
 * Commits of the configured author since midnight; 0 without a configured email.
 * @param {string} repoPath - Repository folder
 * @param {GitRunner} git - Git runner
 * @returns {Promise<number>} - Commit count
 */
export const countCommitsToday = async (repoPath: string, git: GitRunner): Promise<number> => {
  const email = (await git(repoPath, ["config", "--get", "user.email"]).catch(() => "")).trim();

  if (!email) {
    return 0;
  }

  const log = await git(repoPath, ["log", "--since=midnight", `--author=${email}`, "--format=%H"]);

  return log.split("\n").filter(Boolean).length;
};

/**
 * One `git-snapshot` worklog line for a repository: branch, ticket, changed paths with line counts
 * (staged + unstaged + untracked of today) and today's commits. Only paths and counts are recorded.
 * @param {AutomationRepo} repo - Repository
 * @param {SnapshotContext} context - Ticket regex, time, git runner and optional mtime reader
 * @returns {Promise<GitSnapshotLine>} - Worklog line
 */
export const takeSnapshot = async (repo: AutomationRepo, context: SnapshotContext): Promise<GitSnapshotLine> => {
  const { ticketPattern, now, git, mtimeOf = readMtime } = context;
  const status = parsePorcelainV2(await git(repo.path, ["status", "--porcelain=v2", "--branch", "--untracked-files=all"]));
  const counts = sumLineCounts([parseNumstat(await git(repo.path, ["diff", "--numstat"])), parseNumstat(await git(repo.path, ["diff", "--cached", "--numstat"]))]);
  const untracked = await filterTouchedToday(status.entries.filter((entry) => entry.isUntracked), repo.path, now, mtimeOf);
  const changed: ChangedFile[] = [...status.entries.filter((entry) => !entry.isUntracked), ...untracked].map((entry) => ({
    path: entry.path,
    status: entry.status,
    ...(counts.get(entry.path) ?? { add: 0, del: 0 }),
  }));

  return {
    ts: toLocalTimestamp(now),
    kind: "git-snapshot",
    repo: repo.path,
    label: repo.label.trim() || basename(repo.path),
    branch: status.branch,
    ticket: status.branch ? extractTicket(status.branch, ticketPattern) : null,
    changed,
    commitsToday: await countCommitsToday(repo.path, git),
  };
};
