import { type ChangeEvent, type ClipboardEvent, type DragEvent, type MouseEvent, type SyntheticEvent, useMemo, useState } from "react";
import type { CheckboxChangeEvent } from "antd";

import { estimateDocumentBytes, formatBytes } from "@/libs/utils/document-size.util";
import { isAcceptedImage } from "@/libs/utils/file.util";
import { dataUrlToBlob, getImageFiles, processEvidenceImage } from "@/libs/utils/image.util";
import { createId } from "@/libs/utils/timesheet-mutation.util";

import { MAX_DOCUMENT_BYTES } from "@/constants/image.constant";
import { EVIDENCE_MAX_PER_DATE } from "@/constants/timesheet.constant";
import type { Evidence } from "@/types/timesheet.type";

import type {
  EvidenceImageActions,
  EvidenceInputHandlers,
  EvidencePanelProps,
  EvidenceUpload,
  SetEvidenceError,
} from "./EvidencePanel.type";
import { buildEvidenceBlocks, getPasteTargetDate } from "./EvidencePanel.util";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addEvidence, removeEvidence, replaceEvidence, selectDoc, swapEvidence } from "@/store/timesheet.slice";

/**
 * Turn a file into a stored evidence image (resized, compressed, blurred when it is code).
 * @param {Blob} file - Source image
 * @param {string} name - File name to keep
 * @param {boolean} isCode - Screenshot of code (blurred before it ever reaches the document)
 * @param {string} [id=createId()] - Image id (kept when replacing)
 * @returns {Promise<Evidence>} - Evidence image
 */
export const createEvidence = async (file: Blob, name: string, isCode: boolean, id: string = createId()): Promise<Evidence> => {
  const processed = await processEvidenceImage(file, { shouldBlur: isCode });

  return { id, name, ...processed, sensitivity: isCode ? "code" : "plain", blurred: isCode };
};

/**
 * Keep accepted images and the number of free slots; report what was skipped.
 * @param {File[]} files - Candidate files
 * @param {number} freeSlots - Free slots on the date
 * @param {SetEvidenceError} setError - Error setter
 * @returns {File[]} - Files to process
 */
export const selectUploadFiles = (files: File[], freeSlots: number, setError: SetEvidenceError): File[] => {
  const images = files.filter(isAcceptedImage);

  if (images.length < files.length) {
    setError("Gunakan gambar PNG, JPG atau WebP.");
  }

  if (images.length > freeSlots) {
    setError(`Maksimal ${EVIDENCE_MAX_PER_DATE} gambar per tanggal.`);
  }

  return images.slice(0, Math.max(0, freeSlots));
};

/**
 * Add and replace images; processing happens in the browser only.
 * @param {SetEvidenceError} setError - Error setter
 * @returns {EvidenceUpload} - Upload actions and dates being processed
 */
export const useEvidenceUpload = (setError: SetEvidenceError): EvidenceUpload => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);
  const [processingDates, setProcessingDates] = useState<string[]>([]);

  /**
   * Run an image job for a date while flagging it as processing.
   * @param {string} date - ISO date
   * @param {() => Promise<void>} job - Work
   * @returns {Promise<void>} - Resolves when done (errors become a message)
   */
  const runForDate = async (date: string, job: () => Promise<void>): Promise<void> => {
    setProcessingDates((prev) => [...prev, date]);

    try {
      await job();
    } catch (error) {
      setError(`Gagal memproses gambar: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProcessingDates((prev) => prev.filter((item) => item !== date));
    }
  };

  /**
   * Add images to the free slots of a date.
   * @param {string} date - ISO date
   * @param {File[]} files - Images
   * @param {boolean} isCode - Code screenshots (blurred)
   * @returns {Promise<void>} - Resolves when stored
   */
  const addFiles = async (date: string, files: File[], isCode: boolean): Promise<void> => {
    setError(null);
    const selected = selectUploadFiles(files, EVIDENCE_MAX_PER_DATE - (doc.evidence[date]?.length ?? 0), setError);

    await runForDate(date, async () => {
      for (const file of selected) {
        dispatch(addEvidence({ date, image: await createEvidence(file, file.name || `clipboard-${date}.jpg`, isCode) }));
      }
    });
  };

  /**
   * Replace one image, keeping its slot.
   * @param {string} date - ISO date
   * @param {string} id - Image id
   * @param {File} file - New image
   * @param {boolean} isCode - Code screenshot (blurred)
   * @returns {Promise<void>} - Resolves when stored
   */
  const replaceFile = async (date: string, id: string, file: File, isCode: boolean): Promise<void> => {
    setError(isAcceptedImage(file) ? null : "Gunakan gambar PNG, JPG atau WebP.");

    if (isAcceptedImage(file)) {
      await runForDate(date, async () => {
        dispatch(replaceEvidence({ date, id, image: await createEvidence(file, file.name, isCode, id) }));
      });
    }
  };

  return { processingDates, addFiles, replaceFile };
};

/**
 * Remove, swap and blur buttons; targets come from `data-date` / `data-id`.
 * @param {SetEvidenceError} setError - Error setter
 * @returns {EvidenceImageActions} - Handlers
 */
export const useEvidenceImageActions = (setError: SetEvidenceError): EvidenceImageActions => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);

  /**
   * Remove an image.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleRemove = (event: MouseEvent<HTMLElement>): void => {
    const { date, id } = event.currentTarget.dataset;

    if (date && id) {
      dispatch(removeEvidence({ date, id }));
    }
  };

  /**
   * Swap left and right images.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleSwap = (event: MouseEvent<HTMLElement>): void => {
    const { date } = event.currentTarget.dataset;

    if (date) {
      dispatch(swapEvidence(date));
    }
  };

  /**
   * Blur a plain image in full (the unblurred version is discarded).
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleBlurImage = (event: MouseEvent<HTMLElement>): void => {
    const { date, id } = event.currentTarget.dataset;
    const image = date ? doc.evidence[date]?.find((item) => item.id === id) : undefined;

    if (date && image) {
      void createEvidence(dataUrlToBlob(image.dataUrl), image.name, true, image.id)
        .then((blurred) => dispatch(replaceEvidence({ date, id: image.id, image: blurred })))
        .catch((error: Error) => setError(`Gagal memproses gambar: ${error.message}`));
    }
  };

  return { onRemove: handleRemove, onSwap: handleSwap, onBlurImage: handleBlurImage };
};

/**
 * Selecting a date, pasting, dropping and choosing files.
 * @param {EvidenceUpload} upload - Upload actions
 * @param {EvidencePanelProps["blocks"]} blocks - Evidence blocks
 * @param {boolean} isCodeUpload - Treat chosen/dropped files as code screenshots
 * @param {(date: string) => void} setActiveDate - Active date setter
 * @returns {EvidenceInputHandlers} - Handlers
 */
export const useEvidenceInputs = (
  upload: EvidenceUpload,
  blocks: EvidencePanelProps["blocks"],
  isCodeUpload: boolean,
  setActiveDate: (date: string) => void,
): EvidenceInputHandlers => {
  /**
   * Mark the date as the paste target.
   * @param {SyntheticEvent<HTMLElement>} event - Click or focus event
   * @returns {void}
   */
  const handleActivate = (event: SyntheticEvent<HTMLElement>): void => {
    const { date } = event.currentTarget.dataset;

    if (date) {
      setActiveDate(date);
    }
  };

  /**
   * Paste screenshots into the active date; pasted images are always treated as code and blurred.
   * @param {ClipboardEvent<HTMLElement>} event - Paste event
   * @returns {void}
   */
  const handlePaste = (event: ClipboardEvent<HTMLElement>): void => {
    const files = getImageFiles(event.clipboardData);
    const target = getPasteTargetDate(blocks, blocks.find((block) => block.isActive)?.date ?? null);

    if (files.length === 0 || !target) {
      return;
    }

    event.preventDefault();
    setActiveDate(target);
    void upload.addFiles(target, files, true);
  };

  return { onActivate: handleActivate, onPaste: handlePaste, ...useEvidenceFileInputs(upload, isCodeUpload) };
};

/**
 * File input and drag-and-drop handlers.
 * @param {EvidenceUpload} upload - Upload actions
 * @param {boolean} isCodeUpload - Treat files as code screenshots
 * @returns {Pick<EvidenceInputHandlers, "onFileChange" | "onDrop" | "onDragOver">} - Handlers
 */
export const useEvidenceFileInputs = (
  upload: EvidenceUpload,
  isCodeUpload: boolean,
): Pick<EvidenceInputHandlers, "onFileChange" | "onDrop" | "onDragOver"> => {
  /**
   * Add or replace from a file input (`data-replace-id` marks a replacement).
   * @param {ChangeEvent<HTMLInputElement>} event - Change event
   * @returns {void}
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const input = event.currentTarget;
    const { date, replaceId } = input.dataset;
    const files = Array.from(input.files ?? []);

    input.value = "";

    if (!date || files.length === 0) {
      return;
    }

    void (replaceId ? upload.replaceFile(date, replaceId, files[0], isCodeUpload) : upload.addFiles(date, files, isCodeUpload));
  };

  /**
   * Add dropped files.
   * @param {DragEvent<HTMLElement>} event - Drop event
   * @returns {void}
   */
  const handleDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();
    const { date } = event.currentTarget.dataset;

    if (date) {
      void upload.addFiles(date, Array.from(event.dataTransfer.files), isCodeUpload);
    }
  };

  return { onFileChange: handleFileChange, onDrop: handleDrop, onDragOver: _allowDrop };
};

/**
 * Allow dropping files on a slot.
 * @param {DragEvent<HTMLElement>} event - Drag-over event
 * @returns {void}
 */
const _allowDrop = (event: DragEvent<HTMLElement>): void => event.preventDefault();

/**
 * Evidence per date: upload, paste, drag & drop, replace, swap, blur and the document size.
 * @returns {EvidencePanelProps} - Values and handlers
 */
export const useEvidencePanel = (): EvidencePanelProps => {
  const doc = useAppSelector(selectDoc);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [isCodeUpload, setIsCodeUpload] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const upload = useEvidenceUpload(setError);
  const blocks = useMemo(() => buildEvidenceBlocks(doc, activeDate, upload.processingDates), [doc, activeDate, upload.processingDates]);
  const bytes = useMemo(() => estimateDocumentBytes(doc), [doc]);

  /**
   * Toggle "uploads are code screenshots".
   * @param {CheckboxChangeEvent} event - Checkbox event
   * @returns {void}
   */
  const handleToggleCodeUpload = (event: CheckboxChangeEvent): void => setIsCodeUpload(event.target.checked);

  /**
   * Hide the error message.
   * @returns {void}
   */
  const handleDismissError = (): void => setError(null);

  return {
    blocks,
    sizeLabel: formatBytes(bytes),
    isTooLarge: bytes > MAX_DOCUMENT_BYTES,
    error,
    isCodeUpload,
    onToggleCodeUpload: handleToggleCodeUpload,
    onDismissError: handleDismissError,
    ...useEvidenceImageActions(setError),
    ...useEvidenceInputs(upload, blocks, isCodeUpload, setActiveDate),
  };
};
