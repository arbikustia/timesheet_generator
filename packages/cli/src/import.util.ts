import { basename } from "node:path";

import { isInPeriod } from "@/libs/utils/date.util";
import { normalizeTicket } from "@/libs/utils/review.util";
import { createId, insertEntrySorted } from "@/libs/utils/timesheet-mutation.util";

import type { AutomationRepo, Entry, EntrySource, TimesheetDoc } from "@/types/timesheet.type";

import { MAX_FILES_PER_ENTRY, SUMMARY_MAX_LENGTH } from "./cli.config";
import type { ActivityCollector, ActivityGroup, ActivitySource, ClaudeCodeLine, GitSnapshotLine, ImportOptions, ImportResult, TaskName, WorklogLine } from "./cli.type";
import { extractTicket, getBranchWords } from "./ticket.util";
import { dateOfTimestamp, timeOfTimestamp } from "./time.util";

/** Source of an entry built from several collectors: git wins, then VS Code, then Claude Code. */
const SOURCE_PRIORITY: ActivitySource[] = ["git", "vscode", "claude-code"];

/**
 * Date a worklog line belongs to.
 * @param {WorklogLine} line - Line
 * @returns {string} - ISO date
 */
export const getLineDate = (line: WorklogLine): string => (line.kind === "evidence" ? line.date : dateOfTimestamp(line.ts));

/**
 * The last snapshot per date × repository (a second snapshot on the same day replaces the first).
 * Backfill lines describe one branch each, so they are kept per date × repository × branch.
 * @param {GitSnapshotLine[]} snapshots - Snapshots in worklog order
 * @returns {GitSnapshotLine[]} - Latest snapshot per date × repository (× branch for backfill)
 */
export const latestSnapshots = (snapshots: GitSnapshotLine[]): GitSnapshotLine[] => {
  const latest = new Map<string, GitSnapshotLine>();

  snapshots.forEach((line) => {
    const branchKey = line.event === "backfill" ? `|${line.branch ?? ""}` : "";

    latest.set(`${dateOfTimestamp(line.ts)}|${line.repo}${branchKey}`, line);
  });

  return [...latest.values()];
};

/**
 * Label of a repository path: from the known repositories, else the folder name.
 * @param {string} path - Repository path
 * @param {AutomationRepo[]} repos - Known repositories
 * @returns {string} - Label
 */
export const labelOfRepo = (path: string, repos: AutomationRepo[]): string => {
  return repos.find((repo) => repo.path === path)?.label.trim() || basename(path);
};

/**
 * Create an activity collector.
 * @returns {ActivityCollector} - Collector
 */
export const createActivityCollector = (): ActivityCollector => {
  const groups = new Map<string, ActivityGroup>();

  /**
   * Group for a date × ticket (or date × repo × branch), created on first use.
   * @param {string} date - ISO date
   * @param {string} label - Repository label
   * @param {string | null} branch - Branch
   * @param {string | null} ticket - Ticket
   * @returns {ActivityGroup} - Group
   */
  const add = (date: string, label: string, branch: string | null, ticket: string | null): ActivityGroup => {
    const key = ticket ? `${date}|${ticket}` : `${date}|${label}|${branch ?? ""}`;
    const group = groups.get(key) ?? { date, label, branch, ticket, sources: new Set(), times: [], files: new Set(), summary: null };

    groups.set(key, group);

    return group;
  };

  /**
   * Every group so far.
   * @returns {ActivityGroup[]} - Groups in creation order
   */
  const list = (): ActivityGroup[] => [...groups.values()];

  return { add, groups: list };
};

/**
 * Attach a Claude Code session to the group of the same date and repository (matched by working folder).
 * @param {ClaudeCodeLine} line - Session line
 * @param {AutomationRepo[]} repos - Known repositories
 * @param {ActivityCollector} collector - Collector
 * @returns {void}
 */
export const addClaudeSession = (line: ClaudeCodeLine, repos: AutomationRepo[], collector: ActivityCollector): void => {
  const date = dateOfTimestamp(line.ts);
  const repo = repos.find((item) => item.path && (line.cwd === item.path || line.cwd.startsWith(`${item.path}/`)));
  const label = repo ? labelOfRepo(repo.path, repos) : basename(line.cwd);
  const group = collector.groups().find((item) => item.date === date && item.label === label) ?? collector.add(date, label, null, null);

  group.sources.add("claude-code");
  group.times.push(timeOfTimestamp(line.ts));
  group.summary = group.summary ?? line.summary?.slice(0, SUMMARY_MAX_LENGTH) ?? null;
};

/**
 * Group the worklog of a month into activities.
 * @param {WorklogLine[]} lines - Worklog lines of the month
 * @param {AutomationRepo[]} repos - Known repositories
 * @param {string} ticketPattern - Ticket regex
 * @returns {ActivityGroup[]} - Activities
 */
export const groupActivities = (lines: WorklogLine[], repos: AutomationRepo[], ticketPattern: string): ActivityGroup[] => {
  const collector = createActivityCollector();
  const snapshots = latestSnapshots(lines.filter((line): line is GitSnapshotLine => line.kind === "git-snapshot"));
  const knownRepos = [...repos, ...snapshots.map((line) => ({ path: line.repo, label: line.label }))];

  snapshots
    .filter((line) => line.changed.length > 0 || line.commitsToday > 0 || line.event === "backfill")
    .forEach((line) => {
      const group = collector.add(dateOfTimestamp(line.ts), line.label, line.branch, line.ticket);

      group.sources.add("git");
      group.times.push(timeOfTimestamp(line.ts));
      line.changed.forEach((file) => group.files.add(file.path));
    });
  lines.forEach((line) => {
    if (line.kind === "vscode-save") {
      const branch = line.branch ?? null;
      const group = collector.add(dateOfTimestamp(line.ts), labelOfRepo(line.repo, knownRepos), branch, branch ? extractTicket(branch, ticketPattern) : null);

      group.sources.add("vscode");
      group.times.push(timeOfTimestamp(line.ts));
      group.files.add(line.path);
    }
  });
  lines.filter((line): line is ClaudeCodeLine => line.kind === "claude-code").forEach((line) => addClaudeSession(line, knownRepos, collector));

  return collector.groups();
};

/**
 * Task text of an activity: the ticket name from `ticketMap`, else a generated `{ticket} – {branch words}`
 * (or `{repo} – {branch words}` without a ticket) that still needs a name.
 * @param {ActivityGroup} group - Activity
 * @param {TimesheetDoc["automation"]["ticketMap"]} ticketMap - Ticket names
 * @returns {TaskName} - Task and whether it was generated
 */
export const buildTaskName = (group: ActivityGroup, ticketMap: TimesheetDoc["automation"]["ticketMap"]): TaskName => {
  const known = group.ticket ? ticketMap[group.ticket]?.trim() : "";

  if (known) {
    return { task: known, needsName: false };
  }

  const words = group.branch ? getBranchWords(group.branch, group.ticket) : "";
  const head = group.ticket ?? group.label;

  return { task: words ? `${head} – ${words}` : head, needsName: true };
};

/**
 * Whether the document already has a row for this activity (manual or imported), so it is not added again.
 * @param {ActivityGroup} group - Activity
 * @param {TimesheetDoc} doc - Document
 * @returns {boolean} - True when a matching row exists
 */
export const isDuplicate = (group: ActivityGroup, doc: TimesheetDoc): boolean => {
  return doc.entries.some((entry) => {
    if (entry.date !== group.date) {
      return false;
    }

    if (!group.ticket) {
      return entry.refs?.repo === group.label && (entry.refs.branch ?? null) === group.branch && !entry.refs.ticket;
    }

    const mapped = doc.automation.ticketMap[group.ticket]?.trim();

    return (
      (entry.refs?.ticket ? normalizeTicket(entry.refs.ticket) === group.ticket : false) ||
      entry.task.toUpperCase().includes(group.ticket) ||
      (Boolean(mapped) && entry.task.trim() === mapped)
    );
  });
};

/**
 * Build a `reviewed: false` entry from an activity. Times are the profile defaults (the format does not
 * need real hours); the first/last activity time is kept as a hint.
 * @param {ActivityGroup} group - Activity
 * @param {TimesheetDoc} doc - Document
 * @returns {Entry} - Entry
 */
export const buildImportedEntry = (group: ActivityGroup, doc: TimesheetDoc): Entry => {
  const { task, needsName } = buildTaskName(group, doc.automation.ticketMap);
  const times = [...group.times].sort((a, b) => a.localeCompare(b));
  const source: EntrySource = SOURCE_PRIORITY.find((item) => group.sources.has(item)) ?? "import";

  return {
    id: createId(),
    date: group.date,
    task,
    start: doc.profile.defaults.start,
    end: doc.profile.defaults.end,
    remarkOverride: null,
    source,
    reviewed: false,
    refs: {
      repo: group.label,
      ...(group.branch ? { branch: group.branch } : {}),
      ...(group.ticket ? { ticket: group.ticket } : {}),
      ...(times.length > 0 ? { hint: { first: times[0], last: times[times.length - 1] } } : {}),
      ...(group.files.size > 0 ? { files: [...group.files].sort((a, b) => a.localeCompare(b)).slice(0, MAX_FILES_PER_ENTRY) } : {}),
      ...(group.summary ? { summary: group.summary } : {}),
      needsName,
    },
  };
};

/**
 * Import worklog activity of a month into a document (PROMPT §12.3): one `reviewed: false` entry per
 * date × ticket, never touching existing rows, skipping duplicates. Evidence lines are only counted.
 * @param {TimesheetDoc} doc - Document
 * @param {WorklogLine[]} lines - Worklog lines
 * @param {ImportOptions} options - Month and known repositories
 * @returns {ImportResult} - Updated document and counts
 */
export const importWorklog = (
  doc: TimesheetDoc,
  lines: WorklogLine[],
  options: ImportOptions,
): ImportResult => {
  const monthLines = lines.filter((line) => isInPeriod(getLineDate(line), options.month));
  const groups = groupActivities(monthLines, [...doc.automation.repos, ...options.repos], doc.automation.ticketPattern);
  const fresh = groups.filter((group) => !isDuplicate(group, doc)).sort((a, b) => a.date.localeCompare(b.date));
  const entries = fresh.reduce((list, group) => insertEntrySorted(list, buildImportedEntry(group, doc)), doc.entries);

  return {
    doc: { ...doc, entries },
    report: {
      added: fresh.length,
      duplicates: groups.length - fresh.length,
      evidenceLines: monthLines.filter((line) => line.kind === "evidence").length,
    },
  };
};
