import { renderHook } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import { useDocumentView } from "./TimesheetDocument.hook";

describe("useDocumentView", () => {
  it("should derive the document view", () => {
    const { result } = renderHook(() => useDocumentView(loadOctoberDoc()));

    expect(result.current.view.monthLabel).toBe("October 2026");
    expect(result.current.view.sheetPages).toHaveLength(2);
  });

  it("should reuse the view while the document is unchanged", () => {
    const doc = loadOctoberDoc();
    const { result, rerender } = renderHook(({ input }) => useDocumentView(input), { initialProps: { input: doc } });
    const first = result.current.view;

    rerender({ input: doc });
    expect(result.current.view).toBe(first);

    rerender({ input: { ...doc } });
    expect(result.current.view).not.toBe(first);
  });
});
