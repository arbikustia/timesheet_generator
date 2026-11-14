import { createStoreWrapper, renderHook } from "@/libs/unit-test";

import { loadReviewDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import { useAutomationSettings } from "./AutomationSettings.hook";

describe("useAutomationSettings", () => {
  it("should expose ticket rows and repositories of the document", () => {
    const doc = loadReviewDoc();

    doc.automation.ticketMap = { "BIT-1": "Login" };
    doc.automation.repos = [{ path: "/w", label: "W" }];
    const { result } = renderHook(() => useAutomationSettings(), { wrapper: createStoreWrapper(makeDocStore(doc)) });

    expect(result.current.ticketRows).toEqual([{ ticket: "BIT-1", name: "Login" }]);
    expect(result.current.repos).toEqual([{ path: "/w", label: "W" }]);
    expect(result.current.ticketError).toBeNull();
  });
});
