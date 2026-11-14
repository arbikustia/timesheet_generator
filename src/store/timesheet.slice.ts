import { createSelector, createSlice, isAnyOf, type PayloadAction, type UnknownAction } from "@reduxjs/toolkit";

import { getCurrentPeriod } from "@/libs/utils/date.util";
import { getLearnedTicketName, mergeEntryRefs, normalizeTicket } from "@/libs/utils/review.util";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";
import {
  createId,
  createNextMonthDoc,
  insertEntrySorted,
  moveItem,
  resetDocToPeriod,
  shiftDocToPeriod,
} from "@/libs/utils/timesheet-mutation.util";
import { validateDoc } from "@/libs/utils/timesheet-validation.util";
import { mergePreviousMonth } from "@/libs/utils/workflow.util";

import { EVIDENCE_MAX_PER_DATE } from "@/constants/timesheet.constant";
import type { Entry, TimesheetDoc } from "@/types/timesheet.type";
import type {
  AddEvidencePayload,
  ChangePeriodPayload,
  DayOverridePayload,
  DefaultHoursChanges,
  EntryChanges,
  EvidenceRefPayload,
  MergeEntryPayload,
  MoveEntryPayload,
  NewEntryInput,
  ProfileChanges,
  ReplaceEvidencePayload,
  RepoChanges,
  SignaturePayload,
  TicketNamePayload,
  UpdateEntryPayload,
  UpdateRepoPayload,
} from "@/types/timesheet-edit.type";
import type { ValidationReport } from "@/types/timesheet-validation.type";

import { recordHistory, redoHistory, undoHistory } from "./timesheet.history";
import type { TimesheetState } from "./timesheet.type";

/**
 * Initial state: an empty document for the current month.
 * @param {Date} [now=new Date()] - Reference date
 * @returns {TimesheetState} - Initial state
 */
export const createInitialTimesheetState = (now: Date = new Date()): TimesheetState => {
  return createTimesheetState(createEmptyDoc(getCurrentPeriod(now)));
};

/**
 * State for a freshly loaded (clean) document.
 * @param {TimesheetDoc} doc - Document
 * @returns {TimesheetState} - State with no unsaved changes
 */
export const createTimesheetState = (doc: TimesheetDoc): TimesheetState => {
  return { doc, savedDoc: doc, past: [], future: [], mergeKey: null };
};

/**
 * Build a manual entry with a fresh id.
 * @param {NewEntryInput} input - Typed fields
 * @returns {Entry} - Complete entry
 */
const _buildManualEntry = (input: NewEntryInput): Entry => {
  return { ...input, id: createId(), remarkOverride: null, source: "manual", reviewed: true };
};

const timesheetSlice = createSlice({
  name: "timesheet",
  initialState: createInitialTimesheetState,
  reducers: {
    loadDoc: (_state, action: PayloadAction<TimesheetDoc>): TimesheetState => createTimesheetState(action.payload),
    restoreDraft: (state, action: PayloadAction<TimesheetDoc>): TimesheetState => ({
      ...createTimesheetState(action.payload),
      savedDoc: state.savedDoc,
    }),
    undo: (state): TimesheetState => undoHistory(state),
    redo: (state): TimesheetState => redoHistory(state),
    markSaved: (state, action: PayloadAction<TimesheetDoc>): void => {
      state.savedDoc = action.payload;
    },
    changePeriod: (state, action: PayloadAction<ChangePeriodPayload>): void => {
      const { period, mode } = action.payload;

      state.doc = mode === "move" ? shiftDocToPeriod(state.doc, period) : resetDocToPeriod(state.doc, period);
    },
    startNextMonth: (state): void => {
      state.doc = createNextMonthDoc(state.doc);
    },
    addEntry: {
      reducer: (state, action: PayloadAction<Entry>): void => {
        state.doc.entries = insertEntrySorted(state.doc.entries, action.payload);
      },
      prepare: (input: NewEntryInput) => ({ payload: _buildManualEntry(input) }),
    },
    addEntries: {
      reducer: (state, action: PayloadAction<Entry[]>): void => {
        state.doc.entries = action.payload.reduce(insertEntrySorted, state.doc.entries);
      },
      prepare: (inputs: NewEntryInput[]) => ({ payload: inputs.map(_buildManualEntry) }),
    },
    importPreviousMonth: (state, action: PayloadAction<TimesheetDoc>): void => {
      state.doc = mergePreviousMonth(state.doc, action.payload).doc;
    },
    updateEntry: (state, action: PayloadAction<UpdateEntryPayload>): void => {
      const entry = state.doc.entries.find((item) => item.id === action.payload.id);

      if (entry) {
        Object.assign(entry, action.payload.changes);
      }
    },
    removeEntry: (state, action: PayloadAction<string>): void => {
      const index = state.doc.entries.findIndex((entry) => entry.id === action.payload);

      if (index >= 0) {
        state.doc.entries.splice(index, 1);
      }
    },
    duplicateEntry: {
      reducer: (state, action: PayloadAction<{ id: string; newId: string }>): void => {
        const index = state.doc.entries.findIndex((entry) => entry.id === action.payload.id);

        if (index >= 0) {
          state.doc.entries.splice(index + 1, 0, { ...state.doc.entries[index], id: action.payload.newId });
        }
      },
      prepare: (id: string) => ({ payload: { id, newId: createId() } }),
    },
    moveEntry: (state, action: PayloadAction<MoveEntryPayload>): void => {
      state.doc.entries = moveItem(state.doc.entries, action.payload.fromIndex, action.payload.toIndex);
    },
    setDayOverride: (state, action: PayloadAction<DayOverridePayload>): void => {
      const { date, override } = action.payload;

      if (override) {
        state.doc.dayOverrides[date] = override;

        return;
      }

      delete state.doc.dayOverrides[date];
    },
    updateProfile: (state, action: PayloadAction<ProfileChanges>): void => {
      Object.assign(state.doc.profile, action.payload);
    },
    updateDefaultHours: (state, action: PayloadAction<DefaultHoursChanges>): void => {
      Object.assign(state.doc.profile.defaults, action.payload);
    },
    setSignature: (state, action: PayloadAction<SignaturePayload>): void => {
      state.doc.profile.signatures[action.payload.key] = action.payload.dataUrl;
    },
    addEvidence: (state, action: PayloadAction<AddEvidencePayload>): void => {
      const { date, image } = action.payload;
      const images = state.doc.evidence[date] ?? [];

      if (images.length < EVIDENCE_MAX_PER_DATE) {
        state.doc.evidence[date] = [...images, image];
      }
    },
    replaceEvidence: (state, action: PayloadAction<ReplaceEvidencePayload>): void => {
      const { date, id, image } = action.payload;
      const images = state.doc.evidence[date];

      if (images) {
        state.doc.evidence[date] = images.map((item) => (item.id === id ? image : item));
      }
    },
    removeEvidence: (state, action: PayloadAction<EvidenceRefPayload>): void => {
      const { date, id } = action.payload;
      const images = (state.doc.evidence[date] ?? []).filter((item) => item.id !== id);

      if (images.length > 0) {
        state.doc.evidence[date] = images;

        return;
      }

      delete state.doc.evidence[date];
    },
    acceptEntries: (state, action: PayloadAction<string[]>): void => {
      const ids = new Set(action.payload);

      state.doc.entries
        .filter((entry) => ids.has(entry.id) && !entry.reviewed)
        .forEach((entry) => {
          const learned = getLearnedTicketName(entry);

          if (learned) {
            state.doc.automation.ticketMap[learned.ticket] = learned.name;
          }

          if (entry.refs?.needsName) {
            entry.refs.needsName = false;
          }

          entry.reviewed = true;
        });
    },
    mergeEntry: (state, action: PayloadAction<MergeEntryPayload>): void => {
      const { sourceId, targetId } = action.payload;
      const source = state.doc.entries.find((entry) => entry.id === sourceId);
      const target = state.doc.entries.find((entry) => entry.id === targetId);

      if (!source || !target || source === target || source.date !== target.date) {
        return;
      }

      target.refs = mergeEntryRefs(target.refs, source.refs);
      state.doc.entries = state.doc.entries.filter((entry) => entry.id !== sourceId);
    },
    setTicketName: (state, action: PayloadAction<TicketNamePayload>): void => {
      const ticket = normalizeTicket(action.payload.ticket);
      const name = action.payload.name.trim();

      if (!ticket) {
        return;
      }

      state.doc.automation.ticketMap[ticket] = action.payload.name;

      if (!name) {
        return;
      }

      state.doc.entries
        .filter((entry) => !entry.reviewed && entry.refs?.needsName && entry.refs.ticket === ticket)
        .forEach((entry) => {
          entry.task = name;
        });
    },
    removeTicketName: (state, action: PayloadAction<string>): void => {
      delete state.doc.automation.ticketMap[normalizeTicket(action.payload)];
    },
    addRepo: (state): void => {
      state.doc.automation.repos.push({ path: "", label: "" });
    },
    updateRepo: (state, action: PayloadAction<UpdateRepoPayload>): void => {
      const repo = state.doc.automation.repos[action.payload.index];

      if (repo) {
        Object.assign(repo, action.payload.changes);
      }
    },
    removeRepo: (state, action: PayloadAction<number>): void => {
      if (state.doc.automation.repos[action.payload]) {
        state.doc.automation.repos.splice(action.payload, 1);
      }
    },
    swapEvidence: (state, action: PayloadAction<string>): void => {
      const images = state.doc.evidence[action.payload];

      if (images?.length === EVIDENCE_MAX_PER_DATE) {
        state.doc.evidence[action.payload] = [images[1], images[0]];
      }
    },
  },
});

export const {
  loadDoc,
  restoreDraft,
  undo,
  redo,
  markSaved,
  changePeriod,
  startNextMonth,
  addEntry,
  addEntries,
  importPreviousMonth,
  updateEntry,
  removeEntry,
  duplicateEntry,
  moveEntry,
  setDayOverride,
  updateProfile,
  updateDefaultHours,
  setSignature,
  addEvidence,
  replaceEvidence,
  removeEvidence,
  swapEvidence,
  acceptEntries,
  mergeEntry,
  setTicketName,
  removeTicketName,
  addRepo,
  updateRepo,
  removeRepo,
} = timesheetSlice.actions;

/**
 * Select the current document.
 * @param {{ timesheet: TimesheetState }} state - Root state
 * @returns {TimesheetDoc} - Document
 */
export const selectDoc = (state: { timesheet: TimesheetState }): TimesheetDoc => state.timesheet.doc;

/**
 * Whether the document has changes not yet written to a file.
 * @param {{ timesheet: TimesheetState }} state - Root state
 * @returns {boolean} - True when dirty
 */
export const selectIsDirty = (state: { timesheet: TimesheetState }): boolean =>
  state.timesheet.doc !== state.timesheet.savedDoc;

/**
 * Whether an undo step is available.
 * @param {{ timesheet: TimesheetState }} state - Root state
 * @returns {boolean} - True when the undo stack is not empty
 */
export const selectCanUndo = (state: { timesheet: TimesheetState }): boolean => state.timesheet.past.length > 0;

/**
 * Whether a redo step is available.
 * @param {{ timesheet: TimesheetState }} state - Root state
 * @returns {boolean} - True when the redo stack is not empty
 */
export const selectCanRedo = (state: { timesheet: TimesheetState }): boolean => state.timesheet.future.length > 0;

/**
 * Number of automatic entries waiting for review.
 * @param {{ timesheet: TimesheetState }} state - Root state
 * @returns {number} - Entries with `reviewed: false`
 */
export const selectPendingReviewCount = (state: { timesheet: TimesheetState }): number =>
  state.timesheet.doc.entries.filter((entry) => !entry.reviewed).length;

/** Validation report and month summary of the current document, recomputed only when it changes. */
export const selectValidationReport: (state: { timesheet: TimesheetState }) => ValidationReport = createSelector(
  [selectDoc],
  (doc: TimesheetDoc): ValidationReport => validateDoc(doc),
);

/** Document edits that can be undone; loading, saving and undo/redo themselves are not recorded. */
const isUndoableAction = isAnyOf(
  changePeriod,
  startNextMonth,
  addEntry,
  addEntries,
  importPreviousMonth,
  updateEntry,
  removeEntry,
  duplicateEntry,
  moveEntry,
  setDayOverride,
  updateProfile,
  updateDefaultHours,
  setSignature,
  addEvidence,
  replaceEvidence,
  removeEvidence,
  swapEvidence,
  acceptEntries,
  mergeEntry,
  setTicketName,
  removeTicketName,
  addRepo,
  updateRepo,
  removeRepo,
);

/**
 * Sorted, comma-joined keys of a change object.
 * @param {object} changes - Changed fields
 * @returns {string} - Key list
 */
const _joinKeys = (changes: ProfileChanges | EntryChanges | DefaultHoursChanges | RepoChanges): string => {
  return Object.keys(changes)
    .sort((a, b) => a.localeCompare(b))
    .join(",");
};

/**
 * Merge key of an edit: typing in the same field forms one undo step; other edits never merge.
 * @param {UnknownAction} action - Dispatched action
 * @returns {string | null} - Merge key, or null for a standalone step
 */
export const getHistoryMergeKey = (action: UnknownAction): string | null => {
  if (updateEntry.match(action)) {
    return `entry:${action.payload.id}:${_joinKeys(action.payload.changes)}`;
  }

  if (updateProfile.match(action)) {
    return `profile:${_joinKeys(action.payload)}`;
  }

  if (updateDefaultHours.match(action)) {
    return `defaults:${_joinKeys(action.payload)}`;
  }

  if (updateRepo.match(action)) {
    return `repo:${action.payload.index}:${_joinKeys(action.payload.changes)}`;
  }

  if (setTicketName.match(action)) {
    return `ticket:${normalizeTicket(action.payload.ticket)}`;
  }

  return null;
};

/**
 * Slice reducer with undo/redo history: every undoable edit that changes the document is recorded.
 * @param {TimesheetState | undefined} state - Current state
 * @param {UnknownAction} action - Dispatched action
 * @returns {TimesheetState} - Next state
 */
const timesheetReducer = (state: TimesheetState | undefined, action: UnknownAction): TimesheetState => {
  const next = timesheetSlice.reducer(state, action);

  if (!state || next.doc === state.doc || !isUndoableAction(action)) {
    return next;
  }

  return recordHistory(state, next, getHistoryMergeKey(action));
};

export { timesheetSlice };

export default timesheetReducer;
