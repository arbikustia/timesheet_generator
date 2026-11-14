import { useCallback, useMemo, useState } from "react";

import { formatPeriodLabelId, getCurrentPeriod, getNextPeriod } from "@/libs/utils/date.util";
import { hasPeriodData } from "@/libs/utils/timesheet-mutation.util";

import type { Period } from "@/types/timesheet.type";

import type {
  PendingPeriodAction,
  PeriodConfirmHandlers,
  PeriodPanelProps,
  PeriodRequestHandlers,
  SetPendingPeriodAction,
} from "./PeriodPanel.type";
import { getMonthOptions, getYearOptions } from "./PeriodPanel.util";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { changePeriod, selectDoc, startNextMonth } from "@/store/timesheet.slice";

/**
 * Handlers that request a period change; they ask for confirmation when the month has data.
 * @param {SetPendingPeriodAction} setPendingAction - Opens the confirmation
 * @returns {PeriodRequestHandlers} - Month, year and next-month handlers
 */
export const usePeriodRequests = (setPendingAction: SetPendingPeriodAction): PeriodRequestHandlers => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);
  const { period } = doc;
  const hasData = hasPeriodData(doc);

  /**
   * Switch period directly, or ask first when the month has data.
   * @param {Period} next - Requested period
   * @returns {void}
   */
  const requestPeriod = useCallback(
    (next: Period): void => {
      if (next.year === period.year && next.month === period.month) {
        return;
      }

      if (hasData) {
        setPendingAction({ kind: "change-period", period: next });

        return;
      }

      dispatch(changePeriod({ period: next, mode: "reset" }));
    },
    [dispatch, hasData, period, setPendingAction],
  );

  /**
   * Handle "Mulai bulan berikutnya".
   * @returns {void}
   */
  const handleStartNextMonth = useCallback((): void => {
    if (hasData) {
      setPendingAction({ kind: "next-month" });

      return;
    }

    dispatch(startNextMonth());
  }, [dispatch, hasData, setPendingAction]);

  /**
   * Handle month select change.
   * @param {number} month - 1-based month
   * @returns {void}
   */
  const handleMonthChange = useCallback((month: number): void => requestPeriod({ ...period, month }), [period, requestPeriod]);

  /**
   * Handle year select change.
   * @param {number} year - Full year
   * @returns {void}
   */
  const handleYearChange = useCallback((year: number): void => requestPeriod({ ...period, year }), [period, requestPeriod]);

  return { onMonthChange: handleMonthChange, onYearChange: handleYearChange, onStartNextMonth: handleStartNextMonth };
};

/**
 * Handlers of the confirmation dialog.
 * @param {PendingPeriodAction | null} pendingAction - Action awaiting confirmation
 * @param {SetPendingPeriodAction} setPendingAction - Closes the confirmation
 * @returns {PeriodConfirmHandlers} - Confirm and cancel handlers
 */
export const usePeriodConfirmations = (
  pendingAction: PendingPeriodAction | null,
  setPendingAction: SetPendingPeriodAction,
): PeriodConfirmHandlers => {
  const dispatch = useAppDispatch();

  /**
   * Apply a confirmed period change.
   * @param {"move" | "reset"} mode - Move dates or start empty
   * @returns {void}
   */
  const confirmPeriod = useCallback(
    (mode: "move" | "reset"): void => {
      if (pendingAction?.kind === "change-period") {
        dispatch(changePeriod({ period: pendingAction.period, mode }));
      }

      setPendingAction(null);
    },
    [dispatch, pendingAction, setPendingAction],
  );

  /**
   * Confirm starting the next month.
   * @returns {void}
   */
  const handleConfirmNextMonth = useCallback((): void => {
    dispatch(startNextMonth());
    setPendingAction(null);
  }, [dispatch, setPendingAction]);

  /**
   * Confirm moving the data to the new period.
   * @returns {void}
   */
  const handleConfirmMove = useCallback((): void => confirmPeriod("move"), [confirmPeriod]);

  /**
   * Confirm starting the new period empty.
   * @returns {void}
   */
  const handleConfirmReset = useCallback((): void => confirmPeriod("reset"), [confirmPeriod]);

  /**
   * Close the confirmation without changes.
   * @returns {void}
   */
  const handleCancel = useCallback((): void => setPendingAction(null), [setPendingAction]);

  return {
    onConfirmMove: handleConfirmMove,
    onConfirmReset: handleConfirmReset,
    onConfirmNextMonth: handleConfirmNextMonth,
    onCancel: handleCancel,
  };
};

/**
 * Period selection with confirmation when the current month already has data.
 * @returns {PeriodPanelProps} - Values and handlers for the period panel
 */
export const usePeriodPanel = (): PeriodPanelProps => {
  const { period } = useAppSelector(selectDoc);
  const [pendingAction, setPendingAction] = useState<PendingPeriodAction | null>(null);
  const yearOptions = useMemo(() => getYearOptions(getCurrentPeriod().year, period.year), [period.year]);

  return {
    month: period.month,
    year: period.year,
    monthOptions: getMonthOptions(),
    yearOptions,
    nextPeriodLabel: formatPeriodLabelId(getNextPeriod(period)),
    pendingAction,
    ...usePeriodRequests(setPendingAction),
    ...usePeriodConfirmations(pendingAction, setPendingAction),
  };
};
