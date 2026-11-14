import type { ChangeEvent, DragEvent, MouseEvent } from "react";

import type { SelectOption } from "@/types/common.type";
import type { Entry } from "@/types/timesheet.type";

/** One entry with its index in the document list. */
export type EntryListRow = {
  entry: Entry;
  index: number;
  isOutsidePeriod: boolean;
  /** Manual remark text; empty means the remark is computed automatically. */
  remarkText: string;
};

export type EntryFieldChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

export type EntryEditHandlers = {
  onFieldChange: (event: EntryFieldChangeEvent) => void;
  onRemarkChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onDuplicate: (event: MouseEvent<HTMLElement>) => void;
  onRemove: (event: MouseEvent<HTMLElement>) => void;
};

export type EntryOrderHandlers = {
  dragIndex: number | null;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onMoveUp: (event: MouseEvent<HTMLElement>) => void;
  onMoveDown: (event: MouseEvent<HTMLElement>) => void;
};

export type EntryListProps = EntryEditHandlers &
  EntryOrderHandlers & {
    rows: EntryListRow[];
    dateOptions: SelectOption<string>[];
  };
