import { createStoreWrapper, renderHook } from "@/libs/unit-test";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import { useDocumentPreview } from "./DocumentPreview.hook";

describe("useDocumentPreview", () => {
  it("should return the store document with zoom 1 before measuring", () => {
    const { result } = renderHook(() => useDocumentPreview(), { wrapper: createStoreWrapper(makeDocStore()) });

    expect(result.current.doc.period).toEqual({ year: 2026, month: 10 });
    expect(result.current.zoom).toBe(1);
    expect(result.current.containerRef).toEqual({ current: null });
  });
});
