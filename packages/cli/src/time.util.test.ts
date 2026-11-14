/** @jest-environment node */
import { dateOfTimestamp, timeOfTimestamp, toLocalDate, toLocalTimestamp } from "./time.util";

describe("time util", () => {
  it("should format local dates and timestamps with an offset", () => {
    const date = new Date(2026, 10, 14, 9, 5, 7);
    const ts = toLocalTimestamp(date);

    expect(toLocalDate(date)).toBe("2026-11-14");
    expect(ts).toMatch(/^2026-11-14T09:05:07[+-]\d{2}:\d{2}$/);
    expect(dateOfTimestamp(ts)).toBe("2026-11-14");
    expect(timeOfTimestamp(ts)).toBe("09:05");
  });

  it("should format negative offsets", () => {
    const date = new Date(2026, 0, 2, 3, 4, 5);

    jest.spyOn(date, "getTimezoneOffset").mockReturnValue(330);
    expect(toLocalTimestamp(date)).toBe("2026-01-02T03:04:05-05:30");
  });
});
