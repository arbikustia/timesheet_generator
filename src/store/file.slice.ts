import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { FileInfoPayload, FileState } from "./file.type";

const initialState: FileState = { fileName: null, hasHandle: false, lastSavedAt: null };

const fileSlice = createSlice({
  name: "file",
  initialState,
  reducers: {
    setFileInfo: (state, action: PayloadAction<FileInfoPayload>): void => {
      state.fileName = action.payload.fileName;
      state.hasHandle = action.payload.hasHandle;
    },
    setLastSavedAt: (state, action: PayloadAction<string>): void => {
      state.lastSavedAt = action.payload;
    },
    resetFile: (): FileState => initialState,
  },
});

export const { setFileInfo, setLastSavedAt, resetFile } = fileSlice.actions;

/**
 * Select the file state.
 * @param {{ file: FileState }} state - Root state
 * @returns {FileState} - File state
 */
export const selectFile = (state: { file: FileState }): FileState => state.file;

export { fileSlice };

export default fileSlice.reducer;
