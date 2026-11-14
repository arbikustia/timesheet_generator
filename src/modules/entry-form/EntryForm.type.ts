import type { ChangeEvent, RefObject } from "react";
import type { AutoComplete } from "antd";

import type { FormSubmitEvent, SelectOption } from "@/types/common.type";
import type { NewEntryInput } from "@/types/timesheet-edit.type";

/** Imperative handle of the task autocomplete (used to refocus after adding). */
export type TaskInputHandle = React.ComponentRef<typeof AutoComplete>;

export type TaskOption = {
  value: string;
};

/** Form values; `null` means "use the computed default". */
export type EntryFormDraft = {
  date: string | null;
  task: string;
  start: string | null;
  end: string | null;
};

export type EntryFormProps = {
  values: NewEntryInput;
  dateOptions: SelectOption<string>[];
  taskOptions: TaskOption[];
  error: string | null;
  canDuplicate: boolean;
  taskInputRef: RefObject<TaskInputHandle | null>;
  onDateChange: (date: string) => void;
  onTaskChange: (task: string) => void;
  onStartChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onEndChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDuplicatePrevious: () => void;
  onSubmit: (event: FormSubmitEvent) => void;
};

export type EntryFormSubmitHandlers = Pick<EntryFormProps, "error" | "onSubmit">;

export type EntryFormFieldHandlers = Pick<EntryFormProps, "onDateChange" | "onTaskChange" | "onStartChange" | "onEndChange">;
