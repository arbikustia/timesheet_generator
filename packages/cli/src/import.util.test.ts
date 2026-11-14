/** @jest-environment node */
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import type { Entry, TimesheetDoc } from "@/types/timesheet.type";

import type { WorklogLine } from "./cli.type";
import { buildTaskName, getLineDate, groupActivities, importWorklog, isDuplicate, labelOfRepo, latestSnapshots } from "./import.util";

const REPO = "/work/bantuit-fe";
const NOVEMBER = { year: 2026, month: 11 };

/**
 * A git snapshot line.
 * @param {string} ts - Timestamp
 * @param {Partial<Extract<WorklogLine, { kind: "git-snapshot" }>>} [overrides] - Field overrides
 * @returns {WorklogLine} - Line
 */
const snapshot = (ts: string, overrides?: Partial<Extract<WorklogLine, { kind: "git-snapshot" }>>): WorklogLine => ({
  ts,
  kind: "git-snapshot",
  repo: REPO,
  label: "BANTUIT FE",
  branch: "feature/BIT-231-case-transfer",
  ticket: "BIT-231",
  changed: [{ path: "src/pages/CaseTransfer.tsx", status: "M", add: 42, del: 7 }],
  commitsToday: 0,
  ...overrides,
});

const LINES: WorklogLine[] = [
  snapshot("2026-11-02T12:00:00+07:00", { changed: [{ path: "src/early.ts", status: "M", add: 1, del: 0 }] }),
  snapshot("2026-11-02T16:45:00+07:00"),
  { ts: "2026-11-02T09:15:02+07:00", kind: "vscode-save", repo: REPO, branch: "feature/BIT-231-case-transfer", path: "src/pages/CaseTransfer.tsx" },
  { ts: "2026-11-02T10:03:11+07:00", kind: "claude-code", event: "SessionStart", cwd: `${REPO}/src`, summary: "refactor case transfer form validation" },
  snapshot("2026-11-03T16:45:00+07:00", { branch: "main", ticket: null, changed: [{ path: "README.md", status: "M", add: 1, del: 1 }] }),
  snapshot("2026-11-04T16:45:00+07:00", { changed: [], commitsToday: 0 }),
  { ts: "2026-11-05T11:00:00+07:00", kind: "claude-code", event: "Stop", cwd: "/elsewhere/tool" },
  { ts: "2026-11-05T16:45:00+07:00", kind: "evidence", date: "2026-11-05", path: "~/Timesheet/evidence/2026-11-05/a.png", sensitivity: "code" },
  snapshot("2026-10-30T16:45:00+07:00"),
];

/**
 * November document.
 * @returns {TimesheetDoc} - Document
 */
const makeDoc = (): TimesheetDoc => createEmptyDoc(NOVEMBER);

describe("worklog import", () => {
  it("should keep the last snapshot per date and repository", () => {
    const lines = LINES.filter((line) => line.kind === "git-snapshot") as Extract<WorklogLine, { kind: "git-snapshot" }>[];

    expect(latestSnapshots(lines).find((line) => line.ts.startsWith("2026-11-02"))?.ts).toBe("2026-11-02T16:45:00+07:00");
    expect(getLineDate(LINES[7])).toBe("2026-11-05");
    expect(labelOfRepo("/x/y", [])).toBe("y");
    expect(labelOfRepo(REPO, [{ path: REPO, label: " " }])).toBe("bantuit-fe");
  });

  it("should group by date × ticket with hints, falling back to date × repo × branch", () => {
    const groups = groupActivities(LINES.slice(0, 7), [], "(BIT|ASUM)-\\d+");
    const byKey = groups.map((group) => [group.date, group.ticket ?? `${group.label}/${group.branch}`, [...group.sources].sort(), [...group.times].sort(), [...group.files].sort(), group.summary]);

    expect(byKey).toEqual([
      ["2026-11-02", "BIT-231", ["claude-code", "git", "vscode"], ["09:15", "10:03", "16:45"], ["src/pages/CaseTransfer.tsx"], "refactor case transfer form validation"],
      ["2026-11-03", "BANTUIT FE/main", ["git"], ["16:45"], ["README.md"], null],
      ["2026-11-05", "tool/null", ["claude-code"], ["11:00"], [], null],
    ]);
  });

  it("should name tasks from the ticket map or generate a name that needs review", () => {
    const [group] = groupActivities(LINES.slice(1, 2), [], "(BIT|ASUM)-\\d+");

    expect(buildTaskName(group, {})).toEqual({ task: "BIT-231 – case transfer", needsName: true });
    expect(buildTaskName(group, { "BIT-231": " Fixing flow case transfer " })).toEqual({ task: "Fixing flow case transfer", needsName: false });
    expect(buildTaskName({ ...group, ticket: null, branch: null }, {})).toEqual({ task: "BANTUIT FE", needsName: true });
  });

  it("should import unreviewed entries of the month and count evidence lines", () => {
    const doc = makeDoc();

    doc.automation.ticketMap = { "BIT-231": "Fixing flow case transfer" };
    const { doc: next, report } = importWorklog(doc, LINES, { month: NOVEMBER, repos: [{ path: REPO, label: "BANTUIT FE" }] });
    const entry = next.entries[0];

    expect(report).toEqual({ added: 3, duplicates: 0, evidenceLines: 1 });
    expect(next.entries.map((item) => item.date)).toEqual(["2026-11-02", "2026-11-03", "2026-11-05"]);
    expect(entry).toMatchObject({
      task: "Fixing flow case transfer",
      start: "08:00",
      end: "17:00",
      source: "git",
      reviewed: false,
      refs: { repo: "BANTUIT FE", branch: "feature/BIT-231-case-transfer", ticket: "BIT-231", hint: { first: "09:15", last: "16:45" }, needsName: false },
    });
    expect(next.entries[2]).toMatchObject({ source: "claude-code", refs: { repo: "tool", needsName: true } });
    expect(doc.entries).toEqual([]);
  });

  it("should never duplicate rows or touch existing ones", () => {
    const doc = makeDoc();
    const manual: Entry = { id: "m", date: "2026-11-02", task: "Fix BIT-231 bug", start: "08:00", end: "17:00", remarkOverride: null, source: "manual", reviewed: true };

    doc.entries = [manual];
    const first = importWorklog(doc, LINES, { month: NOVEMBER, repos: [] });

    expect(first.report).toMatchObject({ added: 2, duplicates: 1 });
    expect(first.doc.entries[0]).toBe(manual);

    const again = importWorklog(first.doc, LINES, { month: NOVEMBER, repos: [] });

    expect(again.report).toMatchObject({ added: 0, duplicates: 3 });
  });

  it("should match duplicates by ticket ref, ticket-map name or repo + branch", () => {
    const [ticketGroup] = groupActivities(LINES.slice(1, 2), [], "(BIT|ASUM)-\\d+");
    const [repoGroup] = groupActivities(LINES.slice(4, 5), [], "(BIT|ASUM)-\\d+");
    const doc = makeDoc();
    const base: Entry = { id: "x", date: "2026-11-02", task: "Other", start: "08:00", end: "17:00", remarkOverride: null, source: "manual", reviewed: true };

    doc.entries = [{ ...base, refs: { ticket: "bit-231" } }];
    expect(isDuplicate(ticketGroup, doc)).toBe(true);

    doc.entries = [{ ...base, task: "Case transfer" }];
    doc.automation.ticketMap = { "BIT-231": "Case transfer" };
    expect(isDuplicate(ticketGroup, doc)).toBe(true);

    doc.entries = [{ ...base, date: "2026-11-03", refs: { repo: "BANTUIT FE", branch: "main" } }];
    expect(isDuplicate(repoGroup, doc)).toBe(true);
    expect(isDuplicate(ticketGroup, doc)).toBe(false);
  });
});
