import { getDateOptions } from "@/libs/utils/date-option.util";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

describe("getDateOptions", () => {
  it("should label every date of the month with its status", () => {
    const doc = loadOctoberDoc();

    doc.entries = doc.entries.filter((entry) => entry.date !== "2026-10-02");
    doc.dayOverrides["2026-10-02"] = { type: "leave", label: "Cuti" };

    const options = getDateOptions(doc);

    expect(options).toHaveLength(31);
    expect(options[0]).toEqual({ value: "2026-10-01", label: "Kam, 01/10/2026 · terisi" });
    expect(options[1].label).toBe("Jum, 02/10/2026 · Cuti");
    expect(options[2].label).toBe("Sab, 03/10/2026 · Weekend");
  });

  it("should leave an empty working day without suffix", () => {
    const doc = loadOctoberDoc();

    doc.entries = [];

    expect(getDateOptions(doc)[0].label).toBe("Kam, 01/10/2026");
  });
});
