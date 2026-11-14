import { getDurationMinutes, toMinutes } from "@/libs/utils/entry-validation.util";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";
import { groupEntriesByDate } from "@/libs/utils/timesheet-engine.util";
import {
  _checkDate,
  _checkEntry,
  _checkRepeatedTasks,
  buildMonthSummary,
  formatDuration,
  getWorkdays,
  validateDoc,
} from "@/libs/utils/timesheet-validation.util";

import { loadOctoberDoc, loadOctoberDocWithEvidence, SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

import type { Entry, TimesheetDoc } from "@/types/timesheet.type";

const ENTRY: Entry = {
  id: "x",
  date: "2026-10-01",
  task: "Task",
  start: "08:00",
  end: "17:00",
  remarkOverride: null,
  source: "manual",
  reviewed: true,
};

/**
 * October fixture with evidence and all three signatures.
 * @returns {TimesheetDoc} - Ready-to-export document
 */
const makeReadyDoc = (): TimesheetDoc => {
  const doc = loadOctoberDocWithEvidence();

  doc.profile.signatures = { preparedBy: "data:image/png;base64,A", leadProject: "data:image/png;base64,B", tribeLeader: "data:image/png;base64,C" };

  return doc;
};

/**
 * Ids of the issues of a report.
 * @param {TimesheetDoc} doc - Document
 * @returns {string[]} - Issue ids
 */
const issueIds = (doc: TimesheetDoc): string[] => validateDoc(doc).issues.map((issue) => issue.id);

describe("timesheet validation", () => {
  it("should compute durations", () => {
    expect(toMinutes("08:30")).toBe(510);
    expect(toMinutes("8:30")).toBeNull();
    expect(getDurationMinutes("08:00", "17:30")).toBe(570);
    expect(getDurationMinutes("17:00", "08:00")).toBe(0);
    expect(getDurationMinutes("x", "08:00")).toBe(0);
    expect(formatDuration(540)).toBe("9 jam");
    expect(formatDuration(450)).toBe("7 jam 30 mnt");
  });

  it("should summarize the October fixture", () => {
    const doc = loadOctoberDocWithEvidence();

    doc.dayOverrides["2026-10-30"] = { type: "holiday", label: "Public Holiday" };

    const summary = buildMonthSummary(doc);

    expect(getWorkdays(doc)).toHaveLength(21);
    expect(summary.workdayCount).toBe(21);
    expect(summary.filledWorkdayCount).toBe(21);
    expect(summary.entryCount).toBe(23);
    expect(summary.evidenceDateCount).toBe(22);
    expect(summary.evidencePageCount).toBe(6);
    expect(summary.totalMinutes).toBeGreaterThan(22 * 8 * 60);
  });

  it("should report entry errors", () => {
    const doc = loadOctoberDoc();
    const messages = (entry: Entry): string[] => _checkEntry(entry, doc).map((issue) => issue.message);

    expect(messages(ENTRY)).toEqual([]);
    expect(messages({ ...ENTRY, date: "2026-11-02" })).toEqual(["Tanggal Sen, 02/11/2026 di luar periode Oktober 2026."]);
    expect(messages({ ...ENTRY, task: " " })).toEqual(["Task kosong pada Kam, 01/10/2026."]);
    expect(messages({ ...ENTRY, start: "8:00" })).toEqual(["Format jam salah pada Kam, 01/10/2026 (harus HH:mm)."]);
    expect(messages({ ...ENTRY, end: "08:00" })).toEqual(["Jam selesai harus setelah jam mulai pada Kam, 01/10/2026."]);
    expect(messages({ ...ENTRY, reviewed: false })).toEqual(["Aktivitas otomatis Kam, 01/10/2026 belum direview."]);
  });

  it("should report date warnings", () => {
    const doc = createEmptyDoc({ year: 2026, month: 10 });
    const ids = (isoDate: string, entries: Entry[]): string[] => _checkDate(isoDate, doc, entries).map((issue) => issue.id);

    expect(ids("2026-10-01", [])).toEqual(["empty:2026-10-01"]);
    expect(ids("2026-10-03", [])).toEqual([]);
    expect(ids("2026-10-03", [{ ...ENTRY, date: "2026-10-03" }])).toEqual(["off-entry:2026-10-03", "no-evidence:2026-10-03"]);
    expect(ids("2026-10-01", [{ ...ENTRY, end: "12:00" }])).toEqual(["no-evidence:2026-10-01", "hours:2026-10-01"]);
    expect(_checkDate("2026-10-01", doc, [{ ...ENTRY, end: "21:00" }])[1].message).toBe("Total jam Kam, 01/10/2026 13 jam (lebih dari 12 jam).");

    doc.evidence["2026-10-02"] = [SAMPLE_IMAGE];
    doc.dayOverrides["2026-10-05"] = { type: "leave", label: "Cuti" };

    expect(ids("2026-10-02", [])).toEqual(["orphan-evidence:2026-10-02"]);
    expect(_checkDate("2026-10-05", doc, [{ ...ENTRY, date: "2026-10-05" }])[0].message).toContain("(Cuti)");
  });

  it("should pass a complete document except the double-booked day and a repeated-task note", () => {
    const report = validateDoc(makeReadyDoc());

    expect(report.issues.filter((issue) => issue.level !== "info").map((issue) => issue.id)).toEqual(["hours:2026-10-07"]);
    expect(report.issues.filter((issue) => issue.level === "info").every((issue) => issue.id.startsWith("repeat:"))).toBe(true);
  });

  it("should note a task repeated on more than five consecutive working days", () => {
    const doc = createEmptyDoc({ year: 2026, month: 10 });
    const days = ["2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"];

    doc.entries = days.map((date, index) => ({ ...ENTRY, id: `d${index}`, date, task: " Daily " }));
    doc.entries.push({ ...ENTRY, id: "other", date: "2026-10-09", task: "Other" });

    const issues = _checkRepeatedTasks(doc, groupEntriesByDate(doc));

    expect(issues).toEqual([
      { id: "repeat:2026-10-01:Daily", level: "info", message: 'Task "Daily" sama selama 6 hari kerja berturut-turut (01/10–08/10).', target: { kind: "date", date: "2026-10-01" } },
    ]);

    doc.entries = doc.entries.filter((entry) => entry.date !== "2026-10-05");
    expect(_checkRepeatedTasks(doc, groupEntriesByDate(doc))).toEqual([]);

    doc.entries = days.map((date, index) => ({ ...ENTRY, id: `e${index}`, date }));
    expect(_checkRepeatedTasks(doc, groupEntriesByDate(doc))).toHaveLength(1);
  });

  it("should require names, signatures and blurred code screenshots, errors first", () => {
    const doc = makeReadyDoc();

    doc.profile.leadProject = "";
    doc.profile.signatures.tribeLeader = null;
    doc.evidence["2026-10-01"] = [{ ...SAMPLE_IMAGE, id: "code", sensitivity: "code", blurred: false }];
    doc.evidence["2026-11-02"] = [SAMPLE_IMAGE];
    doc.evidence["2026-11-03"] = [];

    const report = validateDoc(doc);

    expect(report.issues.map((issue) => issue.id)).toEqual([
      "blur:code",
      "profile:leadProject",
      "signature:tribeLeader",
      "evidence-period:2026-11-02",
      "hours:2026-10-07",
      ...report.issues.filter((issue) => issue.level === "info").map((issue) => issue.id),
    ]);
    expect(report.errorCount).toBe(3);
    expect(report.warningCount).toBe(2);
  });

  it("should warn when the document is too large", () => {
    const doc = makeReadyDoc();

    doc.evidence["2026-10-01"] = [{ ...SAMPLE_IMAGE, dataUrl: `data:image/jpeg;base64,${"A".repeat(16 * 1024 * 1024)}` }];

    expect(issueIds(doc)).toContain("size");
  });
});
