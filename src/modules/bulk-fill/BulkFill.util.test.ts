import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { getWorkdayOptions, resolveBulkFillValues, validateBulkFill } from "./BulkFill.util";

const DOC = createEmptyDoc({ year: 2026, month: 10 });
const VALUES = { from: "2026-10-01", to: "2026-10-30", task: "Daily", start: "08:00", end: "17:00", skipFilled: true };

describe("BulkFill util", () => {
  it("should offer working days and default to the whole month", () => {
    expect(getWorkdayOptions(DOC)[0]).toEqual({ value: "2026-10-01", label: "Kam, 01/10/2026" });
    expect(resolveBulkFillValues({ from: null, to: null, task: "", start: null, end: null, skipFilled: true }, DOC)).toEqual({ ...VALUES, task: "" });
    expect(resolveBulkFillValues({ from: "2026-10-05", to: "2026-10-09", task: "x", start: "09:00", end: "18:00", skipFilled: false }, DOC)).toMatchObject({
      from: "2026-10-05",
      start: "09:00",
      skipFilled: false,
    });
  });

  it("should fall back to empty dates for a period without working days", () => {
    const doc = createEmptyDoc({ year: 2026, month: 2 });

    Object.assign(doc.dayOverrides, Object.fromEntries(getWorkdayOptions(doc).map((option) => [option.value, { type: "leave", label: "Cuti" }])));
    expect(resolveBulkFillValues({ from: null, to: null, task: "", start: null, end: null, skipFilled: true }, doc)).toMatchObject({ from: "", to: "" });
  });

  it("should validate the range, the entry fields and the target count", () => {
    expect(validateBulkFill(VALUES, 22)).toBeNull();
    expect(validateBulkFill({ ...VALUES, from: "2026-10-31", to: "2026-10-01" }, 0)).toBe("Tanggal awal harus sebelum tanggal akhir.");
    expect(validateBulkFill({ ...VALUES, task: " " }, 22)).toBe("Task wajib diisi.");
    expect(validateBulkFill({ ...VALUES, end: "07:00" }, 22)).toBe("Jam selesai harus setelah jam mulai.");
    expect(validateBulkFill(VALUES, 0)).toBe("Tidak ada hari kerja yang bisa diisi di rentang ini.");
  });
});
