export type FileState = {
  /** Name of the file the document was opened from or saved to. */
  fileName: string | null;
  /** True when a File System Access handle allows saving in place. */
  hasHandle: boolean;
  /** ISO time of the last successful save to a file. */
  lastSavedAt: string | null;
};

export type FileInfoPayload = {
  fileName: string | null;
  hasHandle: boolean;
};
