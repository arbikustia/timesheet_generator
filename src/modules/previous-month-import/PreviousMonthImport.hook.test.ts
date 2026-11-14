import { createStoreWrapper, renderHook } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import { usePreviousMonthImport } from "./PreviousMonthImport.hook";

describe("usePreviousMonthImport", () => {
  it("should start idle without a notice", () => {
    const { result } = renderHook(() => usePreviousMonthImport(), { wrapper: createStoreWrapper(makeEmptyOctoberStore()) });

    expect(result.current).toMatchObject({ isReading: false, notice: null });
    expect(() => result.current.onChooseFile()).not.toThrow();
  });
});
