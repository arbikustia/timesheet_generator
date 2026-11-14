import type { ChangeEvent, MouseEvent } from "react";

import type { FormSubmitEvent, SelectOption } from "@/types/common.type";
import type { DayOverride, DayOverrideType } from "@/types/timesheet.type";

/** Form draft; `null` means "use the computed default". */
export type DayOverrideDraft = {
  date: string | null;
  type: DayOverrideType;
  label: string | null;
};

export type DayOverrideValues = {
  date: string;
  type: DayOverrideType;
  label: string;
};

/** One marked day in the list. */
export type DayOverrideItem = {
  date: string;
  dateLabel: string;
  override: DayOverride;
  hasEntries: boolean;
};

export type DayOverridesProps = {
  values: DayOverrideValues;
  dateOptions: SelectOption<string>[];
  typeOptions: SelectOption<DayOverrideType>[];
  items: DayOverrideItem[];
  error: string | null;
  onDateChange: (date: string) => void;
  onTypeChange: (type: DayOverrideType) => void;
  onLabelChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormSubmitEvent) => void;
  onRemove: (event: MouseEvent<HTMLElement>) => void;
};

export type DayOverrideFieldHandlers = Pick<DayOverridesProps, "onDateChange" | "onTypeChange" | "onLabelChange">;
