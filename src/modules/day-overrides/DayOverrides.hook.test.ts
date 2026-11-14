import type { ChangeEvent } from "react";

import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { selectDoc } from "@/store/timesheet.slice";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import { useDayOverrides } from "./DayOverrides.hook";

/**
 * Render the hook with an empty October store.
 * @returns {{ result: { current: ReturnType<typeof useDayOverrides> }; store: ReturnType<typeof makeEmptyOctoberStore> }} - Hook and store
 */
const renderOverridesHook = () => {
  const store = makeEmptyOctoberStore();
  const { result } = renderHook(() => useDayOverrides(), { wrapper: createStoreWrapper(store) });

  return { result, store };
};

describe("useDayOverrides", () => {
  it("should mark a holiday with the default label", () => {
    const { result, store } = renderOverridesHook();

    act(() => result.current.onSubmit({ preventDefault: jest.fn() }));

    expect(selectDoc(store.getState()).dayOverrides).toEqual({ "2026-10-01": { type: "holiday", label: "Public Holiday" } });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.values.date).toBe("2026-10-02");
  });

  it("should mark leave with a custom label on a chosen date", () => {
    const { result, store } = renderOverridesHook();

    act(() => result.current.onDateChange("2026-10-09"));
    act(() => result.current.onTypeChange("leave"));
    act(() => result.current.onLabelChange({ target: { value: "Cuti tahunan" } } as ChangeEvent<HTMLInputElement>));
    act(() => result.current.onSubmit({ preventDefault: jest.fn() }));

    expect(selectDoc(store.getState()).dayOverrides["2026-10-09"]).toEqual({ type: "leave", label: "Cuti tahunan" });
  });

  it("should require a label", () => {
    const { result, store } = renderOverridesHook();

    act(() => result.current.onLabelChange({ target: { value: "  " } } as ChangeEvent<HTMLInputElement>));
    act(() => result.current.onSubmit({ preventDefault: jest.fn() }));

    expect(result.current.error).toBe("Keterangan wajib diisi.");
    expect(selectDoc(store.getState()).dayOverrides).toEqual({});
  });
});
