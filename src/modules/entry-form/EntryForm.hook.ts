import { type ChangeEvent, type RefObject, useCallback, useMemo, useRef, useState } from "react";

import { getMonthDates, isInPeriod } from "@/libs/utils/date.util";
import { getDateOptions } from "@/libs/utils/date-option.util";
import { validateEntryInput } from "@/libs/utils/entry-validation.util";
import { getNextUnfilledWorkday } from "@/libs/utils/timesheet-engine.util";
import { getPreviousEntry, getTaskSuggestions } from "@/libs/utils/timesheet-mutation.util";

import type { FormSubmitEvent } from "@/types/common.type";
import type { TimesheetDoc } from "@/types/timesheet.type";
import type { NewEntryInput } from "@/types/timesheet-edit.type";

import { toTaskOptions } from "./EntryForm.helper";
import type {
  EntryFormDraft,
  EntryFormFieldHandlers,
  EntryFormProps,
  EntryFormSubmitHandlers,
  TaskInputHandle,
} from "./EntryForm.type";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addEntry, selectDoc } from "@/store/timesheet.slice";

const EMPTY_DRAFT: EntryFormDraft = { date: null, task: "", start: null, end: null };

/**
 * Resolve the draft into concrete values using the document defaults.
 * @param {EntryFormDraft} draft - Form draft
 * @param {TimesheetDoc} doc - Document
 * @returns {NewEntryInput} - Values shown in the form
 */
export const resolveEntryValues = (draft: EntryFormDraft, doc: TimesheetDoc): NewEntryInput => {
  const fallbackDate = getNextUnfilledWorkday(doc) ?? getMonthDates(doc.period)[0];
  const date = draft.date && isInPeriod(draft.date, doc.period) ? draft.date : fallbackDate;

  return {
    date,
    task: draft.task,
    start: draft.start ?? doc.profile.defaults.start,
    end: draft.end ?? doc.profile.defaults.end,
  };
};

/**
 * Field change handlers of the quick-add form.
 * @param {React.Dispatch<React.SetStateAction<EntryFormDraft>>} setDraft - Draft setter
 * @returns {EntryFormFieldHandlers} - Handlers
 */
export const useEntryFormFields = (
  setDraft: React.Dispatch<React.SetStateAction<EntryFormDraft>>,
): EntryFormFieldHandlers => {
  /**
   * Handle date select change.
   * @param {string} date - ISO date
   * @returns {void}
   */
  const handleDateChange = useCallback((date: string): void => setDraft((prev) => ({ ...prev, date })), [setDraft]);

  /**
   * Handle task autocomplete change.
   * @param {string} task - Task text
   * @returns {void}
   */
  const handleTaskChange = useCallback((task: string): void => setDraft((prev) => ({ ...prev, task })), [setDraft]);

  /**
   * Handle start time change.
   * @param {ChangeEvent<HTMLInputElement>} event - Input event
   * @returns {void}
   */
  const handleStartChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => setDraft((prev) => ({ ...prev, start: event.target.value })),
    [setDraft],
  );

  /**
   * Handle end time change.
   * @param {ChangeEvent<HTMLInputElement>} event - Input event
   * @returns {void}
   */
  const handleEndChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => setDraft((prev) => ({ ...prev, end: event.target.value })),
    [setDraft],
  );

  return {
    onDateChange: handleDateChange,
    onTaskChange: handleTaskChange,
    onStartChange: handleStartChange,
    onEndChange: handleEndChange,
  };
};

/**
 * Submit handling: validate, add, reset the draft and refocus Task.
 * @param {NewEntryInput} values - Resolved form values
 * @param {React.Dispatch<React.SetStateAction<EntryFormDraft>>} setDraft - Draft setter
 * @param {RefObject<TaskInputHandle | null>} taskInputRef - Task input handle
 * @returns {EntryFormSubmitHandlers} - Error message and submit handler
 */
export const useEntryFormSubmit = (
  values: NewEntryInput,
  setDraft: React.Dispatch<React.SetStateAction<EntryFormDraft>>,
  taskInputRef: RefObject<TaskInputHandle | null>,
): EntryFormSubmitHandlers => {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  /**
   * Validate and add the activity.
   * @param {FormSubmitEvent} event - Submit event
   * @returns {void}
   */
  const handleSubmit = (event: FormSubmitEvent): void => {
    event.preventDefault();
    const message = validateEntryInput(values);

    setError(message);

    if (message) {
      return;
    }

    dispatch(addEntry({ ...values, task: values.task.trim() }));
    setDraft(EMPTY_DRAFT);
    taskInputRef.current?.focus();
  };

  return { error, onSubmit: handleSubmit };
};

/**
 * Quick-add form: Enter adds the activity, then focus returns to Task and the date jumps
 * to the next unfilled working day.
 * @returns {EntryFormProps} - Values and handlers for the form
 */
export const useEntryForm = (): EntryFormProps => {
  const doc = useAppSelector(selectDoc);
  const taskInputRef = useRef<TaskInputHandle | null>(null);
  const [draft, setDraft] = useState<EntryFormDraft>(EMPTY_DRAFT);
  const values = resolveEntryValues(draft, doc);
  const previous = getPreviousEntry(doc, values.date);
  const dateOptions = useMemo(() => getDateOptions(doc), [doc]);
  const taskOptions = useMemo(() => toTaskOptions(getTaskSuggestions(doc)), [doc]);

  /**
   * Copy task and times from the previous entry.
   * @returns {void}
   */
  const handleDuplicatePrevious = (): void => {
    if (previous) {
      setDraft((prev) => ({ ...prev, task: previous.task, start: previous.start, end: previous.end }));
    }
  };

  return {
    values,
    dateOptions,
    taskOptions,
    canDuplicate: previous !== null,
    taskInputRef,
    ...useEntryFormFields(setDraft),
    ...useEntryFormSubmit(values, setDraft, taskInputRef),
    onDuplicatePrevious: handleDuplicatePrevious,
  };
};
