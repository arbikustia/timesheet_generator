import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { getCurrentPeriod } from "@/libs/utils/date.util";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";
import {
  createId,
  createNextMonthDoc,
  insertEntrySorted,
  moveItem,
  resetDocToPeriod,
  shiftDocToPeriod,
} from "@/libs/utils/timesheet-mutation.util";

import type { Entry, TimesheetDoc } from "@/types/timesheet.type";
import type {
  ChangePeriodPayload,
  DayOverridePayload,
  DefaultHoursChanges,
  MoveEntryPayload,
  NewEntryInput,
  ProfileChanges,
  SignaturePayload,
  UpdateEntryPayload,
} from "@/types/timesheet-edit.type";

import type { TimesheetState } from "./timesheet.type";

/**
 * Initial state: an empty document for the current month.
 * @param {Date} [now=new Date()] - Reference date
 * @returns {TimesheetState} - Initial state
 */
export const createInitialTimesheetState = (now: Date = new Date()): TimesheetState => {
  return { doc: createEmptyDoc(getCurrentPeriod(now)) };
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
    loadDoc: (state, action: PayloadAction<TimesheetDoc>): void => {
      state.doc = action.payload;
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
    updateEntry: (state, action: PayloadAction<UpdateEntryPayload>): void => {
      const entry = state.doc.entries.find((item) => item.id === action.payload.id);

      if (entry) {
        Object.assign(entry, action.payload.changes);
      }
    },
    removeEntry: (state, action: PayloadAction<string>): void => {
      state.doc.entries = state.doc.entries.filter((entry) => entry.id !== action.payload);
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
  },
});

export const {
  loadDoc,
  changePeriod,
  startNextMonth,
  addEntry,
  updateEntry,
  removeEntry,
  duplicateEntry,
  moveEntry,
  setDayOverride,
  updateProfile,
  updateDefaultHours,
  setSignature,
} = timesheetSlice.actions;

/**
 * Select the current document.
 * @param {{ timesheet: TimesheetState }} state - Root state
 * @returns {TimesheetDoc} - Document
 */
export const selectDoc = (state: { timesheet: TimesheetState }): TimesheetDoc => state.timesheet.doc;

export { timesheetSlice };

export default timesheetSlice.reducer;
