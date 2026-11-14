import type { ChangeEvent } from "react";
import type { CheckboxChangeEvent } from "antd";

import type { FormSubmitEvent, SelectOption } from "@/types/common.type";
import type { BulkFillInput } from "@/types/timesheet-edit.type";

/** Form values; `null` means "use the computed default". */
export type BulkFillDraft = {
  from: string | null;
  to: string | null;
  task: string;
  start: string | null;
  end: string | null;
  skipFilled: boolean;
};

/** Draft fields edited through `data-field`. */
export type BulkFillTextField = "from" | "to" | "start" | "end";

export type BulkFillFieldHandlers = Pick<BulkFillProps, "onFieldChange" | "onTaskChange" | "onSkipFilledChange">;

export type BulkFillProps = {
  values: BulkFillInput;
  dateOptions: SelectOption<string>[];
  taskOptions: { value: string }[];
  /** Working days the current values would fill. */
  targetCount: number;
  error: string | null;
  notice: string | null;
  /** Date selects and time inputs; the field comes from `data-field`. */
  onFieldChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onTaskChange: (task: string) => void;
  onSkipFilledChange: (event: CheckboxChangeEvent) => void;
  onSubmit: (event: FormSubmitEvent) => void;
};
