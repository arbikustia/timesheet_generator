import type { ChangeEvent } from "react";

import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { selectDoc } from "@/store/timesheet.slice";

import { loadOctoberDoc, makeDocStore, makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import type { FormSubmitEvent } from "@/types/common.type";

import { resolveEntryValues, useEntryForm } from "./EntryForm.hook";

/**
 * Fake input change event.
 * @param {string} value - Input value
 * @returns {ChangeEvent<HTMLInputElement>} - Event
 */
const changeEvent = (value: string): ChangeEvent<HTMLInputElement> => ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

/**
 * Fake form submit event.
 * @returns {FormSubmitEvent} - Event with preventDefault spy
 */
const submitEvent = (): FormSubmitEvent => ({ preventDefault: jest.fn() });

/**
 * Render the hook with a store.
 * @param {ReturnType<typeof makeDocStore>} store - Store
 * @returns {ReturnType<typeof renderHook<ReturnType<typeof useEntryForm>, unknown>>} - Hook render
 */
const renderFormHook = (store: ReturnType<typeof makeDocStore>) =>
  renderHook(() => useEntryForm(), { wrapper: createStoreWrapper(store) });

describe("resolveEntryValues", () => {
  it("should default to the next unfilled workday and profile hours", () => {
    expect(resolveEntryValues({ date: null, task: "", start: null, end: null }, createEmptyDoc({ year: 2026, month: 10 }))).toEqual({
      date: "2026-10-01",
      task: "",
      start: "08:00",
      end: "17:00",
    });
  });

  it("should fall back to the first day when every workday is filled, and ignore dates outside the period", () => {
    expect(resolveEntryValues({ date: "2026-11-05", task: "T", start: "09:00", end: "10:00" }, loadOctoberDoc())).toEqual({
      date: "2026-10-01",
      task: "T",
      start: "09:00",
      end: "10:00",
    });
  });
});

describe("useEntryForm", () => {
  it("should add a valid activity, reset the draft and refocus task", () => {
    const store = makeEmptyOctoberStore();
    const { result } = renderFormHook(store);
    const focus = jest.fn();

    Object.assign(result.current.taskInputRef, { current: { focus } });

    act(() => result.current.onTaskChange("  Daily standup "));
    act(() => result.current.onStartChange(changeEvent("09:00")));
    act(() => result.current.onEndChange(changeEvent("10:00")));
    act(() => result.current.onSubmit(submitEvent()));

    expect(selectDoc(store.getState()).entries[0]).toMatchObject({ date: "2026-10-01", task: "Daily standup", start: "09:00", end: "10:00" });
    expect(result.current.values).toEqual({ date: "2026-10-02", task: "", start: "08:00", end: "17:00" });
    expect(result.current.error).toBeNull();
    expect(focus).toHaveBeenCalled();
  });

  it("should show an error and add nothing when invalid", () => {
    const store = makeEmptyOctoberStore();
    const { result } = renderFormHook(store);

    act(() => result.current.onSubmit(submitEvent()));

    expect(result.current.error).toBe("Task wajib diisi.");
    expect(selectDoc(store.getState()).entries).toEqual([]);
  });

  it("should duplicate the previous entry for the selected date", () => {
    const { result } = renderFormHook(makeDocStore());

    act(() => result.current.onDateChange("2026-10-12"));
    act(() => result.current.onDuplicatePrevious());

    expect(result.current.canDuplicate).toBe(true);
    expect(result.current.values).toMatchObject({ date: "2026-10-12", task: "Fixing flow case admin case transfer", start: "08:04" });
  });

  it("should not duplicate without previous entries", () => {
    const { result } = renderFormHook(makeEmptyOctoberStore());

    act(() => result.current.onDuplicatePrevious());

    expect(result.current.canDuplicate).toBe(false);
    expect(result.current.values.task).toBe("");
  });

  it("should offer dates and task suggestions", () => {
    const { result } = renderFormHook(makeDocStore());

    expect(result.current.dateOptions).toHaveLength(31);
    expect(result.current.taskOptions[0]).toEqual({ value: "Fixing code new business for deployment" });
  });
});
