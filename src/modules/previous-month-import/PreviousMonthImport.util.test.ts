import { describePreviousImport } from "./PreviousMonthImport.util";

describe("describePreviousImport", () => {
  it("should summarise what was taken over", () => {
    expect(describePreviousImport({ filledFields: 6, addedTasks: 3, addedAutomation: 1 }, { year: 2026, month: 10 })).toEqual({
      type: "success",
      text: "Dari Oktober 2026: 6 isian profil/tanda tangan, 3 task favorit, 1 ticket/repo.",
    });
    expect(describePreviousImport({ filledFields: 0, addedTasks: 0, addedAutomation: 0 }, { year: 2026, month: 10 }).type).toBe("info");
  });
});
