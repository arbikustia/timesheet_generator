import { formatClock, getFileStatusText, toErrorMessage } from "./FileMenu.util";

const AT_1403 = new Date(2026, 10, 14, 14, 3).toISOString();
const AT_1405 = new Date(2026, 10, 14, 14, 5).toISOString();

describe("FileMenu util", () => {
  it("should format a local clock time", () => {
    expect(formatClock(AT_1403)).toBe("14:03");
  });

  it("should describe saved and unsaved states", () => {
    expect(getFileStatusText({ fileName: null, isDirty: false, lastSavedAt: null, lastDraftAt: null })).toBe("Tersimpan");
    expect(getFileStatusText({ fileName: "a.json", isDirty: false, lastSavedAt: AT_1403, lastDraftAt: null })).toBe("Tersimpan 14:03");
    expect(getFileStatusText({ fileName: null, isDirty: true, lastSavedAt: null, lastDraftAt: null })).toBe("Belum disimpan ●");
    expect(getFileStatusText({ fileName: null, isDirty: true, lastSavedAt: null, lastDraftAt: AT_1405 })).toBe(
      "Belum disimpan ● · draft 14:05",
    );
  });

  it("should read error messages", () => {
    expect(toErrorMessage(new Error("boom"))).toBe("boom");
    expect(toErrorMessage("plain")).toBe("plain");
  });
});
