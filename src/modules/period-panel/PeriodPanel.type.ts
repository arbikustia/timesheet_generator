import type { SelectOption } from "@/types/common.type";
import type { Period } from "@/types/timesheet.type";

/** A period action waiting for the user's confirmation. */
export type PendingPeriodAction = { kind: "change-period"; period: Period } | { kind: "next-month" };

export type PeriodPanelProps = {
  month: number;
  year: number;
  monthOptions: SelectOption<number>[];
  yearOptions: SelectOption<number>[];
  nextPeriodLabel: string;
  pendingAction: PendingPeriodAction | null;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onStartNextMonth: () => void;
  onConfirmMove: () => void;
  onConfirmReset: () => void;
  onConfirmNextMonth: () => void;
  onCancel: () => void;
};

export type SetPendingPeriodAction = (action: PendingPeriodAction | null) => void;

export type PeriodRequestHandlers = Pick<PeriodPanelProps, "onMonthChange" | "onYearChange" | "onStartNextMonth">;

export type PeriodConfirmHandlers = Pick<
  PeriodPanelProps,
  "onConfirmMove" | "onConfirmReset" | "onConfirmNextMonth" | "onCancel"
>;
