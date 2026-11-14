import { createStoreWrapper, renderHook } from "@/libs/unit-test";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import { useExportCheck } from "./ExportCheck.hook";

describe("useExportCheck", () => {
  it("should split issues by level and summarize the month", () => {
    const { result } = renderHook(() => useExportCheck(jest.fn()), { wrapper: createStoreWrapper(makeDocStore()) });

    expect(result.current.errors.map((issue) => issue.id)).toEqual(["signature:preparedBy", "signature:leadProject", "signature:tribeLeader"]);
    expect(result.current.warnings.every((issue) => issue.level === "warning")).toBe(true);
    expect(result.current.summaryItems[0].value).toBe("22 / 22");
  });
});
