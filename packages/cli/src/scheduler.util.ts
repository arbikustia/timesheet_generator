import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  CRON_MARKER_END,
  CRON_MARKER_START,
  LAUNCHD_LABEL,
  LOGIN_DELAY_SECONDS,
  SCHTASKS_DAILY,
  SCHTASKS_LOGON,
} from "./cli.config";
import type { CommandRunner, PlistParts, SchedulerHost, SchedulerJob, SchedulerPlatform } from "./cli.type";

/**
 * Scheduler of the current OS.
 * @param {NodeJS.Platform} platform - `process.platform`
 * @returns {SchedulerPlatform} - launchd on macOS, Task Scheduler on Windows, cron elsewhere
 */
export const getSchedulerPlatform = (platform: NodeJS.Platform): SchedulerPlatform => {
  if (platform === "darwin") {
    return "launchd";
  }

  return platform === "win32" ? "schtasks" : "cron";
};

/**
 * Parse `HH:mm`.
 * @param {string} text - Time
 * @returns {{ hour: number; minute: number } | null} - Time, or null when malformed
 */
export const parseClock = (text: string): Pick<SchedulerJob, "hour" | "minute"> | null => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text);

  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
};

/**
 * Single-quote a value for a POSIX shell.
 * @param {string} value - Raw value
 * @returns {string} - Quoted value
 */
export const shellQuote = (value: string): string => `'${value.replace(/'/g, "'\\''")}'`;

/**
 * Shell command line of the job: environment, program, output appended to the log.
 * @param {SchedulerJob} job - Job
 * @returns {string} - Command line
 */
export const buildShellCommand = (job: SchedulerJob): string => {
  const env = Object.entries(job.env).map(([key, value]) => `${key}=${shellQuote(value ?? "")}`);

  return [...env, ...job.program.map(shellQuote), ">>", shellQuote(job.logPath), "2>&1"].join(" ");
};

/**
 * Crontab lines (between markers): weekdays at the snapshot time, and after boot/login.
 * @param {SchedulerJob} job - Job
 * @returns {string} - Block without trailing newline
 */
export const buildCronBlock = (job: SchedulerJob): string => {
  const command = buildShellCommand(job);

  return [CRON_MARKER_START, `${job.minute} ${job.hour} * * 1-5 ${command}`, `@reboot sleep ${LOGIN_DELAY_SECONDS} && ${command}`, CRON_MARKER_END].join("\n");
};

/**
 * Replace (or remove, with `null`) the timesheet block in a crontab, keeping every other line.
 * @param {string} crontab - Current crontab
 * @param {string | null} block - New block, or null to remove
 * @returns {string} - New crontab (newline-terminated, or empty)
 */
export const replaceCronBlock = (crontab: string, block: string | null): string => {
  const lines = crontab.split("\n");
  const start = lines.indexOf(CRON_MARKER_START);
  const end = lines.indexOf(CRON_MARKER_END, start);
  const kept = start >= 0 && end > start ? [...lines.slice(0, start), ...lines.slice(end + 1)] : lines;
  const text = [...kept.filter((line, index) => line.trim() || index < kept.length - 1), ...(block ? [block] : [])].join("\n").trim();

  return text ? `${text}\n` : "";
};

/**
 * Escape text for XML.
 * @param {string} value - Raw text
 * @returns {string} - Escaped text
 */
const _xml = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * XML fragments of the launchd agent: program arguments, environment and Mon–Fri calendar entries.
 * @param {SchedulerJob} job - Job
 * @returns {PlistParts} - Fragments
 */
const _plistParts = (job: SchedulerJob): PlistParts => ({
  args: job.program.map((arg) => `    <string>${_xml(arg)}</string>`).join("\n"),
  env: Object.entries(job.env)
    .map(([key, value]) => `    <key>${_xml(key)}</key>\n    <string>${_xml(value ?? "")}</string>`)
    .join("\n"),
  days: [1, 2, 3, 4, 5]
    .map((day) => `    <dict><key>Weekday</key><integer>${day}</integer><key>Hour</key><integer>${job.hour}</integer><key>Minute</key><integer>${job.minute}</integer></dict>`)
    .join("\n"),
});

/**
 * launchd agent: weekdays at the snapshot time and at login (`RunAtLoad`).
 * @param {SchedulerJob} job - Job
 * @returns {string} - Property list XML
 */
export const buildLaunchdPlist = (job: SchedulerJob): string => {
  const { args, env, days } = _plistParts(job);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCHD_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
${args}
  </array>
  <key>EnvironmentVariables</key>
  <dict>
${env}
  </dict>
  <key>StartCalendarInterval</key>
  <array>
${days}
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${_xml(job.logPath)}</string>
  <key>StandardErrorPath</key>
  <string>${_xml(job.logPath)}</string>
</dict>
</plist>
`;
};

/**
 * Double-quote a Windows command argument.
 * @param {string} value - Raw value
 * @returns {string} - Quoted value
 */
const _dquote = (value: string): string => `"${value}"`;

/**
 * `schtasks` arguments: one weekly task (Mon–Fri) and one at logon, both running through `cmd /c`
 * so output is appended to the log.
 * @param {SchedulerJob} job - Job
 * @returns {string[][]} - Argument lists for `schtasks`
 */
export const buildSchtasksArgs = (job: SchedulerJob): string[][] => {
  const env = Object.entries(job.env)
    .map(([key, value]) => `set "${key}=${value ?? ""}" && `)
    .join("");
  const program = job.program.map(_dquote).join(" ");
  const command = `cmd /c "${env}${program} >> ${_dquote(job.logPath)} 2>&1"`;
  const time = `${String(job.hour).padStart(2, "0")}:${String(job.minute).padStart(2, "0")}`;

  return [
    ["/Create", "/F", "/TN", SCHTASKS_DAILY, "/SC", "WEEKLY", "/D", "MON,TUE,WED,THU,FRI", "/ST", time, "/TR", command],
    ["/Create", "/F", "/TN", SCHTASKS_LOGON, "/SC", "ONLOGON", "/TR", command],
  ];
};

/**
 * Path of the launchd agent file.
 * @param {string} homeDir - User home
 * @returns {string} - Plist path
 */
export const getLaunchdPath = (homeDir: string): string => join(homeDir, "Library", "LaunchAgents", `${LAUNCHD_LABEL}.plist`);

/**
 * Run a command and fail with its stderr when it exits non-zero.
 * @param {CommandRunner} run - Runner
 * @param {string} command - Program
 * @param {string[]} args - Arguments
 * @param {string} [input] - Stdin
 * @returns {Promise<string>} - Stdout
 */
export const runChecked = async (run: CommandRunner, command: string, args: string[], input?: string): Promise<string> => {
  const result = await run(command, args, input);

  if (result.code !== 0) {
    const reason = result.stderr.trim() || `exit ${result.code}`;

    throw new Error(`${command} ${args[0] ?? ""} gagal: ${reason}`);
  }

  return result.stdout;
};

/**
 * Current user crontab (empty when the user has none).
 * @param {CommandRunner} run - Runner
 * @returns {Promise<string>} - Crontab text
 */
export const readCrontab = async (run: CommandRunner): Promise<string> => {
  const result = await run("crontab", ["-l"]);

  return result.code === 0 ? result.stdout : "";
};

/**
 * Install or remove the crontab block of the current user.
 * @param {SchedulerHost} host - Host (WSL needs the cron service running)
 * @param {SchedulerJob | null} job - Job, or null to remove
 * @param {CommandRunner} run - Runner
 * @returns {Promise<string[]>} - Messages
 */
export const applyCron = async (host: SchedulerHost, job: SchedulerJob | null, run: CommandRunner): Promise<string[]> => {
  await runChecked(run, "crontab", ["-"], replaceCronBlock(await readCrontab(run), job ? buildCronBlock(job) : null));
  const wsl = host.isWsl && job ? ["WSL: cron hanya jalan bila layanannya aktif (`sudo service cron start`, atau aktifkan systemd di /etc/wsl.conf)."] : [];

  return [job ? "Crontab user diperbarui (hari kerja + setelah login/boot)." : "Jadwal dihapus dari crontab user.", ...wsl];
};

/**
 * Install or remove the launchd agent in `~/Library/LaunchAgents`.
 * @param {SchedulerHost} host - Host (home folder)
 * @param {SchedulerJob | null} job - Job, or null to remove
 * @param {CommandRunner} run - Runner
 * @returns {Promise<string[]>} - Messages
 */
export const applyLaunchd = async (host: SchedulerHost, job: SchedulerJob | null, run: CommandRunner): Promise<string[]> => {
  const path = getLaunchdPath(host.homeDir);

  await run("launchctl", ["unload", path]);

  if (!job) {
    await unlink(path).catch(() => undefined);

    return [`LaunchAgent dihapus: ${path}`];
  }

  await mkdir(join(host.homeDir, "Library", "LaunchAgents"), { recursive: true });
  await writeFile(path, buildLaunchdPlist(job), "utf8");
  await runChecked(run, "launchctl", ["load", "-w", path]);

  return [`LaunchAgent dipasang: ${path}`];
};

/**
 * Install or remove the two Task Scheduler tasks.
 * @param {SchedulerJob | null} job - Job, or null to remove
 * @param {CommandRunner} run - Runner
 * @returns {Promise<string[]>} - Messages
 */
export const applySchtasks = async (job: SchedulerJob | null, run: CommandRunner): Promise<string[]> => {
  if (!job) {
    await run("schtasks", ["/Delete", "/F", "/TN", SCHTASKS_DAILY]);
    await run("schtasks", ["/Delete", "/F", "/TN", SCHTASKS_LOGON]);

    return ["Task Scheduler: tugas timesheet dihapus."];
  }

  for (const args of buildSchtasksArgs(job)) {
    await runChecked(run, "schtasks", args);
  }

  return [`Task Scheduler: "${SCHTASKS_DAILY}" dan "${SCHTASKS_LOGON}" dipasang.`];
};

/**
 * Install (or with `job = null` remove) the user-level scheduled snapshot. Nothing is written in work repos.
 * @param {SchedulerHost} host - Platform and home folder
 * @param {SchedulerJob | null} job - Job, or null to uninstall
 * @param {CommandRunner} run - Runner
 * @returns {Promise<string[]>} - Messages for the user
 */
export const applyScheduler = (host: SchedulerHost, job: SchedulerJob | null, run: CommandRunner): Promise<string[]> => {
  switch (host.platform) {
    case "cron":
      return applyCron(host, job, run);
    case "launchd":
      return applyLaunchd(host, job, run);
    case "schtasks":
      return applySchtasks(job, run);
    default: {
      const exhaustive: never = host.platform;

      return exhaustive;
    }
  }
};

/**
 * Whether the scheduled snapshot is installed.
 * @param {SchedulerHost} host - Platform and home folder
 * @param {CommandRunner} run - Runner
 * @returns {Promise<boolean>} - True when installed
 */
export const isSchedulerInstalled = async (host: SchedulerHost, run: CommandRunner): Promise<boolean> => {
  switch (host.platform) {
    case "cron":
      return (await readCrontab(run)).includes(CRON_MARKER_START);
    case "launchd":
      return access(getLaunchdPath(host.homeDir)).then(
        () => true,
        () => false,
      );
    case "schtasks":
      return (await run("schtasks", ["/Query", "/TN", SCHTASKS_DAILY])).code === 0;
    default: {
      const exhaustive: never = host.platform;

      return exhaustive;
    }
  }
};

/**
 * What `install-scheduler --dry-run` shows for the platform.
 * @param {SchedulerHost} host - Platform
 * @param {SchedulerJob} job - Job
 * @returns {string} - Artifact text
 */
export const describeScheduler = (host: SchedulerHost, job: SchedulerJob): string => {
  switch (host.platform) {
    case "cron":
      return buildCronBlock(job);
    case "launchd":
      return `${getLaunchdPath(host.homeDir)}\n${buildLaunchdPlist(job)}`;
    case "schtasks":
      return buildSchtasksArgs(job)
        .map((args) => `schtasks ${args.join(" ")}`)
        .join("\n");
    default: {
      const exhaustive: never = host.platform;

      return exhaustive;
    }
  }
};
