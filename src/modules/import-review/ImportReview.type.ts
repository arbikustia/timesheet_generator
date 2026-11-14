import type { ChangeEvent, MouseEvent } from "react";

import type { Entry, EntrySource } from "@/types/timesheet.type";

/** Another row of the same date an automatic entry can be merged into. */
export type MergeOption = {
  value: string;
  label: string;
};

export type ReviewItem = {
  entry: Entry;
  source: EntrySource;
  /** `ticket · branch · repo`, empty parts left out. */
  meta: string;
  hintText: string | null;
  mergeOptions: MergeOption[];
};

export type ReviewDay = {
  date: string;
  label: string;
  items: ReviewItem[];
};

/** Monday–Sunday group, so a whole week can be accepted at once. */
export type ReviewWeek = {
  key: string;
  label: string;
  entryIds: string[];
  days: ReviewDay[];
};

export type ReviewActions = {
  onTaskChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onAccept: (event: MouseEvent<HTMLElement>) => void;
  onReject: (event: MouseEvent<HTMLElement>) => void;
  onAcceptWeek: (event: MouseEvent<HTMLElement>) => void;
  onMergeChange: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export type ImportReviewProps = ReviewActions & {
  weeks: ReviewWeek[];
  pendingCount: number;
  snapshotCommand: string;
  importCommand: string;
  isCopied: boolean;
  onCopyCommand: () => void;
};
