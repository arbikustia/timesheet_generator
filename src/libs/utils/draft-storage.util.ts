import { del, get, set } from "idb-keyval";

import type { DocumentFileHandle, DraftRecord, RecoveredDraft } from "@/types/file.type";
import type { TimesheetDoc } from "@/types/timesheet.type";

import { parseTimesheetDoc, serializeTimesheetDoc } from "./timesheet-document.util";

/** IndexedDB keys. This is only a local browser buffer, not an application database. */
export const STORAGE_KEYS = {
  DRAFT: "timesheet-builder:draft",
  LAST_FILE_HANDLE: "timesheet-builder:last-file-handle",
} as const;

/**
 * Run a storage call and swallow failures (private mode, IndexedDB disabled, quota),
 * including synchronous throws when IndexedDB does not exist.
 * @param {() => Promise<T>} operation - Storage call
 * @returns {Promise<T | undefined>} - Result, or undefined on failure
 */
export const _attempt = async <T>(operation: () => Promise<T>): Promise<T | undefined> => {
  try {
    return await operation();
  } catch {
    return undefined;
  }
};

/**
 * Store a recovery draft.
 * @param {TimesheetDoc} doc - Current document
 * @param {Date} [now=new Date()] - Timestamp
 * @returns {Promise<void>} - Resolves when stored or ignored
 */
export const saveDraft = async (doc: TimesheetDoc, now: Date = new Date()): Promise<void> => {
  const record: DraftRecord = { savedAt: now.toISOString(), text: serializeTimesheetDoc(doc) };

  await _attempt(() => set(STORAGE_KEYS.DRAFT, record));
};

/**
 * Remove the recovery draft.
 * @returns {Promise<void>} - Resolves when removed or ignored
 */
export const clearDraft = async (): Promise<void> => {
  await _attempt(() => del(STORAGE_KEYS.DRAFT));
};

/**
 * Load the recovery draft; an unreadable draft is discarded.
 * @returns {Promise<RecoveredDraft | null>} - Draft, or null when none is usable
 */
export const loadDraft = async (): Promise<RecoveredDraft | null> => {
  const record = await _attempt(() => get<DraftRecord>(STORAGE_KEYS.DRAFT));

  if (!record) {
    return null;
  }

  const result = parseTimesheetDoc(record.text);

  if (!result.isOk) {
    await clearDraft();

    return null;
  }

  return { savedAt: record.savedAt, doc: result.doc };
};

/**
 * Remember the last file for "Buka terakhir" (handles are structured-cloneable in Chromium).
 * @param {DocumentFileHandle} handle - File handle
 * @returns {Promise<void>} - Resolves when stored or ignored
 */
export const rememberFileHandle = async (handle: DocumentFileHandle): Promise<void> => {
  await _attempt(() => set(STORAGE_KEYS.LAST_FILE_HANDLE, handle));
};

/**
 * Last remembered file handle.
 * @returns {Promise<DocumentFileHandle | null>} - Handle, or null
 */
export const loadLastFileHandle = async (): Promise<DocumentFileHandle | null> => {
  const handle = await _attempt(() => get<DocumentFileHandle>(STORAGE_KEYS.LAST_FILE_HANDLE));

  return handle ?? null;
};
