import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";
import { buildBulkEntries, getBulkFillDates, mergeAutomation, mergePreviousMonth } from "@/libs/utils/workflow.util";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

describe("bulk fill", () => {
  it("should pick working days in the range, skipping filled and marked days on request", () => {
    const doc = createEmptyDoc({ year: 2026, month: 10 });

    doc.dayOverrides["2026-10-06"] = { type: "holiday", label: "Public Holiday" };
    doc.entries = [{ id: "a", date: "2026-10-05", task: "x", start: "08:00", end: "17:00", remarkOverride: null, source: "manual", reviewed: true }];

    expect(getBulkFillDates(doc, { from: "2026-10-01", to: "2026-10-07", skipFilled: true })).toEqual(["2026-10-01", "2026-10-02", "2026-10-07"]);
    expect(getBulkFillDates(doc, { from: "2026-10-01", to: "2026-10-07", skipFilled: false })).toEqual(["2026-10-01", "2026-10-02", "2026-10-05", "2026-10-07"]);
    expect(buildBulkEntries(doc, { from: "2026-10-01", to: "2026-10-02", task: " Daily ", start: "09:00", end: "18:00", skipFilled: true })).toEqual([
      { date: "2026-10-01", task: "Daily", start: "09:00", end: "18:00" },
      { date: "2026-10-02", task: "Daily", start: "09:00", end: "18:00" },
    ]);
  });
});

describe("previous month import", () => {
  it("should fill only empty fields and collect the task list", () => {
    const previous = loadOctoberDoc();
    const doc = createEmptyDoc({ year: 2026, month: 11 });

    previous.profile.signatures.preparedBy = "data:image/png;base64,P";
    previous.profile.taskTemplates = ["Daily standup"];
    doc.profile.squad = "New squad";
    doc.profile.taskTemplates = ["Daily standup", " "];

    const { doc: next, summary } = mergePreviousMonth(doc, previous);

    expect(next.profile).toMatchObject({
      consultantName: "Arbi Kustia",
      vendorName: "PT Negeri Emas Perkasa",
      squad: "New squad",
      signDate: doc.profile.signDate,
      signatures: { preparedBy: "data:image/png;base64,P", leadProject: null, tribeLeader: null },
    });
    expect(next.profile.taskTemplates[0]).toBe("Daily standup");
    expect(next.profile.taskTemplates).toContain("Tech debt case admin list");
    expect(new Set(next.profile.taskTemplates).size).toBe(next.profile.taskTemplates.length);
    expect(next.entries).toEqual([]);
    expect(next.period).toEqual({ year: 2026, month: 11 });
    expect(summary.filledFields).toBe(6);
    expect(summary.addedTasks).toBe(next.profile.taskTemplates.length - 1);
  });

  it("should keep current automation values and add missing ones", () => {
    const current = { ...createEmptyDoc({ year: 2026, month: 11 }).automation, ticketMap: { "BIT-1": "Mine", "BIT-3": " " }, repos: [{ path: "/a", label: "A" }] };
    const previous = { ...current, ticketMap: { "BIT-1": "Old", "BIT-2": "Two", "BIT-3": "Three", "BIT-4": "" }, repos: [{ path: "/a", label: "Old" }, { path: "/b", label: "B" }, { path: " ", label: "x" }] };

    expect(mergeAutomation(current, previous)).toEqual({
      automation: { ...current, ticketMap: { "BIT-1": "Mine", "BIT-2": "Two", "BIT-3": "Three" }, repos: [{ path: "/a", label: "A" }, { path: "/b", label: "B" }] },
      added: 3,
    });
  });
});
