import type { ChangeEvent } from "react";

import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import { isBulkFillTextField, useBulkFill } from "./BulkFill.hook";

describe("useBulkFill", () => {
  it("should default to the whole month and ignore unknown fields", () => {
    const { result } = renderHook(() => useBulkFill(), { wrapper: createStoreWrapper(makeEmptyOctoberStore()) });
    const input = document.createElement("input");

    expect(result.current.targetCount).toBe(22);
    input.dataset.field = "other";
    input.value = "x";
    act(() => result.current.onFieldChange({ currentTarget: input } as ChangeEvent<HTMLInputElement>));
    expect(result.current.values.from).toBe("2026-10-01");
    expect(isBulkFillTextField("start")).toBe(true);
    expect(isBulkFillTextField(undefined)).toBe(false);
  });
});
