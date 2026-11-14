import { type ChangeEvent, type MouseEvent, useCallback, useMemo, useState } from "react";

import { getDateOptions } from "@/libs/utils/date-option.util";

import type { FormSubmitEvent } from "@/types/common.type";
import type { DayOverrideType } from "@/types/timesheet.type";

import { DAY_OVERRIDE_TYPE_OPTIONS } from "./DayOverrides.config";
import type { DayOverrideDraft, DayOverrideFieldHandlers, DayOverridesProps } from "./DayOverrides.type";
import { buildOverrideItems, resolveOverrideValues } from "./DayOverrides.util";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDoc, setDayOverride } from "@/store/timesheet.slice";

const EMPTY_DRAFT: DayOverrideDraft = { date: null, type: "holiday", label: null };

/**
 * Field handlers of the day marking form.
 * @param {React.Dispatch<React.SetStateAction<DayOverrideDraft>>} setDraft - Draft setter
 * @returns {DayOverrideFieldHandlers} - Handlers
 */
export const useDayOverrideFields = (
  setDraft: React.Dispatch<React.SetStateAction<DayOverrideDraft>>,
): DayOverrideFieldHandlers => {
  /**
   * Handle date change.
   * @param {string} date - ISO date
   * @returns {void}
   */
  const handleDateChange = useCallback((date: string): void => setDraft((prev) => ({ ...prev, date })), [setDraft]);

  /**
   * Handle type change; the label returns to the type's default.
   * @param {DayOverrideType} type - Override type
   * @returns {void}
   */
  const handleTypeChange = useCallback(
    (type: DayOverrideType): void => setDraft((prev) => ({ ...prev, type, label: null })),
    [setDraft],
  );

  /**
   * Handle label change.
   * @param {ChangeEvent<HTMLInputElement>} event - Input event
   * @returns {void}
   */
  const handleLabelChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => setDraft((prev) => ({ ...prev, label: event.target.value })),
    [setDraft],
  );

  return { onDateChange: handleDateChange, onTypeChange: handleTypeChange, onLabelChange: handleLabelChange };
};

/**
 * Mark days as public holiday or leave (rendered as red rows).
 * @returns {DayOverridesProps} - Values and handlers
 */
export const useDayOverrides = (): DayOverridesProps => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);
  const [draft, setDraft] = useState<DayOverrideDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const values = resolveOverrideValues(draft, doc);
  const dateOptions = useMemo(() => getDateOptions(doc), [doc]);
  const items = useMemo(() => buildOverrideItems(doc), [doc]);

  /**
   * Save the marking.
   * @param {FormSubmitEvent} event - Submit event
   * @returns {void}
   */
  const handleSubmit = (event: FormSubmitEvent): void => {
    event.preventDefault();
    const label = values.label.trim();

    setError(label ? null : "Keterangan wajib diisi.");

    if (label) {
      dispatch(setDayOverride({ date: values.date, override: { type: values.type, label } }));
      setDraft(EMPTY_DRAFT);
    }
  };

  /**
   * Remove the marking named by `data-date`.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleRemove = (event: MouseEvent<HTMLElement>): void => {
    const { date } = event.currentTarget.dataset;

    if (date) {
      dispatch(setDayOverride({ date, override: null }));
    }
  };

  return {
    values,
    dateOptions,
    typeOptions: DAY_OVERRIDE_TYPE_OPTIONS,
    items,
    error,
    ...useDayOverrideFields(setDraft),
    onSubmit: handleSubmit,
    onRemove: handleRemove,
  };
};
