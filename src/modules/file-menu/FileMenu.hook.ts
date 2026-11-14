import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";

import { getCurrentPeriod } from "@/libs/utils/date.util";
import { clearDraft, loadDraft, loadLastFileHandle, rememberFileHandle, saveDraft } from "@/libs/utils/draft-storage.util";
import { getCurrentFileHandle, setCurrentFileHandle } from "@/libs/utils/file-handle.registry";
import {
  downloadTextFile,
  ensureHandlePermission,
  hasHandlePermission,
  isFileSystemAccessSupported,
  openFileWithPicker,
  pickSaveHandle,
  readHandle,
  readInputFile,
  writeTextToHandle,
} from "@/libs/utils/file-system.util";
import { createEmptyDoc, getDefaultDocFileName, parseTimesheetDoc, serializeTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import type { DocumentFileHandle, OpenedFile, RecoveredDraft } from "@/types/file.type";
import type { TimesheetDoc } from "@/types/timesheet.type";

import { AUTOSAVE_DELAY_MS } from "./FileMenu.config";
import type {
  ApplyOpenedFile,
  ConfirmableAction,
  DraftRecovery,
  FileMenuHandlers,
  FileMenuProps,
  FileNotice,
  FileOpenActions,
  FileSaveActions,
  LastFile,
  PendingConfirm,
  SetFileNotice,
} from "./FileMenu.type";
import { getFileStatusText, toErrorMessage } from "./FileMenu.util";

import { resetFile, selectFile, setFileInfo, setLastSavedAt } from "@/store/file.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadDoc, markSaved, restoreDraft, selectDoc, selectIsDirty } from "@/store/timesheet.slice";

/**
 * Name of the last remembered file (Chromium only), loaded once.
 * @returns {LastFile} - Name and setter
 */
export const useLastFile = (): LastFile => {
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  useEffect(() => {
    if (!isFileSystemAccessSupported()) {
      return;
    }

    void loadLastFileHandle().then((handle) => setLastFileName(handle?.name ?? null));
  }, []);

  return { lastFileName, setLastFileName };
};

/**
 * Validate an opened file and load it as the current document.
 * @param {SetFileNotice} setNotice - Feedback setter
 * @param {LastFile["setLastFileName"]} setLastFileName - Updates "Buka terakhir"
 * @returns {ApplyOpenedFile} - Loader
 */
export const useApplyOpenedFile = (setNotice: SetFileNotice, setLastFileName: LastFile["setLastFileName"]): ApplyOpenedFile => {
  const dispatch = useAppDispatch();

  return useCallback(
    (opened: OpenedFile): void => {
      const result = parseTimesheetDoc(opened.text);

      if (!result.isOk) {
        setNotice({ type: "error", text: [`Gagal membuka ${opened.name}: ${result.message}`, ...result.issues.slice(0, 3)].join(" ") });

        return;
      }

      dispatch(loadDoc(result.doc));
      setCurrentFileHandle(opened.handle);
      dispatch(setFileInfo({ fileName: opened.name, hasHandle: opened.handle !== null }));
      setNotice({ type: "success", text: `Dibuka: ${opened.name}` });
      void clearDraft();

      if (opened.handle) {
        void rememberFileHandle(opened.handle);
        setLastFileName(opened.name);
      }
    },
    [dispatch, setLastFileName, setNotice],
  );
};

/**
 * Run an async file action and report failures.
 * @param {() => Promise<void>} action - Action
 * @param {SetFileNotice} setNotice - Feedback setter
 * @param {string} prefix - Message prefix
 * @returns {Promise<void>} - Resolves after the action or the error notice
 */
export const runFileAction = async (action: () => Promise<void>, setNotice: SetFileNotice, prefix: string): Promise<void> => {
  try {
    await action();
  } catch (error) {
    setNotice({ type: "error", text: `${prefix}: ${toErrorMessage(error instanceof Error ? error : String(error))}` });
  }
};

/**
 * New, open (picker or fallback input) and "Buka terakhir".
 * @param {ApplyOpenedFile} applyOpened - Loader of an opened file
 * @param {SetFileNotice} setNotice - Feedback setter
 * @returns {FileOpenActions} - Open actions
 */
export const useFileOpen = (applyOpened: ApplyOpenedFile, setNotice: SetFileNotice): FileOpenActions => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Start an empty document for the current month.
   * @returns {void}
   */
  const createNew = (): void => {
    dispatch(loadDoc(createEmptyDoc(getCurrentPeriod())));
    setCurrentFileHandle(null);
    dispatch(resetFile());
    setNotice(null);
    void clearDraft();
  };

  /**
   * Open with the File System Access picker, or the hidden file input as fallback.
   * @returns {Promise<void>} - Resolves when done
   */
  const openFile = (): Promise<void> =>
    runFileAction(
      async () => {
        if (!isFileSystemAccessSupported()) {
          fileInputRef.current?.click();

          return;
        }

        const opened = await openFileWithPicker();

        if (opened) {
          applyOpened(opened);
        }
      },
      setNotice,
      "Gagal membuka",
    );

  return {
    fileInputRef,
    createNew,
    openFile,
    openLastFile: useOpenLastFile(applyOpened, setNotice),
    onFileInputChange: useFileInputChange(applyOpened, setNotice),
  };
};

/**
 * "Buka terakhir": re-open the remembered file, asking for permission again when needed.
 * @param {ApplyOpenedFile} applyOpened - Loader of an opened file
 * @param {SetFileNotice} setNotice - Feedback setter
 * @returns {() => Promise<void>} - Action
 */
export const useOpenLastFile = (applyOpened: ApplyOpenedFile, setNotice: SetFileNotice): (() => Promise<void>) => {
  return (): Promise<void> =>
    runFileAction(
      async () => {
        const handle = await loadLastFileHandle();

        if (!handle || !(await ensureHandlePermission(handle, "readwrite"))) {
          setNotice({ type: "error", text: "Izin akses file terakhir ditolak atau file tidak ditemukan." });

          return;
        }

        applyOpened(await readHandle(handle));
      },
      setNotice,
      "Gagal membuka file terakhir",
    );
};

/**
 * Change handler of the fallback `<input type="file">`.
 * @param {ApplyOpenedFile} applyOpened - Loader of an opened file
 * @param {SetFileNotice} setNotice - Feedback setter
 * @returns {(event: ChangeEvent<HTMLInputElement>) => void} - Handler
 */
export const useFileInputChange = (
  applyOpened: ApplyOpenedFile,
  setNotice: SetFileNotice,
): ((event: ChangeEvent<HTMLInputElement>) => void) => {
  return (event: ChangeEvent<HTMLInputElement>): void => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    input.value = "";

    if (file) {
      void runFileAction(async () => applyOpened(await readInputFile(file)), setNotice, "Gagal membuka");
    }
  };
};

/**
 * Write the document to a handle and mark it saved.
 * @param {DocumentFileHandle} handle - Target file
 * @param {TimesheetDoc} doc - Document to write
 * @param {ReturnType<typeof useAppDispatch>} dispatch - Store dispatch
 * @returns {Promise<void>} - Resolves when written
 */
export const writeDocToHandle = async (
  handle: DocumentFileHandle,
  doc: TimesheetDoc,
  dispatch: ReturnType<typeof useAppDispatch>,
): Promise<void> => {
  await writeTextToHandle(handle, serializeTimesheetDoc(doc));
  dispatch(markSaved(doc));
  dispatch(setLastSavedAt(new Date().toISOString()));
  await clearDraft();
};

/**
 * "Simpan Sebagai": save dialog on Chromium, download on other browsers.
 * @param {TimesheetDoc} doc - Document
 * @param {string | null} fileName - Current file name
 * @param {ReturnType<typeof useAppDispatch>} dispatch - Store dispatch
 * @returns {Promise<string | null>} - Saved file name, or null when cancelled
 */
export const saveDocAs = async (
  doc: TimesheetDoc,
  fileName: string | null,
  dispatch: ReturnType<typeof useAppDispatch>,
): Promise<string | null> => {
  const name = fileName ?? getDefaultDocFileName(doc);

  if (!isFileSystemAccessSupported()) {
    downloadTextFile(serializeTimesheetDoc(doc), name);
    dispatch(setFileInfo({ fileName: name, hasHandle: false }));
    dispatch(markSaved(doc));
    dispatch(setLastSavedAt(new Date().toISOString()));
    await clearDraft();

    return name;
  }

  const handle = await pickSaveHandle(name);

  if (!handle) {
    return null;
  }

  await writeDocToHandle(handle, doc, dispatch);
  setCurrentFileHandle(handle);
  dispatch(setFileInfo({ fileName: handle.name, hasHandle: true }));
  await rememberFileHandle(handle);

  return handle.name;
};

/**
 * "Simpan" (in place when a handle exists) and "Simpan Sebagai".
 * @param {SetFileNotice} setNotice - Feedback setter
 * @param {LastFile["setLastFileName"]} setLastFileName - Updates "Buka terakhir"
 * @returns {FileSaveActions} - Save actions
 */
export const useFileSave = (setNotice: SetFileNotice, setLastFileName: LastFile["setLastFileName"]): FileSaveActions => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);
  const { fileName } = useAppSelector(selectFile);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  /**
   * Save as a new file.
   * @returns {Promise<void>} - Resolves when done
   */
  const saveAs = async (): Promise<void> => {
    setIsSaving(true);
    await runFileAction(
      async () => {
        const name = await saveDocAs(doc, fileName, dispatch);

        if (name) {
          setNotice({ type: "success", text: `Tersimpan: ${name}` });
          setLastFileName(isFileSystemAccessSupported() ? name : null);
        }
      },
      setNotice,
      "Gagal menyimpan",
    );
    setIsSaving(false);
  };

  return { isSaving, save: useSaveInPlace(saveAs, setNotice, setIsSaving), saveAs };
};

/**
 * Save to the current handle without a dialog; falls back to "Simpan Sebagai".
 * @param {() => Promise<void>} saveAs - Save-as action
 * @param {SetFileNotice} setNotice - Feedback setter
 * @param {(isSaving: boolean) => void} setIsSaving - Busy setter
 * @returns {() => Promise<void>} - Save action
 */
export const useSaveInPlace = (
  saveAs: () => Promise<void>,
  setNotice: SetFileNotice,
  setIsSaving: (isSaving: boolean) => void,
): (() => Promise<void>) => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);

  return async (): Promise<void> => {
    const handle = getCurrentFileHandle();

    if (!handle) {
      await saveAs();

      return;
    }

    setIsSaving(true);
    await runFileAction(
      async () => {
        if (!(await ensureHandlePermission(handle, "readwrite"))) {
          throw new Error("izin menulis file ditolak");
        }

        await writeDocToHandle(handle, doc, dispatch);
        setNotice({ type: "success", text: `Tersimpan: ${handle.name}` });
      },
      setNotice,
      "Gagal menyimpan",
    );
    setIsSaving(false);
  };
};

/**
 * Ask before discarding unsaved changes.
 * @param {boolean} isDirty - Unsaved changes exist
 * @param {Record<ConfirmableAction, () => void>} actions - Action per kind
 * @returns {PendingConfirm} - Pending action and handlers
 */
export const usePendingConfirm = (isDirty: boolean, actions: Record<ConfirmableAction, () => void>): PendingConfirm => {
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmableAction | null>(null);

  /**
   * Run now when clean, otherwise ask first.
   * @param {ConfirmableAction} action - Requested action
   * @returns {void}
   */
  const request = (action: ConfirmableAction): void => {
    if (isDirty) {
      setPendingConfirm(action);

      return;
    }

    actions[action]();
  };

  /**
   * Run the pending action.
   * @returns {void}
   */
  const handleConfirm = (): void => {
    if (pendingConfirm) {
      actions[pendingConfirm]();
    }

    setPendingConfirm(null);
  };

  /**
   * Close the dialog without changes.
   * @returns {void}
   */
  const handleCancel = (): void => setPendingConfirm(null);

  return { pendingConfirm, request, onConfirm: handleConfirm, onCancelConfirm: handleCancel };
};

/**
 * Autosave 1.5s after the last change: to the open file when write permission is already granted,
 * otherwise to the recovery draft in IndexedDB.
 * @returns {string | null} - ISO time of the last draft write
 */
export const useAutosave = (): string | null => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);
  const isDirty = useAppSelector(selectIsDirty);
  const [lastDraftAt, setLastDraftAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isDirty) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      const handle = getCurrentFileHandle();

      void (async (): Promise<void> => {
        if (handle && (await hasHandlePermission(handle, "readwrite"))) {
          await writeDocToHandle(handle, doc, dispatch).catch(() => saveDraft(doc));

          return;
        }

        await saveDraft(doc);
        setLastDraftAt(new Date().toISOString());
      })();
    }, AUTOSAVE_DELAY_MS);

    return (): void => window.clearTimeout(timer);
  }, [dispatch, doc, isDirty]);

  return lastDraftAt;
};

/**
 * Offer to restore an unsaved draft found at start-up.
 * @returns {DraftRecovery} - Draft and handlers
 */
export const useDraftRecovery = (): DraftRecovery => {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState<RecoveredDraft | null>(null);

  useEffect(() => {
    void loadDraft().then(setDraft);
  }, []);

  /**
   * Restore the draft as unsaved changes.
   * @returns {void}
   */
  const handleRestore = (): void => {
    if (draft) {
      dispatch(restoreDraft(draft.doc));
    }

    setDraft(null);
  };

  /**
   * Discard the draft.
   * @returns {void}
   */
  const handleDiscard = (): void => {
    void clearDraft();
    setDraft(null);
  };

  return { draft, onRestoreDraft: handleRestore, onDiscardDraft: handleDiscard };
};

/**
 * Button handlers: sync wrappers around the async actions, routed through the unsaved-changes check.
 * @param {FileOpenActions} opener - Open actions
 * @param {FileSaveActions} saver - Save actions
 * @param {boolean} isDirty - Unsaved changes exist
 * @returns {FileMenuHandlers} - Button handlers and confirmation state
 */
export const useFileMenuHandlers = (opener: FileOpenActions, saver: FileSaveActions, isDirty: boolean): FileMenuHandlers => {
  /**
   * Open a document.
   * @returns {void}
   */
  const handleOpenNow = (): void => void opener.openFile();

  /**
   * Open the last document.
   * @returns {void}
   */
  const handleOpenLastNow = (): void => void opener.openLastFile();

  const confirm = usePendingConfirm(isDirty, { new: opener.createNew, open: handleOpenNow, "open-last": handleOpenLastNow });

  /**
   * Save in place.
   * @returns {void}
   */
  const handleSave = (): void => void saver.save();

  /**
   * Save as a new file.
   * @returns {void}
   */
  const handleSaveAs = (): void => void saver.saveAs();

  /**
   * "Baru" button.
   * @returns {void}
   */
  const handleNew = (): void => confirm.request("new");

  /**
   * "Buka" button.
   * @returns {void}
   */
  const handleOpen = (): void => confirm.request("open");

  /**
   * "Buka terakhir" button.
   * @returns {void}
   */
  const handleOpenLast = (): void => confirm.request("open-last");

  return {
    ...confirm,
    isSaving: saver.isSaving,
    onNew: handleNew,
    onOpen: handleOpen,
    onOpenLast: handleOpenLast,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
  };
};

/**
 * Word-like file menu: New / Open / Open last / Save / Save As, shortcuts, autosave, draft recovery
 * and the leave-page warning.
 * @returns {FileMenuProps} - Values and handlers for the file menu
 */
export const useFileMenu = (): FileMenuProps => {
  const isDirty = useAppSelector(selectIsDirty);
  const file = useAppSelector(selectFile);
  const [notice, setNotice] = useState<FileNotice | null>(null);
  const { lastFileName, setLastFileName } = useLastFile();
  const opener = useFileOpen(useApplyOpenedFile(setNotice, setLastFileName), setNotice);
  const handlers = useFileMenuHandlers(opener, useFileSave(setNotice, setLastFileName), isDirty);
  const lastDraftAt = useAutosave();

  /**
   * Hide the feedback message.
   * @returns {void}
   */
  const handleDismissNotice = (): void => setNotice(null);

  useKeyboardShortcuts({ "mod+s": handlers.onSave, "mod+shift+s": handlers.onSaveAs, "mod+o": handlers.onOpen });
  useBeforeUnload(isDirty);

  return {
    fileLabel: file.fileName ?? "Dokumen baru",
    statusText: getFileStatusText({ fileName: file.fileName, isDirty, lastSavedAt: file.lastSavedAt, lastDraftAt }),
    isDirty,
    lastFileName,
    notice,
    fileInputRef: opener.fileInputRef,
    onFileInputChange: opener.onFileInputChange,
    onDismissNotice: handleDismissNotice,
    ...handlers,
    ...useDraftRecovery(),
  };
};
