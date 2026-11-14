import type { ChangeEvent, ClipboardEvent, DragEvent, MouseEvent, SyntheticEvent } from "react";
import type { CheckboxChangeEvent } from "antd";

import type { BlurSpec } from "@/types/file.type";
import type { Evidence, EvidenceSensitivity } from "@/types/timesheet.type";

import type { BlurEditorRequest } from "@/modules/blur-editor/BlurEditor.type";

export type EvidenceSide = "left" | "right";

/** One date that can receive evidence. */
export type EvidenceDateBlock = {
  date: string;
  label: string;
  tasks: string;
  images: Evidence[];
  hasEntries: boolean;
  isActive: boolean;
  isProcessing: boolean;
};

export type SetEvidenceError = (message: string | null) => void;

export type EvidenceUpload = {
  addFiles: (date: string, files: File[], isCode: boolean) => Promise<void>;
  replaceFile: (date: string, id: string, file: File, isCode: boolean) => Promise<void>;
};

export type CreateEvidenceInput = {
  file: Blob;
  name: string;
  sensitivity: EvidenceSensitivity;
  /** Censoring from the blur editor; null stores the image as is (plain images only). */
  blur: BlurSpec | null;
  /** Kept when replacing; a new id otherwise. */
  id?: string;
};

export type DateJobs = {
  processingDates: string[];
  runForDate: (date: string, job: () => Promise<void>) => Promise<void>;
};

/** An image waiting in the blur editor, with where its result goes. */
export type PendingBlur = BlurEditorRequest & {
  date: string;
  sensitivity: EvidenceSensitivity;
  /** Image replaced by the result, or null to add it to a free slot. */
  replaceId: string | null;
};

export type BlurEditorBinding = {
  blurRequest: PendingBlur | null;
  isBlurProcessing: boolean;
  onBlurApply: (spec: BlurSpec) => void;
  onBlurCancel: () => void;
};

export type BlurQueue = BlurEditorBinding & {
  queue: PendingBlur[];
  enqueue: (items: PendingBlur[]) => void;
};

export type EvidenceImageActions = {
  onRemove: (event: MouseEvent<HTMLElement>) => void;
  onSwap: (event: MouseEvent<HTMLElement>) => void;
  onBlurImage: (event: MouseEvent<HTMLElement>) => void;
};

export type EvidenceInputHandlers = {
  onActivate: (event: SyntheticEvent<HTMLElement>) => void;
  onPaste: (event: ClipboardEvent<HTMLElement>) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
};

export type EvidencePanelProps = EvidenceImageActions &
  EvidenceInputHandlers &
  BlurEditorBinding & {
    blocks: EvidenceDateBlock[];
    sizeLabel: string;
    isTooLarge: boolean;
    error: string | null;
    isCodeUpload: boolean;
    onToggleCodeUpload: (event: CheckboxChangeEvent) => void;
    onDismissError: () => void;
  };
