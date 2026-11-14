import type { DocumentFileHandle } from "@/types/file.type";

export type FakeHandleOptions = {
  name?: string;
  text?: string;
  permission?: PermissionState;
};

export type FakeFileHandle = {
  handle: DocumentFileHandle;
  written: string[];
};

/**
 * Fake Chromium file handle backed by a string.
 * @param {FakeHandleOptions} [options] - Name, contents and permission answer
 * @returns {FakeFileHandle} - Handle and the texts written to it
 */
export const makeFileHandle = (options?: FakeHandleOptions): FakeFileHandle => {
  const written: string[] = [];
  const handle: DocumentFileHandle = {
    name: options?.name ?? "Timesheet-2026-10-Arbi-Kustia.json",
    getFile: async (): Promise<File> => new File([options?.text ?? ""], options?.name ?? "doc.json"),
    createWritable: async () => ({
      write: async (text: FileSystemWriteChunkType): Promise<void> => {
        written.push(String(text));
      },
      close: async (): Promise<void> => undefined,
    }),
    queryPermission: async (): Promise<PermissionState> => options?.permission ?? "granted",
    requestPermission: async (): Promise<PermissionState> => options?.permission ?? "granted",
  };

  return { handle, written };
};
