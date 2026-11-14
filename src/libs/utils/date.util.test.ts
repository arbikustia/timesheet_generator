import {
  formatDateDash,
  formatDateSlash,
  formatLongDate,
  formatMonthYear,
  getDaysInMonth,
  getLastWeekday,
  getMonthDates,
  isInPeriod,
  isWeekend,
  toIsoDate,
} from "@/libs/utils/date.util";

describe("getDaysInMonth", () => {
  it.each([
    [{ year: 2026, month: 2 }, 28],
    [{ year: 2024, month: 2 }, 29],
    [{ year: 2000, month: 2 }, 29],
    [{ year: 1900, month: 2 }, 28],
    [{ year: 2026, month: 4 }, 30],
    [{ year: 2026, month: 10 }, 31],
    [{ year: 2026, month: 12 }, 31],
  ])("should return the day count for %o", (period, expected) => {
    expect(getDaysInMonth(period)).toBe(expected);
  });
});

describe("getMonthDates", () => {
  it("should list every date of the month in order", () => {
    const dates = getMonthDates({ year: 2026, month: 10 });

    expect(dates).toHaveLength(31);
    expect(dates[0]).toBe("2026-10-01");
    expect(dates[30]).toBe("2026-10-31");
  });

  it("should include 29 February in a leap year", () => {
    expect(getMonthDates({ year: 2024, month: 2 }).at(-1)).toBe("2024-02-29");
  });
});

describe("isWeekend", () => {
  it("should mark the October 2026 weekends", () => {
    const weekends = getMonthDates({ year: 2026, month: 10 }).filter(isWeekend);

    expect(weekends.map((isoDate) => isoDate.slice(8))).toEqual(["03", "04", "10", "11", "17", "18", "24", "25", "31"]);
  });

  it("should not mark a weekday", () => {
    expect(isWeekend("2026-10-05")).toBe(false);
  });
});

describe("isInPeriod", () => {
  it("should match only the same year and month", () => {
    expect(isInPeriod("2026-10-31", { year: 2026, month: 10 })).toBe(true);
    expect(isInPeriod("2026-11-01", { year: 2026, month: 10 })).toBe(false);
    expect(isInPeriod("2025-10-01", { year: 2026, month: 10 })).toBe(false);
  });
});

describe("getLastWeekday", () => {
  it("should skip a trailing weekend", () => {
    expect(getLastWeekday({ year: 2026, month: 10 })).toBe("2026-10-30");
    expect(getLastWeekday({ year: 2026, month: 5 })).toBe("2026-05-29");
  });

  it("should return the last day when it is a weekday", () => {
    expect(getLastWeekday({ year: 2024, month: 2 })).toBe("2024-02-29");
  });
});

describe("formatters", () => {
  it("should format document dates", () => {
    expect(toIsoDate(2026, 1, 5)).toBe("2026-01-05");
    expect(formatDateSlash("2026-10-07")).toBe("07/10/2026");
    expect(formatDateDash("2026-10-07")).toBe("07-10-2026");
    expect(formatMonthYear({ year: 2026, month: 10 })).toBe("October 2026");
    expect(formatLongDate("2026-10-30")).toBe("30 October 2026");
    expect(formatLongDate("2026-01-05")).toBe("5 January 2026");
  });
});
