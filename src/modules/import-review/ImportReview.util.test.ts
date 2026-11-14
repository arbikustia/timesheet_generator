import { loadReviewDoc } from "@/fixture/timesheet.fixture";

import { addDays, buildImportCommand, buildReviewItem, buildReviewWeeks, getWeekStart } from "./ImportReview.util";

describe("ImportReview util", () => {
  it("should find the Monday of a week", () => {
    expect(getWeekStart("2026-11-02")).toBe("2026-11-02");
    expect(getWeekStart("2026-11-08")).toBe("2026-11-02");
    expect(getWeekStart("2026-11-01")).toBe("2026-10-26");
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("should group pending entries by week and date", () => {
    const weeks = buildReviewWeeks(loadReviewDoc());

    expect(weeks.map((week) => [week.label, week.entryIds])).toEqual([
      ["Minggu 02/11/2026 – 08/11/2026", ["git-1"]],
      ["Minggu 09/11/2026 – 15/11/2026", ["claude-1"]],
    ]);
    expect(weeks[0].days[0]).toMatchObject({ date: "2026-11-02", label: "Sen, 02/11/2026" });
  });

  it("should describe an item and offer the other rows of its date", () => {
    const doc = loadReviewDoc();
    const item = buildReviewItem(doc.entries[1], doc.entries.filter((entry) => entry.date === "2026-11-02"));

    expect(item).toMatchObject({
      source: "git",
      meta: "BIT-231 · BIT-231-case-transfer · BANTUIT FE",
      hintText: "Aktivitas terdeteksi 08:12–17:40",
      mergeOptions: [{ value: "manual", label: "Daily standup" }],
    });
    expect(buildReviewItem({ ...doc.entries[2], refs: undefined }, [doc.entries[2], { ...doc.entries[0], task: "" }])).toMatchObject({
      meta: "",
      hintText: null,
      mergeOptions: [{ value: "manual", label: "(tanpa task)" }],
    });
  });

  it("should quote the file name in the import command", () => {
    expect(buildImportCommand('My "doc" $x.json', { year: 2026, month: 3 })).toBe('timesheet import --doc "My \\"doc\\" \\$x.json" --month 2026-03');
  });
});
