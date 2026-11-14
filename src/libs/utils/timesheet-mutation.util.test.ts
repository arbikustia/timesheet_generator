import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";
import {
  _shiftDate,
  createId,
  createNextMonthDoc,
  getPreviousEntry,
  getTaskSuggestions,
  hasPeriodData,
  insertEntrySorted,
  moveItem,
  resetDocToPeriod,
  shiftDocToPeriod,
} from "@/libs/utils/timesheet-mutation.util";

import type { Entry } from "@/types/timesheet.type";

import { loadOctoberDoc, loadOctoberDocWithEvidence } from "@/fixture/timesheet.fixture";

/**
 * Build a minimal manual entry.
 * @param {string} id - Entry id
 * @param {string} date - ISO date
 * @param {string} [task="Task"] - Task text
 * @returns {Entry} - Entry
 */
const makeEntry = (id: string, date: string, task: string = "Task"): Entry => ({
  id,
  date,
  task,
  start: "08:00",
  end: "17:00",
  remarkOverride: null,
  source: "manual",
  reviewed: true,
});

describe("createId", () => {
  it("should create distinct ids", () => {
    expect(createId()).not.toBe(createId());
  });
});

describe("insertEntrySorted", () => {
  const entries = [makeEntry("a", "2026-10-01"), makeEntry("b", "2026-10-05"), makeEntry("c", "2026-10-09")];

  it("should insert after the last entry on or before the date", () => {
    expect(insertEntrySorted(entries, makeEntry("x", "2026-10-05")).map((entry) => entry.id)).toEqual(["a", "b", "x", "c"]);
    expect(insertEntrySorted(entries, makeEntry("y", "2026-10-31")).map((entry) => entry.id)).toEqual(["a", "b", "c", "y"]);
  });

  it("should insert first when every entry is later", () => {
    expect(insertEntrySorted(entries, makeEntry("z", "2026-09-30")).map((entry) => entry.id)).toEqual(["z", "a", "b", "c"]);
  });
});

describe("moveItem", () => {
  it("should move an item between indexes", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("should return an unchanged copy for invalid or equal indexes", () => {
    const items = ["a", "b"];

    expect(moveItem(items, 0, 5)).toEqual(items);
    expect(moveItem(items, -1, 0)).toEqual(items);
    expect(moveItem(items, 1, 1)).not.toBe(items);
  });
});

describe("period changes", () => {
  it("should re-date to the same day and drop missing days", () => {
    expect(_shiftDate("2026-10-31", { year: 2026, month: 11 })).toBeNull();
    expect(_shiftDate("2026-10-05", { year: 2026, month: 11 })).toBe("2026-11-05");
  });

  it("should move entries, evidence and day markings to the new period", () => {
    const doc = loadOctoberDocWithEvidence();

    doc.dayOverrides["2026-10-31"] = { type: "holiday", label: "Public Holiday" };
    doc.dayOverrides["2026-10-02"] = { type: "leave", label: "Cuti" };

    const moved = shiftDocToPeriod(doc, { year: 2026, month: 11 });

    expect(moved.period).toEqual({ year: 2026, month: 11 });
    expect(moved.entries).toHaveLength(23);
    expect(moved.entries[0].date).toBe("2026-11-01");
    expect(Object.keys(moved.evidence)).toContain("2026-11-30");
    expect(moved.dayOverrides).toEqual({ "2026-11-02": { type: "leave", label: "Cuti" } });
    expect(moved.profile.signDate).toBe("2026-11-30");
  });

  it("should drop the 31st when moving to a 30-day month", () => {
    const doc = loadOctoberDoc();

    doc.entries.push({ ...doc.entries[0], id: "late", date: "2026-10-31" });

    expect(shiftDocToPeriod(doc, { year: 2026, month: 9 }).entries.some((entry) => entry.id === "late")).toBe(false);
  });

  it("should reset month data but keep the profile", () => {
    const reset = resetDocToPeriod(loadOctoberDocWithEvidence(), { year: 2027, month: 2 });

    expect(reset.entries).toEqual([]);
    expect(reset.evidence).toEqual({});
    expect(reset.profile.consultantName).toBe("Arbi Kustia");
    expect(reset.profile.signDate).toBe("2027-02-26");
  });

  it("should start the next month with profile and signatures carried over", () => {
    const doc = loadOctoberDoc();

    doc.profile.signatures.preparedBy = "data:image/png;base64,AA";
    const next = createNextMonthDoc(doc);

    expect(next.period).toEqual({ year: 2026, month: 11 });
    expect(next.entries).toEqual([]);
    expect(next.profile.signatures.preparedBy).toBe("data:image/png;base64,AA");
  });
});

describe("hasPeriodData", () => {
  it("should detect entries, evidence or day markings", () => {
    const empty = createEmptyDoc({ year: 2026, month: 10 });

    expect(hasPeriodData(empty)).toBe(false);
    expect(hasPeriodData(loadOctoberDoc())).toBe(true);
    expect(hasPeriodData({ ...empty, dayOverrides: { "2026-10-01": { type: "leave", label: "Cuti" } } })).toBe(true);
    expect(hasPeriodData({ ...empty, evidence: { "2026-10-01": [] } })).toBe(true);
  });
});

describe("getTaskSuggestions", () => {
  it("should list templates first, then used tasks newest first, without duplicates", () => {
    const doc = loadOctoberDoc();

    doc.profile.taskTemplates = ["Daily standup", " Tech debt case admin list "];

    const suggestions = getTaskSuggestions(doc);

    expect(suggestions.slice(0, 3)).toEqual([
      "Daily standup",
      "Tech debt case admin list",
      "Fixing code new business for deployment",
    ]);
    expect(new Set(suggestions).size).toBe(suggestions.length);
  });
});

describe("getPreviousEntry", () => {
  it("should return the last entry before the date", () => {
    expect(getPreviousEntry(loadOctoberDoc(), "2026-10-12")?.id).toBe("e8");
  });

  it("should fall back to the last entry, or null without entries", () => {
    expect(getPreviousEntry(loadOctoberDoc(), "2026-10-01")?.id).toBe("e23");
    expect(getPreviousEntry(createEmptyDoc({ year: 2026, month: 10 }), "2026-10-01")).toBeNull();
  });
});
