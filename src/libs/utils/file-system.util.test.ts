import {
  assertUnchangedOnDisk,
  downloadTextFile,
  ensureHandlePermission,
  hasHandlePermission,
  isFileSystemAccessSupported,
  openFileWithPicker,
  pickSaveHandle,
  readInputFile,
  runPicker,
  writeTextToHandle,
} from "@/libs/utils/file-system.util";

import type { PermissionTarget } from "@/types/file.type";

/**
 * Fake readable handle returned by the open picker.
 * @returns {FileSystemFileHandle} - Handle with `getFile`
 */
const makeReadHandle = (): FileSystemFileHandle =>
  ({
    kind: "file",
    name: "doc.json",
    getFile: async (): Promise<File> => new File(["{\"a\":1}"], "doc.json", { type: "application/json" }),
  }) as FileSystemFileHandle;

/**
 * Fake permission target.
 * @param {PermissionState} query - Answer of queryPermission
 * @param {PermissionState} [request] - Answer of requestPermission
 * @returns {PermissionTarget} - Target
 */
const makePermissionTarget = (query: PermissionState, request?: PermissionState): PermissionTarget => ({
  queryPermission: async (): Promise<PermissionState> => query,
  requestPermission: async (): Promise<PermissionState> => request ?? query,
});

afterEach(() => {
  delete window.showOpenFilePicker;
  delete window.showSaveFilePicker;
});

describe("isFileSystemAccessSupported", () => {
  it("should detect both pickers", () => {
    expect(isFileSystemAccessSupported()).toBe(false);

    window.showOpenFilePicker = jest.fn();
    window.showSaveFilePicker = jest.fn();
    expect(isFileSystemAccessSupported()).toBe(true);
  });
});

describe("runPicker", () => {
  it("should return null when the user cancels and rethrow other errors", async () => {
    await expect(runPicker(() => Promise.reject(new DOMException("x", "AbortError")))).resolves.toBeNull();
    await expect(runPicker(() => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    await expect(runPicker(() => Promise.resolve(1))).resolves.toBe(1);
  });
});

describe("pickers", () => {
  it("should open and read the chosen file", async () => {
    const handle = makeReadHandle();

    window.showOpenFilePicker = jest.fn(async () => [handle]);

    await expect(openFileWithPicker()).resolves.toEqual({ name: "doc.json", text: "{\"a\":1}", handle, lastModified: expect.any(Number) });
  });

  it("should return null when nothing is picked or pickers are missing", async () => {
    window.showOpenFilePicker = jest.fn(async () => []);
    await expect(openFileWithPicker()).resolves.toBeNull();

    delete window.showOpenFilePicker;
    await expect(openFileWithPicker()).resolves.toBeNull();
    await expect(pickSaveHandle("a.json")).resolves.toBeNull();
  });

  it("should pass the suggested name to the save picker", async () => {
    const handle = makeReadHandle();

    window.showSaveFilePicker = jest.fn(async () => handle);

    await expect(pickSaveHandle("Timesheet-2026-10.json")).resolves.toBe(handle);
    expect(window.showSaveFilePicker).toHaveBeenCalledWith(expect.objectContaining({ suggestedName: "Timesheet-2026-10.json" }));
  });
});

describe("handles", () => {
  it("should write and close", async () => {
    const write = jest.fn();
    const close = jest.fn();

    await writeTextToHandle({ createWritable: async () => ({ write, close }) }, "text");

    expect(write).toHaveBeenCalledWith("text");
    expect(close).toHaveBeenCalled();
  });

  it("should check and request permission", async () => {
    await expect(hasHandlePermission({}, "readwrite")).resolves.toBe(true);
    await expect(hasHandlePermission(makePermissionTarget("prompt"), "readwrite")).resolves.toBe(false);
    await expect(ensureHandlePermission(makePermissionTarget("granted"), "read")).resolves.toBe(true);
    await expect(ensureHandlePermission(makePermissionTarget("prompt", "granted"), "read")).resolves.toBe(true);
    await expect(ensureHandlePermission(makePermissionTarget("prompt", "denied"), "read")).resolves.toBe(false);
    await expect(ensureHandlePermission({ queryPermission: async () => "prompt" }, "read")).resolves.toBe(false);
  });
});

describe("fallback", () => {
  it("should read an input file without a handle", async () => {
    await expect(readInputFile(new File(["hi"], "x.json"))).resolves.toEqual({ name: "x.json", text: "hi", handle: null, lastModified: null });
  });

  it("should download text through a temporary link", () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    URL.createObjectURL = jest.fn(() => "blob:1");
    URL.revokeObjectURL = jest.fn();

    downloadTextFile("{}", "doc.json");

    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:1");
    click.mockRestore();
  });
});

describe("assertUnchangedOnDisk", () => {
  it("should only reject when the known timestamp differs", async () => {
    const handle = { getFile: async (): Promise<File> => new File(["x"], "doc.json", { lastModified: 5 }) };

    await expect(assertUnchangedOnDisk(handle, null)).resolves.toBeUndefined();
    await expect(assertUnchangedOnDisk(handle, 5)).resolves.toBeUndefined();
    await expect(assertUnchangedOnDisk(handle, 4)).rejects.toThrow("file berubah di disk");
  });
});
