export type FakeCanvasContext = {
  drawImage: jest.Mock;
  fillRect: jest.Mock;
  clearRect: jest.Mock;
  fillStyle: string;
  filter: string;
  imageSmoothingEnabled: boolean;
};

export type FakeCanvas = {
  contexts: FakeCanvasContext[];
  filters: string[];
  restore: () => void;
};

export const FAKE_JPEG_DATA_URL = "data:image/jpeg;base64,/9j/AA==";

/**
 * Install a fake 2D canvas and `createImageBitmap` (jsdom implements neither).
 * Decoded images are 3200×1800 unless a size is given.
 * @param {number} [width=3200] - Decoded image width
 * @param {number} [height=1800] - Decoded image height
 * @returns {FakeCanvas} - Created contexts, filters applied while drawing, and a restore function
 */
export const installFakeCanvas = (width: number = 3200, height: number = 1800): FakeCanvas => {
  const contexts: FakeCanvasContext[] = [];
  const filters: string[] = [];
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalToDataUrl = HTMLCanvasElement.prototype.toDataURL;
  const getContext = jest.fn(() => {
    const context: FakeCanvasContext = {
      drawImage: jest.fn(() => filters.push(context.filter)),
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      fillStyle: "",
      filter: "none",
      imageSmoothingEnabled: false,
    };

    contexts.push(context);

    return context;
  });

  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: getContext, configurable: true, writable: true });
  Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
    value: jest.fn(() => FAKE_JPEG_DATA_URL),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "createImageBitmap", {
    value: jest.fn(async () => ({ width, height, close: jest.fn() })),
    configurable: true,
    writable: true,
  });

  return {
    contexts,
    filters,
    restore: (): void => {
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: originalGetContext, configurable: true, writable: true });
      Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", { value: originalToDataUrl, configurable: true, writable: true });
      Reflect.deleteProperty(globalThis, "createImageBitmap");
    },
  };
};
