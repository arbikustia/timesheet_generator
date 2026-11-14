import { type ChangeEvent, type ClipboardEvent, type DragEvent, type MouseEvent, type SyntheticEvent, useMemo, useState } from "react";
import type { CheckboxChangeEvent } from "antd";

import { estimateDocumentBytes, formatBytes } from "@/libs/utils/document-size.util";
import { isAcceptedImage } from "@/libs/utils/file.util";
import { dataUrlToBlob, getImageFiles, processEvidenceImage } from "@/libs/utils/image.util";
import { createId } from "@/libs/utils/timesheet-mutation.util";

import { MAX_DOCUMENT_BYTES } from "@/constants/image.constant";
import { EVIDENCE_MAX_PER_DATE } from "@/constants/timesheet.constant";
import type { BlurSpec } from "@/types/file.type";
import type { Evidence } from "@/types/timesheet.type";

import type {
  BlurQueue,
  CreateEvidenceInput,
  DateJobs,
  EvidenceImageActions,
  EvidenceInputHandlers,
  EvidencePanelProps,
  EvidenceUpload,
  PendingBlur,
  SetEvidenceError,
} from "./EvidencePanel.type";
import { buildEvidenceBlocks, getPasteTargetDate } from "./EvidencePanel.util";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addEvidence, removeEvidence, replaceEvidence, selectDoc, swapEvidence } from "@/store/timesheet.slice";

/**
 * Turn a file into a stored evidence image (resized, censored on pixels when a spec is given, compressed).
 * `code` screenshots must come with a spec so they are censored before they reach the document.
 * @param {CreateEvidenceInput} input - Source image, name, sensitivity, blur spec and optional id
 * @returns {Promise<Evidence>} - Evidence image
 */
export const createEvidence = async (input: CreateEvidenceInput): Promise<Evidence> => {
  const processed = await processEvidenceImage(input.file, { blur: input.blur });

  return { id: input.id ?? createId(), name: input.name, ...processed, sensitivity: input.sensitivity, blurred: input.blur !== null };
};

/**
 * Dates whose images are being processed, and a runner that flags a date while its job runs.
 * @param {SetEvidenceError} setError - Error setter (job failures become a message)
 * @returns {DateJobs} - Processing dates and runner
 */
export const useDateJobs = (setError: SetEvidenceError): DateJobs => {
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

  return { processingDates, runForDate };
};

/**
 * Images waiting in the blur editor, one at a time. Originals stay in memory only; cancelling a new
 * code screenshot drops it, so an unblurred code image never reaches the document.
 * @param {DateJobs} jobs - Date job runner
 * @param {SetEvidenceError} setError - Error setter
 * @returns {BlurQueue} - Current request, enqueue and editor callbacks
 */
export const useBlurQueue = (jobs: DateJobs, setError: SetEvidenceError): BlurQueue => {
  const dispatch = useAppDispatch();
  const [queue, setQueue] = useState<PendingBlur[]>([]);
  const head = queue[0] ?? null;

  /**
   * Queue images for the editor.
   * @param {PendingBlur[]} items - Images
   * @returns {void}
   */
  const enqueue = (items: PendingBlur[]): void => setQueue((prev) => [...prev, ...items]);

  /**
   * Censor the current image with the editor's spec and store it.
   * @param {BlurSpec} spec - Editor choice
   * @returns {void}
   */
  const handleApply = (spec: BlurSpec): void => {
    if (!head) {
      return;
    }

    void jobs.runForDate(head.date, async () => {
      const image = await createEvidence({ file: head.file, name: head.name, sensitivity: head.sensitivity, blur: spec, id: head.replaceId ?? undefined });

      dispatch(head.replaceId ? replaceEvidence({ date: head.date, id: head.replaceId, image }) : addEvidence({ date: head.date, image }));
      setQueue((prev) => prev.slice(1));
    });
  };

  /**
   * Skip the current image.
   * @returns {void}
   */
  const handleCancel = (): void => {
    if (head?.sensitivity === "code" && !head.replaceId) {
      setError("Screenshot kode dibatalkan dan tidak ditambahkan (wajib diblur).");
    }

    setQueue((prev) => prev.slice(1));
  };

  return {
    queue,
    blurRequest: head,
    isBlurProcessing: head ? jobs.processingDates.includes(head.date) : false,
    enqueue,
    onBlurApply: handleApply,
    onBlurCancel: handleCancel,
  };
};

/**
 * Editor entries for code screenshots.
 * @param {string} date - ISO date
 * @param {File[]} files - Images
 * @param {string | null} replaceId - Image replaced by the first file, or null to add
 * @returns {PendingBlur[]} - Queue items
 */
export const toCodeBlurItems = (date: string, files: File[], replaceId: string | null): PendingBlur[] => {
  return files.map((file) => ({
    key: createId(),
    date,
    file,
    name: file.name || `clipboard-${date}.jpg`,
    isCode: true,
    sensitivity: "code",
    replaceId,
  }));
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
 * Add and replace images; processing happens in the browser only. Code screenshots go to the blur editor.
 * @param {SetEvidenceError} setError - Error setter
 * @param {DateJobs} jobs - Date job runner
 * @param {BlurQueue} blur - Blur editor queue
 * @returns {EvidenceUpload} - Upload actions
 */
export const useEvidenceUpload = (setError: SetEvidenceError, jobs: DateJobs, blur: BlurQueue): EvidenceUpload => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);

  /**
   * Add images to the free slots of a date.
   * @param {string} date - ISO date
   * @param {File[]} files - Images
   * @param {boolean} isCode - Code screenshots (blurred)
   * @returns {Promise<void>} - Resolves when stored
   */
  const addFiles = async (date: string, files: File[], isCode: boolean): Promise<void> => {
    setError(null);
    const queued = blur.queue.filter((item) => item.date === date && !item.replaceId).length;
    const selected = selectUploadFiles(files, EVIDENCE_MAX_PER_DATE - (doc.evidence[date]?.length ?? 0) - queued, setError);

    if (isCode) {
      blur.enqueue(toCodeBlurItems(date, selected, null));

      return;
    }

    await jobs.runForDate(date, async () => {
      for (const file of selected) {
        dispatch(addEvidence({ date, image: await createEvidence({ file, name: file.name || `clipboard-${date}.jpg`, sensitivity: "plain", blur: null }) }));
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

    if (!isAcceptedImage(file)) {
      return;
    }

    if (isCode) {
      blur.enqueue(toCodeBlurItems(date, [file], id));

      return;
    }

    await jobs.runForDate(date, async () => {
      dispatch(replaceEvidence({ date, id, image: await createEvidence({ file, name: file.name, sensitivity: "plain", blur: null, id }) }));
    });
  };

  return { addFiles, replaceFile };
};

/**
 * Remove, swap and blur buttons; targets come from `data-date` / `data-id`.
 * @param {BlurQueue["enqueue"]} enqueueBlur - Opens the blur editor
 * @returns {EvidenceImageActions} - Handlers
 */
export const useEvidenceImageActions = (enqueueBlur: BlurQueue["enqueue"]): EvidenceImageActions => {
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
   * Open a stored plain image in the blur editor (whole image or areas such as names).
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleBlurImage = (event: MouseEvent<HTMLElement>): void => {
    const { date, id } = event.currentTarget.dataset;
    const image = date ? doc.evidence[date]?.find((item) => item.id === id) : undefined;

    if (date && image) {
      enqueueBlur([
        { key: createId(), date, file: dataUrlToBlob(image.dataUrl), name: image.name, isCode: false, sensitivity: image.sensitivity, replaceId: image.id },
      ]);
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
  const jobs = useDateJobs(setError);
  const blur = useBlurQueue(jobs, setError);
  const upload = useEvidenceUpload(setError, jobs, blur);
  const blocks = useMemo(() => buildEvidenceBlocks(doc, activeDate, jobs.processingDates), [doc, activeDate, jobs.processingDates]);
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
    blurRequest: blur.blurRequest,
    isBlurProcessing: blur.isBlurProcessing,
    onBlurApply: blur.onBlurApply,
    onBlurCancel: blur.onBlurCancel,
    ...useEvidenceImageActions(blur.enqueue),
    ...useEvidenceInputs(upload, blocks, isCodeUpload, setActiveDate),
  };
};
