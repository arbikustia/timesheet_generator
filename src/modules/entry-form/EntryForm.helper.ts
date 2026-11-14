import type { TaskOption } from "./EntryForm.type";

/**
 * Case-insensitive "contains" filter for task suggestions.
 * @param {string} input - Typed text
 * @param {TaskOption} [option] - Suggestion
 * @returns {boolean} - True when the suggestion matches
 */
export const filterTaskOption = (input: string, option?: TaskOption): boolean => {
  return (option?.value ?? "").toLowerCase().includes(input.trim().toLowerCase());
};

/**
 * Map task texts to autocomplete options.
 * @param {string[]} tasks - Task suggestions
 * @returns {TaskOption[]} - Options
 */
export const toTaskOptions = (tasks: string[]): TaskOption[] => {
  return tasks.map((task) => ({ value: task }));
};

/** Autocomplete search behaviour for the task input. */
export const TASK_SEARCH = { filterOption: filterTaskOption };
