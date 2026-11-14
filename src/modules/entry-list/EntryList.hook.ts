import { type ChangeEvent, type DragEvent, type MouseEvent, useCallback, useMemo, useState } from "react";

import { isInPeriod } from "@/libs/utils/date.util";
import { getDateOptions } from "@/libs/utils/date-option.util";

import type { TimesheetDoc } from "@/types/timesheet.type";

import { isEntryField, readIndex } from "./EntryList.helper";
import type {
  EntryEditHandlers,
  EntryFieldChangeEvent,
  EntryListProps,
  EntryListRow,
  EntryOrderHandlers,
} from "./EntryList.type";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { duplicateEntry, moveEntry, removeEntry, selectDoc, updateEntry } from "@/store/timesheet.slice";

/**
 * Map document entries to list rows.
 * @param {TimesheetDoc} doc - Document
 * @returns {EntryListRow[]} - Rows in list order
 */
export const buildEntryRows = (doc: TimesheetDoc): EntryListRow[] => {
  return doc.entries.map((entry, index) => ({
    entry,
    index,
    isOutsidePeriod: !isInPeriod(entry.date, doc.period),
    remarkText: entry.remarkOverride ?? "",
  }));
};

/**
 * Inline edit, duplicate and remove handlers; rows are identified by `data-entry-id`.
 * @returns {EntryEditHandlers} - Handlers
 */
export const useEntryEdits = (): EntryEditHandlers => {
  const dispatch = useAppDispatch();

  /**
   * Update the field named by `data-field`.
   * @param {EntryFieldChangeEvent} event - Change event
   * @returns {void}
   */
  const handleFieldChange = useCallback(
    (event: EntryFieldChangeEvent): void => {
      const { entryId, field } = event.currentTarget.dataset;

      if (entryId && isEntryField(field)) {
        dispatch(updateEntry({ id: entryId, changes: { [field]: event.currentTarget.value } }));
      }
    },
    [dispatch],
  );

  /**
   * Update the manual remark; an empty text returns to the automatic remark.
   * @param {ChangeEvent<HTMLTextAreaElement>} event - Change event
   * @returns {void}
   */
  const handleRemarkChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      const { entryId } = event.currentTarget.dataset;
      const text = event.currentTarget.value;

      if (entryId) {
        dispatch(updateEntry({ id: entryId, changes: { remarkOverride: text.trim() ? text : null } }));
      }
    },
    [dispatch],
  );

  return {
    onFieldChange: handleFieldChange,
    onRemarkChange: handleRemarkChange,
    ...useEntryButtons(),
  };
};

/**
 * Duplicate and remove buttons.
 * @returns {Pick<EntryEditHandlers, "onDuplicate" | "onRemove">} - Handlers
 */
export const useEntryButtons = (): Pick<EntryEditHandlers, "onDuplicate" | "onRemove"> => {
  const dispatch = useAppDispatch();

  /**
   * Duplicate the entry right below itself.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleDuplicate = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      const { entryId } = event.currentTarget.dataset;

      if (entryId) {
        dispatch(duplicateEntry(entryId));
      }
    },
    [dispatch],
  );

  /**
   * Remove the entry.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleRemove = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      const { entryId } = event.currentTarget.dataset;

      if (entryId) {
        dispatch(removeEntry(entryId));
      }
    },
    [dispatch],
  );

  return { onDuplicate: handleDuplicate, onRemove: handleRemove };
};

/**
 * Drag-and-drop and up/down reordering; rows are identified by `data-index`.
 * @returns {EntryOrderHandlers} - Drag state and handlers
 */
export const useEntryOrder = (): EntryOrderHandlers => {
  const dispatch = useAppDispatch();
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  /**
   * Move an entry and clear the drag state.
   * @param {number} fromIndex - Current index
   * @param {number} toIndex - Target index
   * @returns {void}
   */
  const move = useCallback(
    (fromIndex: number, toIndex: number): void => {
      dispatch(moveEntry({ fromIndex, toIndex }));
      setDragIndex(null);
    },
    [dispatch],
  );

  /**
   * Remember the dragged row.
   * @param {DragEvent<HTMLElement>} event - Drag event
   * @returns {void}
   */
  const handleDragStart = (event: DragEvent<HTMLElement>): void => setDragIndex(readIndex(event.currentTarget));

  /**
   * Drop the dragged row on this row.
   * @param {DragEvent<HTMLElement>} event - Drop event
   * @returns {void}
   */
  const handleDrop = (event: DragEvent<HTMLElement>): void => {
    event.preventDefault();

    if (dragIndex !== null) {
      move(dragIndex, readIndex(event.currentTarget));
    }
  };

  /**
   * Clear the drag state when dragging stops without a drop.
   * @returns {void}
   */
  const handleDragEnd = (): void => setDragIndex(null);

  return {
    dragIndex,
    onDragStart: handleDragStart,
    onDragOver: _allowDrop,
    onDrop: handleDrop,
    onDragEnd: handleDragEnd,
    ...useEntryMoveButtons(move),
  };
};

/**
 * Allow dropping on a row.
 * @param {DragEvent<HTMLElement>} event - Drag-over event
 * @returns {void}
 */
const _allowDrop = (event: DragEvent<HTMLElement>): void => event.preventDefault();

/**
 * Keyboard-friendly up/down buttons.
 * @param {(fromIndex: number, toIndex: number) => void} move - Move function
 * @returns {Pick<EntryOrderHandlers, "onMoveUp" | "onMoveDown">} - Handlers
 */
export const useEntryMoveButtons = (
  move: (fromIndex: number, toIndex: number) => void,
): Pick<EntryOrderHandlers, "onMoveUp" | "onMoveDown"> => {
  /**
   * Move the entry one place up.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleMoveUp = (event: MouseEvent<HTMLElement>): void => {
    const index = readIndex(event.currentTarget);

    move(index, index - 1);
  };

  /**
   * Move the entry one place down.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleMoveDown = (event: MouseEvent<HTMLElement>): void => {
    const index = readIndex(event.currentTarget);

    move(index, index + 1);
  };

  return { onMoveUp: handleMoveUp, onMoveDown: handleMoveDown };
};

/**
 * Editable activity list of the document.
 * @returns {EntryListProps} - Rows, options and handlers
 */
export const useEntryList = (): EntryListProps => {
  const doc = useAppSelector(selectDoc);
  const rows = useMemo(() => buildEntryRows(doc), [doc]);
  const dateOptions = useMemo(() => getDateOptions(doc), [doc]);

  return { rows, dateOptions, ...useEntryEdits(), ...useEntryOrder() };
};
