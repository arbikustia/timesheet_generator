import { render, type RenderResult } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";

import { type AppStore, makeStore, type RootState } from "@/store";

export { act, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";

export type SnapshotConfig<T> = {
  desc?: string;
  props: T;
};

export type WrapperProps = {
  children: React.ReactNode;
};

export type SnapshotOptions = {
  wrapper?: React.ComponentType<WrapperProps>;
};

export type RenderWithStoreResult = {
  result: RenderResult;
  store: AppStore;
};

/**
 * Build a component that provides the given Redux store.
 * @param {AppStore} store - Store to provide
 * @returns {React.ComponentType<WrapperProps>} - Provider wrapper
 */
export const createStoreWrapper = (store: AppStore): React.ComponentType<WrapperProps> => {
  const StoreWrapper = ({ children }: WrapperProps): React.ReactElement =>
    React.createElement(Provider, { store, children });

  return StoreWrapper;
};

/**
 * Render inside a fresh Redux store (optionally preloaded) and return the store for assertions.
 * @param {React.ReactElement} ui - Element to render
 * @param {Partial<RootState>} [preloadedState] - Initial store state
 * @returns {RenderWithStoreResult} - Render result plus the store
 */
export const renderWithStore = (ui: React.ReactElement, preloadedState?: Partial<RootState>): RenderWithStoreResult => {
  const store = makeStore(preloadedState);

  return { result: render(ui, { wrapper: createStoreWrapper(store) }), store };
};

/**
 * Utility to run snapshot tests against an array of configs.
 * @param {React.ComponentType<T>} Component - The React component to test
 * @param {SnapshotConfig<T>[]} configs - Array of test configurations
 * @param {SnapshotOptions} [options] - Optional wrapper (e.g. a store provider for containers)
 * @returns {void}
 */
const assertSnapshots = <T extends object>(
  Component: React.ComponentType<T>,
  configs: SnapshotConfig<T>[],
  options?: SnapshotOptions,
): void => {
  const snapshot = (config: SnapshotConfig<T>): void => {
    const { asFragment } = render(React.createElement(Component, config.props), { wrapper: options?.wrapper });

    expect(asFragment()).toMatchSnapshot();
  };

  if (expect.getState().currentTestName) {
    configs.forEach(snapshot);

    return;
  }

  describe(`${Component.displayName || Component.name || "Component"} Snapshots`, () => {
    configs.forEach((config, index) => {
      it(config.desc || `renders snapshot ${index}`, () => {
        snapshot(config);
      });
    });
  });
};

export default {
  assertSnapshots,
};
