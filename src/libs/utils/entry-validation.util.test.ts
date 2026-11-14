import { isValidTime, validateEntryInput } from "@/libs/utils/entry-validation.util";

const VALID = { date: "2026-10-01", task: "Task", start: "08:00", end: "17:00" };

describe("entry validation", () => {
  it("should accept HH:mm times only", () => {
    expect(isValidTime("08:00")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("8:00")).toBe(false);
  });

  it("should return a message for each invalid case", () => {
    expect(validateEntryInput(VALID)).toBeNull();
    expect(validateEntryInput({ ...VALID, task: "  " })).toBe("Task wajib diisi.");
    expect(validateEntryInput({ ...VALID, start: "" })).toBe("Format jam harus HH:mm.");
    expect(validateEntryInput({ ...VALID, end: "08:00" })).toBe("Jam selesai harus setelah jam mulai.");
  });
});
