import type { AutomationRepo } from "@/types/timesheet.type";

import type { BackfillContext, BackfillRange, BranchDay, ChangedFile, GitRunner, GitSnapshotLine, ReflogEntry } from "./cli.type";
import { parseNumstat } from "./git-status.util";
import { extractTicket } from "./ticket.util";
import { dateOfTimestamp } from "./time.util";

const CHECKOUT_PATTERN = /^checkout: moving from (\S+) to (\S+)$/;

/** Reflog subjects that mean the user made a commit locally. */
const COMMIT_PREFIXES = ["commit", "cherry-pick", "revert"];

/**
 * Parse `git log -g HEAD --date=iso-strict --format=%H%x09%gd%x09%gs`, oldest first.
 * @param {string} text - Command output (newest first)
 * @returns {ReflogEntry[]} - Entries in chronological order
 */
export const parseReflog = (text: string): ReflogEntry[] => {
  return text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [sha, selector = "", ...subject] = line.split("\t");
      const ts = selector.slice(selector.indexOf("{") + 1, selector.lastIndexOf("}"));

      return { sha, ts, subject: subject.join("\t") };
    })
    .filter((entry) => /^\d{4}-\d{2}-\d{2}T/.test(entry.ts))
    .reverse();
};

/**
 * Whether a reflog subject is a local commit.
 * @param {string} subject - Reflog subject
 * @returns {boolean} - True for commit / cherry-pick / revert
 */
export const isCommitSubject = (subject: string): boolean => COMMIT_PREFIXES.some((prefix) => subject.startsWith(prefix));

/**
 * Walk the reflog and collect, per day and branch, the last activity time and the commits made.
 * Checkouts count as activity on the branch moved to; pulls, merges and resets do not.
 * @param {ReflogEntry[]} entries - Reflog, oldest first
 * @param {string | null} currentBranch - Branch checked out now (fallback before the first checkout)
 * @returns {BranchDay[]} - Activity per day × branch
 */
export const collectBranchDays = (entries: ReflogEntry[], currentBranch: string | null): BranchDay[] => {
  const firstCheckout = entries.map((entry) => CHECKOUT_PATTERN.exec(entry.subject)).find(Boolean);
  let branch = firstCheckout ? firstCheckout[1] : currentBranch;
  const days = new Map<string, BranchDay>();

  entries.forEach((entry) => {
    const checkout = CHECKOUT_PATTERN.exec(entry.subject);
    const isCommit = isCommitSubject(entry.subject);

    branch = checkout ? checkout[2] : branch;

    if (!branch || (!checkout && !isCommit)) {
      return;
    }

    const key = `${dateOfTimestamp(entry.ts)}|${branch}`;
    const day = days.get(key) ?? { date: dateOfTimestamp(entry.ts), branch, lastTs: entry.ts, commits: [] };

    day.lastTs = entry.ts;

    if (isCommit) {
      day.commits.push(entry.sha);
    }

    days.set(key, day);
  });

  return [...days.values()];
};

/**
 * Paths and line counts of the commits of a day (`git log -1 --numstat` per commit; never contents).
 * @param {string} repoPath - Repository
 * @param {string[]} shas - Commits
 * @param {GitRunner} git - Git runner
 * @returns {Promise<ChangedFile[]>} - Changed files, status `C` (committed)
 */
export const readCommitFiles = async (repoPath: string, shas: string[], git: GitRunner): Promise<ChangedFile[]> => {
  const files = new Map<string, ChangedFile>();

  for (const sha of shas) {
    parseNumstat(await git(repoPath, ["log", "-1", "--numstat", "--format=", sha])).forEach((counts, path) => {
      const current = files.get(path);

      files.set(path, { path, status: "C", add: (current?.add ?? 0) + counts.add, del: (current?.del ?? 0) + counts.del });
    });
  }

  return [...files.values()];
};

/**
 * Backfill lines for a repository: one `git-snapshot` (event `backfill`) per day × branch in the range,
 * for days that have no snapshot yet. Branches without a ticket count only when commits were made.
 * @param {AutomationRepo} repo - Repository
 * @param {BackfillRange} range - Inclusive date range
 * @param {Set<string>} coveredDates - Dates that already have a snapshot of this repository
 * @param {BackfillContext} context - Git runner, ticket regex and repository label
 * @returns {Promise<GitSnapshotLine[]>} - Lines to append
 */
export const buildBackfillLines = async (
  repo: AutomationRepo,
  range: BackfillRange,
  coveredDates: Set<string>,
  context: BackfillContext,
): Promise<GitSnapshotLine[]> => {
  const reflog = parseReflog(await context.git(repo.path, ["log", "-g", "HEAD", "--date=iso-strict", "--format=%H%x09%gd%x09%gs"]).catch(() => ""));
  const current = (await context.git(repo.path, ["branch", "--show-current"]).catch(() => "")).trim() || null;
  const days = collectBranchDays(reflog, current).filter(
    (day) => day.date >= range.from && day.date <= range.to && !coveredDates.has(day.date),
  );
  const lines: GitSnapshotLine[] = [];

  for (const day of days) {
    const ticket = extractTicket(day.branch, context.ticketPattern);

    if (ticket || day.commits.length > 0) {
      lines.push({
        ts: day.lastTs,
        kind: "git-snapshot",
        repo: repo.path,
        label: context.label,
        branch: day.branch,
        ticket,
        changed: await readCommitFiles(repo.path, day.commits, context.git),
        commitsToday: day.commits.length,
        event: "backfill",
      });
    }
  }

  return lines;
};
