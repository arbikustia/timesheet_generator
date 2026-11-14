import { combineReducers, configureStore } from "@reduxjs/toolkit";

import themeReducer from "./theme.slice";
import timesheetReducer from "./timesheet.slice";

const rootReducer = combineReducers({
  theme: themeReducer,
  timesheet: timesheetReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

/**
 * Create a store; tests pass a preloaded state.
 * @param {Partial<RootState>} [preloadedState] - Initial state
 * @returns {ReturnType<typeof configureStore>} - Redux store
 */
export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    // Documents embed images as data URLs; skip the dev-only deep checks on them.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: { warnAfter: 200 } }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore["dispatch"];

export const store = makeStore();
