import type { ChangeEvent, RefObject } from "react";

export type ImportNoticeType = "success" | "info" | "error";

export type ImportNotice = {
  type: ImportNoticeType;
  text: string;
};

export type PreviousMonthImportProps = {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isReading: boolean;
  notice: ImportNotice | null;
  onChooseFile: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};
