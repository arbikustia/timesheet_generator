import '@testing-library/jest-dom';

// jsdom has no layout engine; Ant Design subscribes to browser APIs.
Object.defineProperty(globalThis, 'MessageChannel', {
  value: class {
    port1 = { onmessage: (): void => {} };
    port2 = { postMessage: (): void => { setTimeout(this.port1.onmessage, 0); } };
  },
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })),
});

jest.mock('./store/theme.hook', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  }),
}));

// jsdom has no IndexedDB: back idb-keyval with an in-memory map, emptied before every test.
jest.mock('idb-keyval', () => {
  const memory = new Map();

  return {
    get: jest.fn(async (key: string) => memory.get(key)),
    set: jest.fn(async (key: string, value: object) => {
      memory.set(key, value);
    }),
    del: jest.fn(async (key: string) => {
      memory.delete(key);
    }),
    clear: jest.fn(async () => {
      memory.clear();
    }),
  };
});

beforeEach(async () => {
  await jest.requireMock<{ clear: () => Promise<void> }>('idb-keyval').clear();
});
