import type { ChangeEvent, RefObject } from "react";

import type { OpenedFile, RecoveredDraft } from "@/types/file.type";

export type FileNoticeType = "success" | "error" | "info";

/** Short feedback shown next to the file buttons. */
export type FileNotice = {
  type: FileNoticeType;
  text: string;
};

/** Actions that discard unsaved changes and therefore ask first. */
export type ConfirmableAction = "new" | "open" | "open-last";

export type SetFileNotice = (notice: FileNotice | null) => void;

export type FileOpenActions = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  createNew: () => void;
  openFile: () => Promise<void>;
  openLastFile: () => Promise<void>;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type FileSaveActions = {
  isSaving: boolean;
  save: () => Promise<void>;
  saveAs: () => Promise<void>;
};

export type PendingConfirm = {
  pendingConfirm: ConfirmableAction | null;
  request: (action: ConfirmableAction) => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
};

export type DraftRecovery = {
  draft: RecoveredDraft | null;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;
};

export type LastFile = {
  lastFileName: string | null;
  setLastFileName: (name: string | null) => void;
};

export type ApplyOpenedFile = (opened: OpenedFile) => void;

export type FileStatusInput = {
  fileName: string | null;
  isDirty: boolean;
  lastSavedAt: string | null;
  lastDraftAt: string | null;
};

export type FileMenuProps = {
  fileLabel: string;
  statusText: string;
  isDirty: boolean;
  isSaving: boolean;
  lastFileName: string | null;
  notice: FileNotice | null;
  pendingConfirm: ConfirmableAction | null;
  draft: RecoveredDraft | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onNew: () => void;
  onOpen: () => void;
  onOpenLast: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onFileInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
  onCancelConfirm: () => void;
  onRestoreDraft: () => void;
  onDiscardDraft: () => void;
  onDismissNotice: () => void;
};

export type FileMenuHandlers = PendingConfirm &
  Pick<FileMenuProps, "onNew" | "onOpen" | "onOpenLast" | "onSave" | "onSaveAs" | "isSaving">;
