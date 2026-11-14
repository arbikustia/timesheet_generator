import { join } from "node:path";

import { buildBackfillLines } from "./backfill.util";
import { DEFAULT_SNAPSHOT_TIME, DEFAULT_TICKET_PATTERN, SCHEDULER_LOG_FILE } from "./cli.config";
import type { BackfillRange, CliArgs, CliIo, SchedulerJob } from "./cli.type";
import { readDocFile } from "./doc-file.util";
import { labelOfRepo } from "./import.util";
import { resolveRepos } from "./repos.util";
import { applyScheduler, describeScheduler, parseClock } from "./scheduler.util";
import { dateOfTimestamp, toLocalDate } from "./time.util";
import { appendWorklogLine, getCliPaths, readWorklog } from "./worklog.util";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Default backfill range: the 1st of the current month up to yesterday.
 * @param {Date} now - Current time
 * @returns {BackfillRange} - Range
 */
export const getDefaultBackfillRange = (now: Date): BackfillRange => {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

  return { from: toLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toLocalDate(yesterday) };
};

/**
 * `timesheet backfill`: reconstruct missed days from each repository's reflog and local commits.
 * Days that already have a snapshot are left alone, so running it twice adds nothing.
 * @param {CliArgs} args - Arguments
 * @param {CliIo} io - Side effects
 * @returns {Promise<number>} - Exit code
 */
export const runBackfill = async (args: CliArgs, io: CliIo): Promise<number> => {
  const defaults = getDefaultBackfillRange(io.now());
  const range = { from: args.from ?? defaults.from, to: args.to ?? defaults.to };

  if (!DATE_PATTERN.test(range.from) || !DATE_PATTERN.test(range.to) || range.from > range.to) {
    io.err("Pemakaian: timesheet backfill [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--doc <file.json>]\n");

    return 2;
  }

  const paths = getCliPaths(io.env);
  const doc = args.doc ? await readDocFile(args.doc) : null;
  const repos = await resolveRepos(args, doc, paths);
  const { lines } = await readWorklog(paths);
  let total = 0;

  for (const repo of repos) {
    const covered = new Set(lines.filter((line) => line.kind === "git-snapshot" && line.repo === repo.path).map((line) => dateOfTimestamp(line.ts)));
    const label = labelOfRepo(repo.path, repos);
    const added = await buildBackfillLines(repo, range, covered, { git: io.git, ticketPattern: doc?.automation.ticketPattern ?? DEFAULT_TICKET_PATTERN, label });

    for (const line of added) {
      await appendWorklogLine(paths, line);
    }

    total += added.length;
    io.out(`${label}: ${added.length} hari × branch ditambahkan dari reflog (${range.from} – ${range.to}).\n`);
  }

  io.out(total > 0 ? "Lanjutkan dengan `timesheet import --doc <file.json>`.\n" : "");

  return repos.length > 0 ? 0 : 1;
};

/**
 * The scheduled job: `node <cli> snapshot`, output appended to `~/.timesheet/scheduler.log`.
 * @param {CliIo} io - Side effects (paths of Node and the CLI)
 * @param {string} time - `HH:mm`
 * @returns {SchedulerJob | null} - Job, or null for a malformed time
 */
export const buildSnapshotJob = (io: CliIo, time: string): SchedulerJob | null => {
  const clock = parseClock(time);
  const paths = getCliPaths(io.env);

  if (!clock) {
    return null;
  }

  return {
    program: [io.nodePath, io.scriptPath, "snapshot"],
    ...clock,
    logPath: join(paths.home, SCHEDULER_LOG_FILE),
    env: io.env.TIMESHEET_HOME ? { TIMESHEET_HOME: io.env.TIMESHEET_HOME } : {},
  };
};

/**
 * `timesheet install-scheduler`: user-level schedule, never inside a work repository.
 * @param {CliArgs} args - Arguments
 * @param {CliIo} io - Side effects
 * @returns {Promise<number>} - Exit code
 */
export const runInstallScheduler = async (args: CliArgs, io: CliIo): Promise<number> => {
  const job = buildSnapshotJob(io, args.time ?? DEFAULT_SNAPSHOT_TIME);

  if (!job) {
    io.err("Format --time harus HH:mm, mis. 16:45.\n");

    return 2;
  }

  const repos = await resolveRepos(args, args.doc ? await readDocFile(args.doc) : null, getCliPaths(io.env));

  if (repos.length === 0) {
    io.err("Belum ada repo di ~/.timesheet/config.json. Jalankan dengan --doc <file.json> (repo dari tab Review) atau --repo <path>.\n");

    return 1;
  }

  if (args.isDryRun) {
    io.out(`${describeScheduler(io.host, job)}\n`);

    return 0;
  }

  (await applyScheduler(io.host, job, io.run)).forEach((message) => io.out(`${message}\n`));
  io.out(`Snapshot ${repos.length} repo tiap Senin–Jumat ${args.time ?? DEFAULT_SNAPSHOT_TIME} dan saat login. Log: ${job.logPath}\n`);

  return 0;
};

/**
 * `timesheet uninstall-scheduler`.
 * @param {CliIo} io - Side effects
 * @returns {Promise<number>} - Exit code
 */
export const runUninstallScheduler = async (io: CliIo): Promise<number> => {
  (await applyScheduler(io.host, null, io.run)).forEach((message) => io.out(`${message}\n`));

  return 0;
};

/**
 * `timesheet vscode-task`: user-level `tasks.json` snippet that snapshots when a folder opens.
 * Printed only — nothing is written, and never into a repository.
 * @param {CliIo} io - Side effects
 * @returns {number} - Exit code
 */
export const runVscodeTask = (io: CliIo): number => {
  const task = {
    version: "2.0.0",
    tasks: [
      {
        label: "Timesheet: snapshot",
        type: "process",
        command: io.nodePath,
        args: [io.scriptPath, "snapshot", "--event", "open"],
        presentation: { reveal: "silent", panel: "dedicated", close: true },
        runOptions: { runOn: "folderOpen" },
        problemMatcher: [],
      },
    ],
  };

  io.out(`${JSON.stringify(task, null, 2)}\n`);
  io.out("Tempel ke tasks.json level user (Command Palette → \"Tasks: Open User Tasks\"), lalu izinkan \"Allow Automatic Tasks\".\n");

  return 0;
};
