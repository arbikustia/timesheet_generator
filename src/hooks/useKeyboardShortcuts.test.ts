import { renderHook } from "@/libs/unit-test";

import { toShortcutCombo, useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

/**
 * Dispatch a cancelable keydown on window.
 * @param {KeyboardEventInit} init - Key data
 * @returns {KeyboardEvent} - Dispatched event
 */
const press = (init: KeyboardEventInit): KeyboardEvent => {
  const event = new KeyboardEvent("keydown", { cancelable: true, ...init });

  window.dispatchEvent(event);

  return event;
};

describe("toShortcutCombo", () => {
  it("should map Ctrl/Cmd combos", () => {
    expect(toShortcutCombo(new KeyboardEvent("keydown", { key: "s", ctrlKey: true }))).toBe("mod+s");
    expect(toShortcutCombo(new KeyboardEvent("keydown", { key: "S", metaKey: true, shiftKey: true }))).toBe("mod+shift+s");
    expect(toShortcutCombo(new KeyboardEvent("keydown", { key: "s" }))).toBeNull();
    expect(toShortcutCombo(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, altKey: true }))).toBeNull();
    expect(toShortcutCombo(new KeyboardEvent("keydown", { key: "p", ctrlKey: true }))).toBe("mod+p");
    expect(toShortcutCombo(new KeyboardEvent("keydown", { key: "Z", ctrlKey: true, shiftKey: true }))).toBe("mod+shift+z");
    expect(toShortcutCombo(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }))).toBeNull();
  });
});

describe("useKeyboardShortcuts", () => {
  it("should call the latest handler and prevent the browser default", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, unmount } = renderHook(({ onSave }) => useKeyboardShortcuts({ "mod+s": onSave }), {
      initialProps: { onSave: first },
    });

    rerender({ onSave: second });
    const event = press({ key: "s", ctrlKey: true });

    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
    expect(press({ key: "o", ctrlKey: true }).defaultPrevented).toBe(false);

    unmount();
    press({ key: "s", ctrlKey: true });
    expect(second).toHaveBeenCalledTimes(1);
  });
});
