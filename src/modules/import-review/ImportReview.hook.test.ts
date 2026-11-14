import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { selectDoc } from "@/store/timesheet.slice";

import { loadReviewDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import { useCopyText, useImportReview } from "./ImportReview.hook";

describe("useImportReview", () => {
  it("should count pending entries and build the import command", () => {
    const { result } = renderHook(() => useImportReview(), { wrapper: createStoreWrapper(makeDocStore(loadReviewDoc())) });

    expect(result.current.pendingCount).toBe(2);
    expect(result.current.importCommand).toBe('timesheet import --doc "Timesheet-YYYY-MM-Nama.json" --month 2026-11');
  });
});

describe("useCopyText", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("should copy and show feedback for a moment", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const { result } = renderHook(() => useCopyText("timesheet import"));

    await act(async () => result.current.onCopyCommand());
    expect(writeText).toHaveBeenCalledWith("timesheet import");
    expect(result.current.isCopied).toBe(true);

    act(() => jest.advanceTimersByTime(2000));
    expect(result.current.isCopied).toBe(false);
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("should do nothing without a clipboard API", () => {
    const { result } = renderHook(() => useCopyText("x"));

    act(() => result.current.onCopyCommand());
    expect(result.current.isCopied).toBe(false);
  });
});

describe("review store wiring", () => {
  it("should keep the document untouched until an action runs", () => {
    const store = makeDocStore(loadReviewDoc());

    renderHook(() => useImportReview(), { wrapper: createStoreWrapper(store) });
    expect(selectDoc(store.getState()).entries).toHaveLength(3);
  });
});
