import { getMonthOptions, getYearOptions } from "./PeriodPanel.util";

describe("PeriodPanel util", () => {
  it("should list Indonesian months", () => {
    const options = getMonthOptions();

    expect(options).toHaveLength(12);
    expect(options[0]).toEqual({ value: 1, label: "Januari" });
    expect(options[11]).toEqual({ value: 12, label: "Desember" });
  });

  it("should offer the current year ± 3", () => {
    expect(getYearOptions(2026, 2026).map((option) => option.value)).toEqual([2023, 2024, 2025, 2026, 2027, 2028, 2029]);
  });

  it("should include a document year outside the range", () => {
    expect(getYearOptions(2026, 2015)[0]).toEqual({ value: 2015, label: "2015" });
  });
});
