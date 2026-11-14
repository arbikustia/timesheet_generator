import type { DocumentFileHandle } from "@/types/file.type";

/**
 * The open document's file handle. Handles are not serializable, so they live here instead of Redux;
 * the store only keeps `hasHandle` and the file name.
 */
let currentHandle: DocumentFileHandle | null = null;

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
