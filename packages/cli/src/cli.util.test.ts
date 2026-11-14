/** @jest-environment node */
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getCurrentPeriod } from "@/libs/utils/date.util";
import { createEmptyDoc, parseTimesheetDoc, serializeTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import { getDefaultBackfillRange } from "./automation-commands.util";
import type { CliIo, CommandResult, CommandRunner } from "./cli.type";
import { parseCliArgs, parseMonth, runCli } from "./cli.util";
import { runGit } from "./git.util";
import { toLocalDate } from "./time.util";

const SECRET = "SECRET_CONTENT_123";

/**
 * Run a git command while preparing the fixture repository (test setup only).
 * @param {string} cwd - Repository
 * @param {string[]} args - Arguments
 * @returns {void}
 */
const gitSetup = (cwd: string, args: string[]): void => {
  execFileSync("git", args, { cwd, stdio: "ignore" });
};

/**
 * Captured CLI output.
 */
type Captured = { io: CliIo; out: string[]; err: string[] };

/** Fake crontab: `crontab -l` / `crontab -` backed by a variable. */
let crontab = "";

const fakeRun: CommandRunner = async (command, args, input): Promise<CommandResult> => {
  if (command === "crontab" && args[0] === "-") {
    crontab = input ?? "";
  }

  return { code: command === "crontab" && args[0] === "-l" && !crontab ? 1 : 0, stdout: crontab, stderr: "" };
};

/**
 * CLI side effects writing into arrays.
 * @param {string} home - TIMESHEET_HOME
 * @returns {Captured} - IO and captured text
 */
const captureIo = (home: string): Captured => {
  const out: string[] = [];
  const err: string[] = [];

  return {
    out,
    err,
    io: {
      out: (text: string): number => out.push(text),
      err: (text: string): number => err.push(text),
      env: { TIMESHEET_HOME: home },
      now: (): Date => new Date(),
      git: runGit,
      run: fakeRun,
      host: { platform: "cron", homeDir: home, isWsl: false },
      nodePath: "/usr/bin/node",
      scriptPath: "/opt/timesheet/timesheet.mjs",
    },
  };
};

describe("timesheet CLI", () => {
  let root: string;
  let repo: string;
  let docPath: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "timesheet-cli-"));
    repo = join(root, "bantuit-fe");
    docPath = join(root, "Timesheet.json");
    execFileSync("mkdir", ["-p", repo]);
    gitSetup(repo, ["init", "-q", "-b", "feature/BIT-231-case-transfer"]);
    gitSetup(repo, ["config", "user.email", "me@example.com"]);
    gitSetup(repo, ["config", "user.name", "Me"]);
    await writeFile(join(repo, "a.ts"), `export const value = "${SECRET}";\n`, "utf8");
    gitSetup(repo, ["add", "a.ts"]);
    gitSetup(repo, ["commit", "-q", "-m", "init"]);
    await writeFile(join(repo, "a.ts"), `export const value = "${SECRET}-changed";\n`, "utf8");
    await writeFile(join(repo, "staged.ts"), `${SECRET}\n`, "utf8");
    gitSetup(repo, ["add", "staged.ts"]);
    await writeFile(join(repo, "untracked.ts"), `${SECRET}\n`, "utf8");

    const doc = createEmptyDoc(getCurrentPeriod());

    doc.automation.repos = [{ path: repo, label: "BANTUIT FE" }];
    await writeFile(docPath, serializeTimesheetDoc(doc), "utf8");
  });

  afterEach(async () => rm(root, { recursive: true, force: true }));

  it("should snapshot an uncommitted working tree and import it as an unreviewed entry, without any file contents", async () => {
    const home = join(root, "home");
    const snap = captureIo(home);

    expect(await runCli(["snapshot", "--doc", docPath], snap.io)).toBe(0);
    expect(snap.out.join("")).toContain("BANTUIT FE: BIT-231 · 3 file · 1 commit — dicatat.");
    expect(JSON.parse(await readFile(join(home, "config.json"), "utf8"))).toEqual({ repos: [{ path: repo, label: "BANTUIT FE" }] });

    const imported = captureIo(home);

    expect(await runCli(["import", "--doc", docPath], imported.io)).toBe(0);
    expect(imported.out.join("")).toContain("1 entri usulan ditambahkan (reviewed: false)");

    const docText = await readFile(docPath, "utf8");
    const worklogText = await readFile(join(home, "worklog.jsonl"), "utf8");
    const result = parseTimesheetDoc(docText);

    expect(result.isOk && result.doc.entries).toEqual([
      expect.objectContaining({
        date: toLocalDate(new Date()),
        task: "BIT-231 – case transfer",
        source: "git",
        reviewed: false,
        refs: expect.objectContaining({ ticket: "BIT-231", files: ["a.ts", "staged.ts", "untracked.ts"], needsName: true }),
      }),
    ]);
    expect(worklogText).not.toContain(SECRET);
    expect(docText).not.toContain(SECRET);

    const again = captureIo(home);

    expect(await runCli(["import", "--doc", docPath], again.io)).toBe(0);
    expect(again.out.join("")).toContain("0 entri usulan ditambahkan (reviewed: false), 1 sudah ada");
  });

  it("should never write to the repository's .git folder", async () => {
    const before = execFileSync("git", ["status", "--porcelain=v2"], { cwd: repo, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } }).toString();
    const indexBefore = await readFile(join(repo, ".git", "index"));

    await runCli(["snapshot", "--repo", repo], captureIo(join(root, "home")).io);

    expect(await readFile(join(repo, ".git", "index"))).toEqual(indexBefore);
    expect(execFileSync("git", ["status", "--porcelain=v2"], { cwd: repo, env: { ...process.env, GIT_OPTIONAL_LOCKS: "0" } }).toString()).toBe(before);
  });

  it("should validate arguments and report problems", async () => {
    const io = captureIo(join(root, "home"));

    expect(await runCli([], io.io)).toBe(0);
    expect(io.out.join("")).toContain("Pemakaian: timesheet");
    expect(await runCli(["nope"], io.io)).toBe(2);
    expect(await runCli(["import"], io.io)).toBe(2);
    expect(await runCli(["import", "--doc", docPath, "--month", "2026-13"], io.io)).toBe(2);
    expect(await runCli(["import", "--doc", docPath, "--month", "1999-01"], io.io)).toBe(1);
    expect(io.err.join("")).toContain("berbeda dengan periode dokumen");
    expect(await runCli(["snapshot"], io.io)).toBe(1);
    expect(io.err.join("")).toContain("Tidak ada repo");
    expect(await runCli(["snapshot", "--repo", join(root, "missing")], io.io)).toBe(1);
    expect(await runCli(["import", "--bogus"], io.io)).toBe(1);
  });

  it("should skip a clean repository and run doctor", async () => {
    const home = join(root, "home");
    const clean = join(root, "clean");

    execFileSync("mkdir", ["-p", clean]);
    gitSetup(clean, ["init", "-q", "-b", "main"]);

    const io = captureIo(home);

    expect(await runCli(["snapshot", "--repo", clean], io.io)).toBe(0);
    expect(io.out.join("")).toContain("tidak ada aktivitas, tidak dicatat");

    const doctor = captureIo(home);

    expect(await runCli(["doctor", "--doc", docPath], doctor.io)).toBe(1);
    expect(doctor.out.join("")).toContain("✓ Email git BANTUIT FE: me@example.com");
    expect(doctor.out.join("")).toContain("✗ Scheduler: belum dipasang");

    crontab = "";
    expect(await runCli(["install-scheduler", "--doc", docPath], captureIo(home).io)).toBe(0);
    expect(crontab).toContain("45 16 * * 1-5 TIMESHEET_HOME=");

    const installed = captureIo(home);

    expect(await runCli(["doctor"], installed.io)).toBe(0);
    expect(installed.out.join("")).toContain("✓ Scheduler: terpasang (cron)");
    expect(await runCli(["uninstall-scheduler"], captureIo(home).io)).toBe(0);
    expect(crontab).toBe("");
    expect(await runCli(["doctor"], captureIo(join(root, "empty-home")).io)).toBe(1);
  });

  it("should parse arguments and months", () => {
    expect(parseCliArgs(["snapshot", "--repo", "/a", "--repo", "/b", "--event", "open", "--dry-run"])).toEqual({ command: "snapshot", doc: null, month: null, repos: ["/a", "/b"], event: "open", time: null, from: null, to: null, isDryRun: true });
    expect(parseMonth("2026-11")).toEqual({ year: 2026, month: 11 });
    expect(parseMonth("2026-1")).toBeNull();
  });

  it("should backfill a missed day from the reflog and import it", async () => {
    const home = join(root, "backfill-home");
    const today = toLocalDate(new Date());

    gitSetup(repo, ["checkout", "-q", "-b", "feature/BIT-77-report"]);
    gitSetup(repo, ["commit", "-q", "-m", "work"]);

    const first = captureIo(home);

    expect(await runCli(["backfill", "--doc", docPath, "--from", today, "--to", today], first.io)).toBe(0);
    expect(first.out.join("")).toMatch(/BANTUIT FE: [12] hari × branch ditambahkan/);

    const again = captureIo(home);

    expect(await runCli(["backfill", "--doc", docPath, "--from", today, "--to", today], again.io)).toBe(0);
    expect(again.out.join("")).toContain("BANTUIT FE: 0 hari × branch ditambahkan");
    expect(await runCli(["import", "--doc", docPath], captureIo(home).io)).toBe(0);

    const result = parseTimesheetDoc(await readFile(docPath, "utf8"));
    const tickets = result.isOk ? result.doc.entries.map((entry) => entry.refs?.ticket) : [];

    expect(tickets).toContain("BIT-77");
    expect(await readFile(join(home, "worklog.jsonl"), "utf8")).not.toContain(SECRET);
  });

  it("should validate scheduler and backfill arguments and print the VS Code task", async () => {
    const home = join(root, "args-home");
    const io = captureIo(home);

    expect(await runCli(["install-scheduler", "--time", "25:00"], io.io)).toBe(2);
    expect(await runCli(["install-scheduler"], io.io)).toBe(1);
    expect(await runCli(["backfill", "--from", "2026-11-05", "--to", "2026-11-01"], io.io)).toBe(2);
    expect(await runCli(["backfill"], io.io)).toBe(1);

    const dry = captureIo(home);

    expect(await runCli(["install-scheduler", "--repo", repo, "--time", "17:30", "--dry-run"], dry.io)).toBe(0);
    expect(dry.out.join("")).toContain("30 17 * * 1-5");

    const task = captureIo(home);

    expect(await runCli(["vscode-task"], task.io)).toBe(0);
    expect(task.out.join("")).toContain('"runOn": "folderOpen"');
    expect(getDefaultBackfillRange(new Date(2026, 10, 1))).toEqual({ from: "2026-11-01", to: "2026-10-31" });
  });
});
