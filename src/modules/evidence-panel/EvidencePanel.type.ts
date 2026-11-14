import type { ChangeEvent, ClipboardEvent, DragEvent, MouseEvent, SyntheticEvent } from "react";
import type { CheckboxChangeEvent } from "antd";

import type { Evidence } from "@/types/timesheet.type";

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
  processingDates: string[];
  addFiles: (date: string, files: File[], isCode: boolean) => Promise<void>;
  replaceFile: (date: string, id: string, file: File, isCode: boolean) => Promise<void>;
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
  EvidenceInputHandlers & {
    blocks: EvidenceDateBlock[];
    sizeLabel: string;
    isTooLarge: boolean;
    error: string | null;
    isCodeUpload: boolean;
    onToggleCodeUpload: (event: CheckboxChangeEvent) => void;
    onDismissError: () => void;
  };
