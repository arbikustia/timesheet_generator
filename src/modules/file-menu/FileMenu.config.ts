import type { ConfirmableAction } from "./FileMenu.type";

/** Autosave debounce after the last change, in ms. */
export const AUTOSAVE_DELAY_MS = 1500;

/** Confirmation texts when unsaved changes would be discarded. */
export const CONFIRM_TITLES: Record<ConfirmableAction, string> = {
  new: "Buat dokumen baru?",
  open: "Buka dokumen lain?",
  "open-last": "Buka dokumen terakhir?",
};

export const ACCEPTED_DOCUMENT_TYPES = ".json,application/json";
