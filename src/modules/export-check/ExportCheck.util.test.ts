import { buildSummaryItems } from "./ExportCheck.util";

describe("buildSummaryItems", () => {
  it("should format the month summary", () => {
    const items = buildSummaryItems({
      workdayCount: 22,
      filledWorkdayCount: 20,
      entryCount: 23,
      totalMinutes: 12_030,
      evidenceDateCount: 22,
      evidencePageCount: 6,
    });

    expect(items.map((item) => item.value)).toEqual(["20 / 22", "200 jam 30 mnt", "23", "6 (22 tanggal)"]);
  });
});
