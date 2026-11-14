/** @jest-environment node */
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CRON_MARKER_END, CRON_MARKER_START } from "./cli.config";
import type { CommandResult, CommandRunner, SchedulerJob } from "./cli.type";
import {
  applyScheduler,
  buildCronBlock,
  buildLaunchdPlist,
  buildSchtasksArgs,
  buildShellCommand,
  describeScheduler,
  getLaunchdPath,
  getSchedulerPlatform,
  isSchedulerInstalled,
  parseClock,
  replaceCronBlock,
  runChecked,
  shellQuote,
} from "./scheduler.util";

const JOB: SchedulerJob = {
  program: ["/usr/bin/node", "/opt/timesheet's/timesheet.mjs", "snapshot"],
  hour: 16,
  minute: 45,
  logPath: "/home/me/.timesheet/scheduler.log",
  env: { TIMESHEET_HOME: "/home/me/.timesheet" },
};

/**
 * Fake runner recording calls; answers by program name.
 * @param {Partial<Record<string, CommandResult>>} answers - Result per program
 * @returns {{ run: CommandRunner; calls: string[][]; inputs: string[] }} - Runner and recorded calls
 */
const fakeRunner = (answers: Partial<Record<string, CommandResult>>): { run: CommandRunner; calls: string[][]; inputs: string[] } => {
  const calls: string[][] = [];
  const inputs: string[] = [];
  const run: CommandRunner = async (command, args, input) => {
    calls.push([command, ...args]);
    inputs.push(input ?? "");

    return answers[`${command} ${args[0]}`] ?? answers[command] ?? { code: 0, stdout: "", stderr: "" };
  };

  return { run, calls, inputs };
};

describe("scheduler builders", () => {
  it("should pick the platform scheduler and parse times", () => {
    expect(getSchedulerPlatform("darwin")).toBe("launchd");
    expect(getSchedulerPlatform("win32")).toBe("schtasks");
    expect(getSchedulerPlatform("linux")).toBe("cron");
    expect(parseClock("16:45")).toEqual({ hour: 16, minute: 45 });
    expect(parseClock("24:00")).toBeNull();
  });

  it("should quote shell commands and build the cron block", () => {
    expect(shellQuote("it's")).toBe("'it'\\''s'");
    expect(buildShellCommand({ ...JOB, env: {} })).toBe("'/usr/bin/node' '/opt/timesheet'\\''s/timesheet.mjs' 'snapshot' >> '/home/me/.timesheet/scheduler.log' 2>&1");

    const block = buildCronBlock(JOB);

    expect(block.split("\n")).toEqual([
      CRON_MARKER_START,
      expect.stringMatching(/^45 16 \* \* 1-5 TIMESHEET_HOME='\/home\/me\/\.timesheet' '\/usr\/bin\/node'/),
      expect.stringMatching(/^@reboot sleep 120 && TIMESHEET_HOME=/),
      CRON_MARKER_END,
    ]);
  });

  it("should replace or remove only its own crontab block", () => {
    const block = buildCronBlock(JOB);
    const other = "0 9 * * * backup\n";

    expect(replaceCronBlock("", block)).toBe(`${block}\n`);
    expect(replaceCronBlock(other, block)).toBe(`0 9 * * * backup\n${block}\n`);
    expect(replaceCronBlock(`0 9 * * * backup\n${CRON_MARKER_START}\nold\n${CRON_MARKER_END}\n# tail\n`, block)).toBe(`0 9 * * * backup\n# tail\n${block}\n`);
    expect(replaceCronBlock(`${block}\n`, null)).toBe("");
    expect(replaceCronBlock(`${other}${block}\n`, null)).toBe(other);
  });

  it("should build the launchd agent and the Task Scheduler tasks", () => {
    const plist = buildLaunchdPlist({ ...JOB, logPath: "/tmp/a&b.log" });

    expect(plist).toContain("<string>/opt/timesheet's/timesheet.mjs</string>");
    expect(plist).toContain("<key>TIMESHEET_HOME</key>");
    expect(plist.match(/<key>Weekday<\/key>/g)).toHaveLength(5);
    expect(plist).toContain("<string>/tmp/a&amp;b.log</string>");
    expect(plist).toContain("<key>RunAtLoad</key>\n  <true/>");

    const [daily, logon] = buildSchtasksArgs({ ...JOB, hour: 8, minute: 5 });

    expect(daily).toEqual(expect.arrayContaining(["/SC", "WEEKLY", "/D", "MON,TUE,WED,THU,FRI", "/ST", "08:05"]));
    expect(logon).toEqual(expect.arrayContaining(["/SC", "ONLOGON"]));
    expect(daily.at(-1)).toBe('cmd /c "set "TIMESHEET_HOME=/home/me/.timesheet" && "/usr/bin/node" "/opt/timesheet\'s/timesheet.mjs" "snapshot" >> "/home/me/.timesheet/scheduler.log" 2>&1"');
  });
});

describe("scheduler install", () => {
  let home: string;

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), "timesheet-sched-"));
  });

  afterEach(async () => rm(home, { recursive: true, force: true }));

  it("should install, detect and remove the cron block (warning about WSL)", async () => {
    const fake = fakeRunner({ "crontab -l": { code: 1, stdout: "", stderr: "no crontab for me" } });
    const host = { platform: "cron" as const, homeDir: home, isWsl: true };

    expect(await applyScheduler(host, JOB, fake.run)).toEqual([expect.stringContaining("Crontab user diperbarui"), expect.stringContaining("WSL")]);
    expect(fake.inputs.at(-1)).toBe(`${buildCronBlock(JOB)}\n`);
    expect(await isSchedulerInstalled(host, fakeRunner({ "crontab -l": { code: 0, stdout: fake.inputs.at(-1) ?? "", stderr: "" } }).run)).toBe(true);
    expect(await applyScheduler({ ...host, isWsl: false }, null, fake.run)).toEqual(["Jadwal dihapus dari crontab user."]);
    await expect(applyScheduler(host, JOB, fakeRunner({ "crontab -": { code: 1, stdout: "", stderr: "denied" } }).run)).rejects.toThrow("crontab - gagal: denied");
  });

  it("should write, load and remove the launchd agent", async () => {
    const fake = fakeRunner({});
    const host = { platform: "launchd" as const, homeDir: home, isWsl: false };

    await applyScheduler(host, JOB, fake.run);
    expect(await readFile(getLaunchdPath(home), "utf8")).toContain("id.timesheet-builder.snapshot");
    expect(fake.calls).toEqual([
      ["launchctl", "unload", getLaunchdPath(home)],
      ["launchctl", "load", "-w", getLaunchdPath(home)],
    ]);
    expect(await isSchedulerInstalled(host, fake.run)).toBe(true);

    await applyScheduler(host, null, fake.run);
    expect(await isSchedulerInstalled(host, fake.run)).toBe(false);
    expect(describeScheduler(host, JOB)).toContain("<plist");
  });

  it("should create and delete the Windows tasks", async () => {
    const fake = fakeRunner({ "schtasks /Query": { code: 1, stdout: "", stderr: "" } });
    const host = { platform: "schtasks" as const, homeDir: home, isWsl: false };

    await applyScheduler(host, JOB, fake.run);
    await applyScheduler(host, null, fake.run);
    expect(fake.calls.map((call) => call.slice(0, 2))).toEqual([
      ["schtasks", "/Create"],
      ["schtasks", "/Create"],
      ["schtasks", "/Delete"],
      ["schtasks", "/Delete"],
    ]);
    expect(await isSchedulerInstalled(host, fake.run)).toBe(false);
    expect(describeScheduler(host, JOB).split("\n")).toHaveLength(2);
    expect(describeScheduler({ ...host, platform: "cron" }, JOB)).toContain(CRON_MARKER_START);
  });

  it("should report a failing command with its exit code", async () => {
    await expect(runChecked(fakeRunner({ x: { code: 3, stdout: "", stderr: " " } }).run, "x", [])).rejects.toThrow("x  gagal: exit 3");
  });
});
