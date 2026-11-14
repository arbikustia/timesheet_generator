import { act, createStoreWrapper, renderHook, waitFor } from "@/libs/unit-test";
import { loadDraft, saveDraft } from "@/libs/utils/draft-storage.util";
import { setCurrentFileHandle } from "@/libs/utils/file-handle.registry";

import { selectDoc, selectIsDirty, updateProfile } from "@/store/timesheet.slice";

import { makeFileHandle } from "@/fixture/file-handle.fixture";
import { loadOctoberDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import { runFileAction, useAutosave, useDraftRecovery, usePendingConfirm } from "./FileMenu.hook";

afterEach(() => {
  jest.useRealTimers();
  setCurrentFileHandle(null);
});

describe("usePendingConfirm", () => {
  it("should run immediately when clean and ask first when dirty", () => {
    const actions = { new: jest.fn(), open: jest.fn(), "open-last": jest.fn() };
    const { result, rerender } = renderHook(({ isDirty }) => usePendingConfirm(isDirty, actions), { initialProps: { isDirty: false } });

    act(() => result.current.request("new"));
    expect(actions.new).toHaveBeenCalledTimes(1);

    rerender({ isDirty: true });
    act(() => result.current.request("open"));
    expect(result.current.pendingConfirm).toBe("open");
    expect(actions.open).not.toHaveBeenCalled();

    act(() => result.current.onConfirm());
    expect(actions.open).toHaveBeenCalledTimes(1);
    expect(result.current.pendingConfirm).toBeNull();

    act(() => result.current.request("open-last"));
    act(() => result.current.onCancelConfirm());
    act(() => result.current.onConfirm());
    expect(actions["open-last"]).not.toHaveBeenCalled();
  });
});

describe("runFileAction", () => {
  it("should report errors as notices", async () => {
    const setNotice = jest.fn();

    await runFileAction(() => Promise.reject(new Error("disk full")), setNotice, "Gagal menyimpan");
    await runFileAction(() => Promise.reject("weird"), setNotice, "Gagal");

    expect(setNotice).toHaveBeenNthCalledWith(1, { type: "error", text: "Gagal menyimpan: disk full" });
    expect(setNotice).toHaveBeenNthCalledWith(2, { type: "error", text: "Gagal: weird" });
  });
});

describe("useAutosave", () => {
  it("should write a draft 1.5s after a change when there is no file", async () => {
    jest.useFakeTimers();
    const store = makeDocStore();
    const { result } = renderHook(() => useAutosave(), { wrapper: createStoreWrapper(store) });

    act(() => {
      store.dispatch(updateProfile({ squad: "Epics X" }));
    });
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    jest.useRealTimers();

    await waitFor(() => expect(result.current).not.toBeNull());
    expect((await loadDraft())?.doc.profile.squad).toBe("Epics X");
  });

  it("should write to the open file when write permission is already granted", async () => {
    jest.useFakeTimers();
    const { handle, written } = makeFileHandle();
    const store = makeDocStore();

    setCurrentFileHandle(handle);
    renderHook(() => useAutosave(), { wrapper: createStoreWrapper(store) });

    act(() => {
      store.dispatch(updateProfile({ squad: "Epics Y" }));
    });
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    jest.useRealTimers();

    await waitFor(() => expect(selectIsDirty(store.getState())).toBe(false));
    expect(written[0]).toContain("Epics Y");
  });
});

describe("useDraftRecovery", () => {
  it("should offer a stored draft and restore it as unsaved changes", async () => {
    const draftDoc = loadOctoberDoc();

    draftDoc.profile.squad = "From draft";
    await saveDraft(draftDoc);

    const store = makeDocStore();
    const { result } = renderHook(() => useDraftRecovery(), { wrapper: createStoreWrapper(store) });

    await waitFor(() => expect(result.current.draft).not.toBeNull());
    act(() => result.current.onRestoreDraft());

    expect(selectDoc(store.getState()).profile.squad).toBe("From draft");
    expect(selectIsDirty(store.getState())).toBe(true);
    expect(result.current.draft).toBeNull();
  });

  it("should discard a draft", async () => {
    await saveDraft(loadOctoberDoc());

    const { result } = renderHook(() => useDraftRecovery(), { wrapper: createStoreWrapper(makeDocStore()) });

    await waitFor(() => expect(result.current.draft).not.toBeNull());
    act(() => result.current.onDiscardDraft());

    expect(result.current.draft).toBeNull();
    await waitFor(async () => expect(await loadDraft()).toBeNull());
  });
});
