import { resolve } from "node:path";
import { parseArgs } from "node:util";

import type { Period } from "@/types/timesheet.type";

import { runBackfill, runInstallScheduler, runUninstallScheduler, runVscodeTask } from "./automation-commands.util";
import { DEFAULT_TICKET_PATTERN, USAGE } from "./cli.config";
import type { CliArgs, CliIo } from "./cli.type";
import { readDocFile, withDocLock, writeDocFile } from "./doc-file.util";
import { checkDataFolder, checkRepo, checkTicketPattern, formatChecks } from "./doctor.util";
import { importWorklog } from "./import.util";
import { resolveRepos } from "./repos.util";
import { isSchedulerInstalled } from "./scheduler.util";
import { takeSnapshot } from "./snapshot.util";
import { appendWorklogLine, getCliPaths, readCliConfig, readWorklog } from "./worklog.util";

/**
 * Parse command-line arguments.
 * @param {string[]} argv - Arguments after the program name
 * @returns {CliArgs} - Parsed arguments
 */
export const parseCliArgs = (argv: string[]): CliArgs => {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      doc: { type: "string" },
      month: { type: "string" },
      repo: { type: "string", multiple: true },
      event: { type: "string" },
      time: { type: "string" },
      from: { type: "string" },
      to: { type: "string" },
      "dry-run": { type: "boolean" },
    },
  });

  return {
    command: positionals[0] ?? "help",
    doc: values.doc ? resolve(values.doc) : null,
    month: values.month ?? null,
    repos: (values.repo ?? []).map((path) => resolve(path)),
    event: values.event ?? null,
    time: values.time ?? null,
    from: values.from ?? null,
    to: values.to ?? null,
    isDryRun: values["dry-run"] ?? false,
  };
};

/**
 * Parse `YYYY-MM`.
 * @param {string} text - Month text
 * @returns {Period | null} - Period, or null when malformed
 */
export const parseMonth = (text: string): Period | null => {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(text);

  return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
};

/**
 * `YYYY-MM` of a period.
 * @param {Period} period - Period
 * @returns {string} - Month text
 */
export const formatPeriod = (period: Period): string => `${period.year}-${String(period.month).padStart(2, "0")}`;

/**
 * `timesheet snapshot`: one worklog line per repository with changes or commits today.
 * @param {CliArgs} args - Arguments
 * @param {CliIo} io - Side effects
 * @returns {Promise<number>} - Exit code
 */
export const runSnapshot = async (args: CliArgs, io: CliIo): Promise<number> => {
  const paths = getCliPaths(io.env);
  const doc = args.doc ? await readDocFile(args.doc) : null;
  const repos = await resolveRepos(args, doc, paths);

  if (repos.length === 0) {
    io.err("Tidak ada repo. Isi \"Repo yang dipantau\" di tab Review lalu jalankan dengan --doc, atau pakai --repo <path>.\n");

    return 1;
  }

  let failures = 0;

  for (const repo of repos) {
    try {
      const line = await takeSnapshot(repo, { ticketPattern: doc?.automation.ticketPattern ?? DEFAULT_TICKET_PATTERN, now: io.now(), git: io.git });
      const summary = `${line.label}: ${line.ticket ?? line.branch ?? "(tanpa branch)"} · ${line.changed.length} file · ${line.commitsToday} commit`;

      if (line.changed.length === 0 && line.commitsToday === 0) {
        io.out(`${summary} — tidak ada aktivitas, tidak dicatat.\n`);
        continue;
      }

      await appendWorklogLine(paths, args.event ? { ...line, event: args.event } : line);
      io.out(`${summary} — dicatat.\n`);
    } catch (error) {
      failures += 1;
      io.err(`${repo.label || repo.path}: gagal (${error instanceof Error ? error.message : String(error)})\n`);
    }
  }

  return failures > 0 ? 1 : 0;
};

/**
 * `timesheet import`: add `reviewed: false` entries from the worklog to the document, atomically and under lock.
 * @param {CliArgs} args - Arguments
 * @param {CliIo} io - Side effects
 * @returns {Promise<number>} - Exit code
 */
export const runImport = async (args: CliArgs, io: CliIo): Promise<number> => {
  const docPath = args.doc;
  const month = args.month ? parseMonth(args.month) : null;

  if (!docPath || (args.month && !month)) {
    io.err("Pemakaian: timesheet import --doc <file.json> [--month YYYY-MM]\n");

    return 2;
  }

  const paths = getCliPaths(io.env);
  const worklog = await readWorklog(paths);
  const config = await readCliConfig(paths);
  const report = await withDocLock(docPath, async () => {
    const doc = await readDocFile(docPath);

    if (month && (month.year !== doc.period.year || month.month !== doc.period.month)) {
      throw new Error(`--month ${args.month} berbeda dengan periode dokumen (${formatPeriod(doc.period)}); entri di luar periode tidak dicetak.`);
    }

    const result = importWorklog(doc, worklog.lines, { month: doc.period, repos: config.repos });

    if (result.report.added > 0) {
      await writeDocFile(docPath, result.doc);
    }

    return result.report;
  });

  io.out(`${report.added} entri usulan ditambahkan (reviewed: false), ${report.duplicates} sudah ada dan dilewati.\n`);

  if (report.evidenceLines > 0) {
    io.out(`${report.evidenceLines} baris evidence di worklog belum diimpor (auto-evidence menyusul di Fase 8).\n`);
  }

  if (worklog.invalidLines > 0) {
    io.out(`${worklog.invalidLines} baris worklog rusak dilewati.\n`);
  }

  io.out(report.added > 0 ? "Klik \"Muat ulang\" di aplikasi, lalu review di tab Review.\n" : "");

  return 0;
};

/**
 * `timesheet doctor`: repositories, git email, data folder and ticket pattern.
 * @param {CliArgs} args - Arguments
 * @param {CliIo} io - Side effects
 * @returns {Promise<number>} - Exit code (1 when a check fails)
 */
export const runDoctor = async (args: CliArgs, io: CliIo): Promise<number> => {
  const paths = getCliPaths(io.env);
  const doc = args.doc ? await readDocFile(args.doc) : null;
  const repos = await resolveRepos(args, doc, paths);
  const repoChecks = (await Promise.all(repos.map((repo) => checkRepo(repo, io.git)))).flat();
  const checks = [
    await checkDataFolder(paths),
    checkTicketPattern(doc?.automation.ticketPattern ?? DEFAULT_TICKET_PATTERN),
    ...(repos.length > 0 ? repoChecks : [{ ok: false, label: "Repo", detail: "Belum ada repo yang dipantau." }]),
    (await isSchedulerInstalled(io.host, io.run))
      ? { ok: true, label: "Scheduler", detail: `terpasang (${io.host.platform})` }
      : { ok: false, label: "Scheduler", detail: "belum dipasang — jalankan `timesheet install-scheduler`." },
  ];

  io.out(`${formatChecks(checks)}\n`);

  return checks.every((check) => check.ok) ? 0 : 1;
};

/**
 * Entry point of the `timesheet` CLI.
 * @param {string[]} argv - Arguments after the program name
 * @param {CliIo} io - Side effects
 * @returns {Promise<number>} - Exit code
 */
export const runCli = async (argv: string[], io: CliIo): Promise<number> => {
  try {
    const args = parseCliArgs(argv);

    switch (args.command) {
      case "snapshot":
        return await runSnapshot(args, io);
      case "import":
        return await runImport(args, io);
      case "doctor":
        return await runDoctor(args, io);
      case "backfill":
        return await runBackfill(args, io);
      case "install-scheduler":
        return await runInstallScheduler(args, io);
      case "uninstall-scheduler":
        return await runUninstallScheduler(io);
      case "vscode-task":
        return runVscodeTask(io);
      case "help":
        io.out(USAGE);

        return 0;
      default:
        io.err(`Perintah tidak dikenal: ${args.command}\n\n${USAGE}`);

        return 2;
    }
  } catch (error) {
    io.err(`${error instanceof Error ? error.message : String(error)}\n`);

    return 1;
  }
};
