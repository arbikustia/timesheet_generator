import type { DocumentFileHandle } from "@/types/file.type";

/**
 * The open document's file handle. Handles are not serializable, so they live here instead of Redux;
 * the store only keeps `hasHandle` and the file name.
 */
let currentHandle: DocumentFileHandle | null = null;

/** `lastModified` of the current file as last read or written by the app; null when unknown. */
let knownModified: number | null = null;

/**
 * Current file handle.
 * @returns {DocumentFileHandle | null} - Handle, or null when the document has no file yet
 */
export const getCurrentFileHandle = (): DocumentFileHandle | null => currentHandle;

/**
 * Replace the current file handle.
 * @param {DocumentFileHandle | null} handle - New handle
 * @returns {void}
 */
export const setCurrentFileHandle = (handle: DocumentFileHandle | null): void => {
  currentHandle = handle;
};

/**
 * `lastModified` of the current file as the app last saw it.
 * @returns {number | null} - Timestamp, or null when unknown
 */
export const getKnownModified = (): number | null => knownModified;

/**
 * Remember the `lastModified` of the current file after reading or writing it.
 * @param {number | null} value - Timestamp, or null when unknown (e.g. a new file)
 * @returns {void}
 */
export const setKnownModified = (value: number | null): void => {
  knownModified = value;
};
