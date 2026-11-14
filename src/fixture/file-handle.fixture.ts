import type { DocumentFileHandle } from "@/types/file.type";

export type FakeHandleOptions = {
  name?: string;
  text?: string;
  permission?: PermissionState;
};

export type FakeFileHandle = {
  handle: DocumentFileHandle;
  written: string[];
  /** Simulate another program rewriting the file (new contents and a newer `lastModified`). */
  changeOnDisk: (text: string) => void;
};

/**
 * Fake Chromium file handle backed by a string.
 * @param {FakeHandleOptions} [options] - Name, contents and permission answer
 * @returns {FakeFileHandle} - Handle and the texts written to it
 */
export const makeFileHandle = (options?: FakeHandleOptions): FakeFileHandle => {
  const written: string[] = [];
  let text = options?.text ?? "";
  let lastModified = 1;
  const handle: DocumentFileHandle = {
    name: options?.name ?? "Timesheet-2026-10-Arbi-Kustia.json",
    getFile: async (): Promise<File> => new File([text], options?.name ?? "doc.json", { lastModified }),
    createWritable: async () => ({
      write: async (chunk: FileSystemWriteChunkType): Promise<void> => {
        written.push(String(chunk));
      },
      close: async (): Promise<void> => {
        text = written.at(-1) ?? text;
        lastModified += 1;
      },
    }),
    queryPermission: async (): Promise<PermissionState> => options?.permission ?? "granted",
    requestPermission: async (): Promise<PermissionState> => options?.permission ?? "granted",
  };

  /**
   * Rewrite the file as another program would.
   * @param {string} next - New contents
   * @returns {void}
   */
  const changeOnDisk = (next: string): void => {
    text = next;
    lastModified += 1;
  };

  return { handle, written, changeOnDisk };
};
