import type { DocumentFileHandle, OpenedFile, PermissionTarget, WritableFileTarget } from "@/types/file.type";

import { readFileAsText } from "./file.util";

/** Picker filter for document files. */
export const JSON_PICKER_TYPES: FilePickerAcceptType[] = [
  { description: "Dokumen Timesheet", accept: { "application/json": [".json"] } },
];

/**
 * Whether the browser can open and save files in place (File System Access API, Chromium).
 * Feature detection only, never user-agent sniffing.
 * @returns {boolean} - True when both pickers exist
 */
export const isFileSystemAccessSupported = (): boolean => {
  return typeof window.showOpenFilePicker === "function" && typeof window.showSaveFilePicker === "function";
};

/**
 * Run a picker and treat "user cancelled" as null instead of an error.
 * @param {() => Promise<T>} picker - Picker call
 * @returns {Promise<T | null>} - Picker result, or null when cancelled
 */
export const runPicker = async <T>(picker: () => Promise<T>): Promise<T | null> => {
  try {
    return await picker();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }

    throw error;
  }
};

/**
 * Read a picked or remembered handle.
 * @param {DocumentFileHandle} handle - File handle
 * @returns {Promise<OpenedFile>} - Name, text and the handle
 */
export const readHandle = async (handle: DocumentFileHandle): Promise<OpenedFile> => {
  const file = await handle.getFile();

  return { name: file.name, text: await readFileAsText(file), handle };
};

/**
 * Show the open dialog and read the chosen file.
 * @returns {Promise<OpenedFile | null>} - File, or null when cancelled
 */
export const openFileWithPicker = async (): Promise<OpenedFile | null> => {
  const handles = await runPicker(() => window.showOpenFilePicker?.({ types: JSON_PICKER_TYPES }) ?? Promise.resolve([]));
  const [handle] = handles ?? [];

  return handle ? readHandle(handle) : null;
};

/**
 * Show the save dialog.
 * @param {string} suggestedName - Default file name
 * @returns {Promise<FileSystemFileHandle | null>} - Chosen handle, or null when cancelled
 */
export const pickSaveHandle = async (suggestedName: string): Promise<FileSystemFileHandle | null> => {
  const handle = await runPicker(() => window.showSaveFilePicker?.({ suggestedName, types: JSON_PICKER_TYPES }) ?? Promise.resolve(null));

  return handle ?? null;
};

/**
 * Overwrite a file with text.
 * @param {WritableFileTarget} handle - Target file
 * @param {string} text - New contents
 * @returns {Promise<void>} - Resolves when written and closed
 */
export const writeTextToHandle = async (handle: WritableFileTarget, text: string): Promise<void> => {
  const writable = await handle.createWritable();

  await writable.write(text);
  await writable.close();
};

/**
 * Whether a handle already has permission (never prompts; safe for autosave).
 * @param {PermissionTarget} handle - File handle
 * @param {FileSystemPermissionMode} mode - Permission mode
 * @returns {Promise<boolean>} - True when granted (or the browser has no permission model)
 */
export const hasHandlePermission = async (handle: PermissionTarget, mode: FileSystemPermissionMode): Promise<boolean> => {
  if (!handle.queryPermission) {
    return true;
  }

  return (await handle.queryPermission({ mode })) === "granted";
};

/**
 * Make sure a handle has permission, prompting the user when needed (call from a user gesture).
 * @param {PermissionTarget} handle - File handle
 * @param {FileSystemPermissionMode} mode - Permission mode
 * @returns {Promise<boolean>} - True when granted
 */
export const ensureHandlePermission = async (handle: PermissionTarget, mode: FileSystemPermissionMode): Promise<boolean> => {
  if (await hasHandlePermission(handle, mode)) {
    return true;
  }

  return (await handle.requestPermission?.({ mode })) === "granted";
};

/**
 * Read a file chosen through `<input type="file">` (fallback browsers).
 * @param {File} file - Chosen file
 * @returns {Promise<OpenedFile>} - Name and text without a handle
 */
export const readInputFile = async (file: File): Promise<OpenedFile> => {
  return { name: file.name, text: await readFileAsText(file), handle: null };
};

/**
 * Save text by downloading it (fallback browsers).
 * @param {string} text - File contents
 * @param {string} fileName - Download name
 * @returns {void}
 */
export const downloadTextFile = (text: string, fileName: string): void => {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
