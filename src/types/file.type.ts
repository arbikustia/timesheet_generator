import type { TimesheetDoc } from "./timesheet.type";

/** A document file read from disk; `handle` is null when opened through the fallback input. */
export type OpenedFile = {
  name: string;
  text: string;
  handle: DocumentFileHandle | null;
};

/** A recovery draft kept in IndexedDB until the document is saved to a file. */
export type DraftRecord = {
  savedAt: string;
  text: string;
};

/** A draft parsed back into a document. */
export type RecoveredDraft = {
  savedAt: string;
  doc: TimesheetDoc;
};

/** What saving needs from a file handle (a `FileSystemFileHandle` satisfies it). */
export type WritableFileTarget = {
  createWritable(): Promise<Pick<FileSystemWritableFileStream, "write" | "close">>;
};

/** What permission checks need from a handle. */
export type PermissionTarget = Pick<FileSystemHandle, "queryPermission" | "requestPermission">;

/**
 * The parts of a `FileSystemFileHandle` the app uses (read, write, permissions).
 * Real handles satisfy it structurally; test fakes can implement it without type assertions.
 */
export type DocumentFileHandle = Pick<FileSystemFileHandle, "name" | "getFile"> & WritableFileTarget & PermissionTarget;

export type ImageSize = {
  width: number;
  height: number;
};

/** A decoded image ready to draw; `release` frees decoder resources. */
export type LoadedImage = ImageSize & {
  source: CanvasImageSource;
  release: () => void;
};

/** A processed evidence image (always JPEG, already blurred when requested). */
export type ProcessedImage = {
  dataUrl: string;
  mime: string;
  w: number;
  h: number;
};

export type ProcessImageOptions = {
  shouldBlur: boolean;
};

/** Anything that carries files: `DataTransfer` (clipboard, drop) or a file input. */
export type FileCarrier = {
  files: ArrayLike<File> | null;
};
