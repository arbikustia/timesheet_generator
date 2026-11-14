import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import { isBuilderTab, useTimesheetBuilder } from "./TimesheetBuilder.hook";

describe("useTimesheetBuilder", () => {
  it("should expose header texts and switch known tabs only", () => {
    const { result } = renderHook(() => useTimesheetBuilder(), { wrapper: createStoreWrapper(makeDocStore()) });

    expect(result.current).toMatchObject({ activeTab: "activities", periodLabel: "Oktober 2026", consultantName: "Arbi Kustia", theme: "light" });

    act(() => result.current.onTabChange("settings"));
    expect(result.current.activeTab).toBe("settings");

    act(() => result.current.onTabChange("unknown"));
    expect(result.current.activeTab).toBe("settings");

    act(() => result.current.onShowCheck());
    expect(result.current.activeTab).toBe("check");
    expect(result.current.errorCount).toBe(3);

    act(() => result.current.onNavigate({ kind: "evidence", date: "2026-10-01" }));
    expect(result.current.activeTab).toBe("evidence");
  });

  it("should recognise builder tab keys", () => {
    expect(isBuilderTab("days")).toBe(true);
    expect(isBuilderTab("toString")).toBe(false);
  });
});
