/** @jest-environment node */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { appendWorklogLine, getCliPaths, parseWorklog, readCliConfig, readWorklog, writeCliConfig } from "./worklog.util";

const LINE = { ts: "2026-11-02T09:00:00+07:00", kind: "vscode-save" as const, repo: "/w/fe", branch: "BIT-1-x", path: "src/a.ts" };

describe("worklog", () => {
  let home: string;

  beforeEach(async () => {
    home = await mkdtemp(join(tmpdir(), "timesheet-worklog-"));
  });

  afterEach(async () => rm(home, { recursive: true, force: true }));

  it("should default to ~/.timesheet and honour TIMESHEET_HOME", () => {
    expect(getCliPaths({}).home).toMatch(/\.timesheet$/);
    expect(getCliPaths({ TIMESHEET_HOME: "/data" })).toEqual({ home: "/data", worklog: "/data/worklog.jsonl", config: "/data/config.json" });
  });

  it("should append lines and skip broken ones when reading", async () => {
    const paths = getCliPaths({ TIMESHEET_HOME: join(home, "nested") });

    expect(await readWorklog(paths)).toEqual({ lines: [], invalidLines: 0 });
    await appendWorklogLine(paths, LINE);
    await writeFile(paths.worklog, `${await readFile(paths.worklog, "utf8")}{"kind":"unknown"}\n{"ts":"2026-11-0`, "utf8");

    expect(await readWorklog(paths)).toEqual({ lines: [LINE], invalidLines: 2 });
    expect(parseWorklog("\n\n")).toEqual({ lines: [], invalidLines: 0 });
  });

  it("should read config defaults and write repositories", async () => {
    const paths = getCliPaths({ TIMESHEET_HOME: home });

    expect(await readCliConfig(paths)).toEqual({ repos: [] });
    await writeFile(paths.config, "{ broken", "utf8");
    expect(await readCliConfig(paths)).toEqual({ repos: [] });
    await writeFile(paths.config, JSON.stringify({ repos: "nope" }), "utf8");
    expect(await readCliConfig(paths)).toEqual({ repos: [] });

    await writeCliConfig(paths, { repos: [{ path: "/w/fe", label: "FE" }], keep: true });
    expect(await readCliConfig(paths)).toEqual({ repos: [{ path: "/w/fe", label: "FE" }], keep: true });
  });
});
