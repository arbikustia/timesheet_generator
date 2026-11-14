/** Keyboard combos; `mod` is Ctrl on Windows/Linux and Cmd on macOS. */
export type ShortcutCombo = "mod+s" | "mod+shift+s" | "mod+o" | "mod+z" | "mod+shift+z";

export type ShortcutHandlers = Partial<Record<ShortcutCombo, () => void>>;
