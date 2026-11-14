import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { selectDoc } from "@/store/timesheet.slice";

import { makeDocStore, makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import { usePeriodPanel } from "./PeriodPanel.hook";

/**
 * Render the hook with a store.
 * @param {ReturnType<typeof makeDocStore>} store - Store
 * @returns {ReturnType<typeof renderHook<ReturnType<typeof usePeriodPanel>, unknown>>} - Hook render
 */
const renderPanelHook = (store: ReturnType<typeof makeDocStore>) =>
  renderHook(() => usePeriodPanel(), { wrapper: createStoreWrapper(store) });

describe("usePeriodPanel", () => {
  it("should expose the document period and options", () => {
    const { result } = renderPanelHook(makeDocStore());

    expect(result.current).toMatchObject({ month: 10, year: 2026, nextPeriodLabel: "November 2026", pendingAction: null });
    expect(result.current.monthOptions).toHaveLength(12);
  });

  it("should switch directly when the month has no data", () => {
    const store = makeEmptyOctoberStore();
    const { result } = renderPanelHook(store);

    act(() => result.current.onMonthChange(3));
    expect(selectDoc(store.getState()).period).toEqual({ year: 2026, month: 3 });

    act(() => result.current.onYearChange(2027));
    expect(selectDoc(store.getState()).period).toEqual({ year: 2027, month: 3 });

    act(() => result.current.onStartNextMonth());
    expect(selectDoc(store.getState()).period).toEqual({ year: 2027, month: 4 });
  });

  it("should ignore selecting the same period", () => {
    const { result } = renderPanelHook(makeDocStore());

    act(() => result.current.onMonthChange(10));

    expect(result.current.pendingAction).toBeNull();
  });

  it("should ask before moving data and apply the chosen mode", () => {
    const store = makeDocStore();
    const { result } = renderPanelHook(store);

    act(() => result.current.onMonthChange(11));
    expect(result.current.pendingAction).toEqual({ kind: "change-period", period: { year: 2026, month: 11 } });

    act(() => result.current.onConfirmMove());
    expect(selectDoc(store.getState()).entries[0].date).toBe("2026-11-01");
    expect(result.current.pendingAction).toBeNull();

    act(() => result.current.onYearChange(2027));
    act(() => result.current.onConfirmReset());
    expect(selectDoc(store.getState()).entries).toEqual([]);
  });

  it("should confirm or cancel starting the next month", () => {
    const store = makeDocStore();
    const { result } = renderPanelHook(store);

    act(() => result.current.onStartNextMonth());
    expect(result.current.pendingAction).toEqual({ kind: "next-month" });

    act(() => result.current.onCancel());
    expect(selectDoc(store.getState()).period.month).toBe(10);

    act(() => result.current.onStartNextMonth());
    act(() => result.current.onConfirmNextMonth());
    expect(selectDoc(store.getState()).period.month).toBe(11);
  });

  it("should not change the period when confirming without a pending period change", () => {
    const store = makeDocStore();
    const { result } = renderPanelHook(store);

    act(() => result.current.onConfirmMove());

    expect(selectDoc(store.getState()).period.month).toBe(10);
  });
});
