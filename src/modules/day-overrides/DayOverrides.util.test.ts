import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import { buildOverrideItems, resolveOverrideValues } from "./DayOverrides.util";

describe("DayOverrides util", () => {
  it("should default to the first unmarked weekday and the type label", () => {
    const doc = createEmptyDoc({ year: 2026, month: 10 });

    doc.dayOverrides["2026-10-01"] = { type: "holiday", label: "Public Holiday" };

    expect(resolveOverrideValues({ date: null, type: "holiday", label: null }, doc)).toEqual({
      date: "2026-10-02",
      type: "holiday",
      label: "Public Holiday",
    });
    expect(resolveOverrideValues({ date: "2026-11-01", type: "leave", label: "Cuti" }, doc)).toMatchObject({
      date: "2026-10-02",
      label: "Cuti",
    });
    expect(resolveOverrideValues({ date: "2026-10-09", type: "leave", label: null }, doc)).toEqual({
      date: "2026-10-09",
      type: "leave",
      label: "Leave",
    });
  });

  it("should fall back to the first day when every weekday is marked", () => {
    const doc = createEmptyDoc({ year: 2026, month: 2 });

    doc.dayOverrides = Object.fromEntries(
      Array.from({ length: 28 }, (_, index) => [`2026-02-${String(index + 1).padStart(2, "0")}`, { type: "leave", label: "Cuti" }]),
    );

    expect(resolveOverrideValues({ date: null, type: "leave", label: null }, doc).date).toBe("2026-02-01");
  });

  it("should list marked days sorted and flag days with entries", () => {
    const doc = loadOctoberDoc();

    doc.dayOverrides = {
      "2026-10-20": { type: "leave", label: "Cuti" },
      "2026-10-03": { type: "holiday", label: "Public Holiday" },
    };

    expect(buildOverrideItems(doc)).toEqual([
      { date: "2026-10-03", dateLabel: "Sab, 03/10/2026", override: { type: "holiday", label: "Public Holiday" }, hasEntries: false },
      { date: "2026-10-20", dateLabel: "Sel, 20/10/2026", override: { type: "leave", label: "Cuti" }, hasEntries: true },
    ]);
  });
});
