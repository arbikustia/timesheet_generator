import { get, set } from "idb-keyval";

import {
  _attempt,
  clearDraft,
  loadDraft,
  loadLastFileHandle,
  rememberFileHandle,
  saveDraft,
  STORAGE_KEYS,
} from "@/libs/utils/draft-storage.util";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

describe("draft storage", () => {
  it("should save, load and clear a draft", async () => {
    await saveDraft(loadOctoberDoc(), new Date("2026-11-14T10:00:00Z"));

    const draft = await loadDraft();

    expect(draft?.savedAt).toBe("2026-11-14T10:00:00.000Z");
    expect(draft?.doc.entries).toHaveLength(23);

    await clearDraft();
    await expect(loadDraft()).resolves.toBeNull();
  });

  it("should discard a broken draft", async () => {
    await set(STORAGE_KEYS.DRAFT, { savedAt: "x", text: "{broken" });

    await expect(loadDraft()).resolves.toBeNull();
    await expect(get(STORAGE_KEYS.DRAFT)).resolves.toBeUndefined();
  });

  it("should remember and load the last file handle", async () => {
    const handle = { name: "doc.json" } as FileSystemFileHandle;

    await expect(loadLastFileHandle()).resolves.toBeNull();
    await rememberFileHandle(handle);
    await expect(loadLastFileHandle()).resolves.toBe(handle);
  });

  it("should ignore storage failures, including synchronous throws", async () => {
    jest.mocked(get).mockRejectedValueOnce(new Error("private mode"));
    await expect(loadDraft()).resolves.toBeNull();

    await expect(
      _attempt(() => {
        throw new ReferenceError("indexedDB is not defined");
      }),
    ).resolves.toBeUndefined();
  });
});
