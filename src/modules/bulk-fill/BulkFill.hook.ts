import { type ChangeEvent, useMemo, useState } from "react";
import type { CheckboxChangeEvent } from "antd";

import { getTaskSuggestions } from "@/libs/utils/timesheet-mutation.util";
import { buildBulkEntries, getBulkFillDates } from "@/libs/utils/workflow.util";

import type { FormSubmitEvent } from "@/types/common.type";

import type { BulkFillDraft, BulkFillFieldHandlers, BulkFillProps, BulkFillTextField } from "./BulkFill.type";
import { getWorkdayOptions, resolveBulkFillValues, validateBulkFill } from "./BulkFill.util";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addEntries, selectDoc } from "@/store/timesheet.slice";

const EMPTY_DRAFT: BulkFillDraft = { from: null, to: null, task: "", start: null, end: null, skipFilled: true };

/**
 * Whether a `data-field` value is a text field of the draft.
 * @param {string | undefined} field - Field name
 * @returns {boolean} - True for from/to/start/end
 */
export const isBulkFillTextField = (field: string | undefined): field is BulkFillTextField =>
  field === "from" || field === "to" || field === "start" || field === "end";

/**
 * Field change handlers of the bulk fill form.
 * @param {(changes: Partial<BulkFillDraft>) => void} update - Merges a change into the draft
 * @returns {BulkFillFieldHandlers} - Handlers
 */
export const useBulkFillFields = (update: (changes: Partial<BulkFillDraft>) => void): BulkFillFieldHandlers => {
  /**
   * Date or time change (`data-field`).
   * @param {ChangeEvent<HTMLInputElement | HTMLSelectElement>} event - Change event
   * @returns {void}
   */
  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { field } = event.currentTarget.dataset;

    if (isBulkFillTextField(field)) {
      update({ [field]: event.currentTarget.value });
    }
  };

  /**
   * Task typed or picked.
   * @param {string} task - Task
   * @returns {void}
   */
  const handleTaskChange = (task: string): void => update({ task });

  /**
   * Toggle "skip filled dates".
   * @param {CheckboxChangeEvent} event - Checkbox event
   * @returns {void}
   */
  const handleSkipFilledChange = (event: CheckboxChangeEvent): void => update({ skipFilled: event.target.checked });

  return { onFieldChange: handleFieldChange, onTaskChange: handleTaskChange, onSkipFilledChange: handleSkipFilledChange };
};

/**
 * "Isi massal" (PROMPT §7): the same task and hours for every working day in a range, as one undo step.
 * @returns {BulkFillProps} - View props
 */
export const useBulkFill = (): BulkFillProps => {
  const dispatch = useAppDispatch();
  const doc = useAppSelector(selectDoc);
  const [draft, setDraft] = useState<BulkFillDraft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const values = resolveBulkFillValues(draft, doc);
  const targetCount = getBulkFillDates(doc, values).length;
  const dateOptions = useMemo(() => getWorkdayOptions(doc), [doc]);
  const taskOptions = useMemo(() => getTaskSuggestions(doc).map((task) => ({ value: task })), [doc]);

  /**
   * Merge a field change and clear old feedback.
   * @param {Partial<BulkFillDraft>} changes - Changed fields
   * @returns {void}
   */
  const update = (changes: Partial<BulkFillDraft>): void => {
    setDraft((prev) => ({ ...prev, ...changes }));
    setNotice(null);
  };

  /**
   * Add one entry per selected working day.
   * @param {FormSubmitEvent} event - Submit event
   * @returns {void}
   */
  const handleSubmit = (event: FormSubmitEvent): void => {
    event.preventDefault();
    const message = validateBulkFill(values, targetCount);

    setError(message);

    if (!message) {
      dispatch(addEntries(buildBulkEntries(doc, values)));
      setNotice(`${targetCount} aktivitas ditambahkan.`);
      setDraft((prev) => ({ ...prev, task: "" }));
    }
  };

  return { values, dateOptions, taskOptions, targetCount, error, notice, ...useBulkFillFields(update), onSubmit: handleSubmit };
};
