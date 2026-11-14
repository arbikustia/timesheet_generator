import { useEffect, useRef } from "react";

import type { ShortcutCombo, ShortcutHandlers } from "./useKeyboardShortcuts.type";

const COMBOS: readonly string[] = ["mod+s", "mod+shift+s", "mod+o", "mod+p", "mod+z", "mod+shift+z", "mod+y"];

/**
 * Whether a string is a known shortcut combo.
 * @param {string} value - Combo text
 * @returns {boolean} - True for a known combo
 */
const _isShortcutCombo = (value: string): value is ShortcutCombo => COMBOS.includes(value);

/**
 * Translate a keydown into a combo name.
 * @param {KeyboardEvent} event - Keydown event
 * @returns {ShortcutCombo | null} - Combo, or null when it is not a known shortcut
 */
export const toShortcutCombo = (event: KeyboardEvent): ShortcutCombo | null => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) {
    return null;
  }

  const combo = `mod+${event.shiftKey ? "shift+" : ""}${event.key.toLowerCase()}`;

  return _isShortcutCombo(combo) ? combo : null;
};

/**
 * Global keyboard shortcuts; the browser default (e.g. "save page") is prevented for handled combos.
 * @param {ShortcutHandlers} handlers - Handler per combo (latest handlers are always used)
 * @returns {void}
 */
export const useKeyboardShortcuts = (handlers: ShortcutHandlers): void => {
  const handlersRef = useRef<ShortcutHandlers>(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    /**
     * Run the handler of a pressed shortcut.
     * @param {KeyboardEvent} event - Keydown event
     * @returns {void}
     */
    const handleKeyDown = (event: KeyboardEvent): void => {
      const combo = toShortcutCombo(event);
      const handler = combo ? handlersRef.current[combo] : undefined;

      if (handler) {
        event.preventDefault();
        handler();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return (): void => window.removeEventListener("keydown", handleKeyDown);
  }, []);
};
