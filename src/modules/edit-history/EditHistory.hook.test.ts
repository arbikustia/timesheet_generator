import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { addEntry, selectDoc } from "@/store/timesheet.slice";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import { useEditHistory } from "./EditHistory.hook";

/**
 * Press a Ctrl shortcut on window.
 * @param {string} key - Key
 * @param {boolean} [shiftKey=false] - Whether Shift is held
 * @returns {void}
 */
const pressCtrl = (key: string, shiftKey: boolean = false): void => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: true, shiftKey, cancelable: true }));
};

describe("useEditHistory", () => {
  it("should undo and redo with keyboard shortcuts", () => {
    const store = makeEmptyOctoberStore();
    const { result } = renderHook(() => useEditHistory(), { wrapper: createStoreWrapper(store) });

    act(() => {
      store.dispatch(addEntry({ date: "2026-10-01", task: "Rapat", start: "08:00", end: "17:00" }));
    });
    expect(result.current.canUndo).toBe(true);

    act(() => pressCtrl("z"));
    expect(selectDoc(store.getState()).entries).toHaveLength(0);
    expect(result.current.canRedo).toBe(true);

    act(() => pressCtrl("Z", true));
    expect(selectDoc(store.getState()).entries).toHaveLength(1);

    act(() => pressCtrl("z"));
    act(() => pressCtrl("y"));
    expect(selectDoc(store.getState()).entries).toHaveLength(1);
  });
});
