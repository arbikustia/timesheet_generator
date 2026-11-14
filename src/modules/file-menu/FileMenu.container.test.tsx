import { act, fireEvent, renderWithStore, screen, waitFor } from "@/libs/unit-test";
import { loadLastFileHandle, rememberFileHandle } from "@/libs/utils/draft-storage.util";
import { getCurrentFileHandle, setCurrentFileHandle } from "@/libs/utils/file-handle.registry";
import { serializeTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import { selectFile } from "@/store/file.slice";
import { createTimesheetState, selectDoc, selectIsDirty, updateProfile } from "@/store/timesheet.slice";

import { makeFileHandle } from "@/fixture/file-handle.fixture";
import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import FileMenuContainer from "./FileMenu.container";

/**
 * Render the menu with the October document.
 * @returns {ReturnType<typeof renderWithStore>["store"]} - Store
 */
const renderMenu = (): ReturnType<typeof renderWithStore>["store"] =>
  renderWithStore(<FileMenuContainer />, { timesheet: createTimesheetState(loadOctoberDoc()) }).store;

afterEach(() => {
  delete window.showOpenFilePicker;
  delete window.showSaveFilePicker;
  setCurrentFileHandle(null);
  jest.restoreAllMocks();
});

describe("FileMenuContainer — fallback browsers", () => {
  it("should download on Simpan and mark the document saved", async () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const store = renderMenu();

    URL.createObjectURL = jest.fn(() => "blob:1");
    URL.revokeObjectURL = jest.fn();
    act(() => {
      store.dispatch(updateProfile({ squad: "Epics X" }));
    });
    expect(screen.getByTestId("file-status")).toHaveTextContent("Belum disimpan ●");

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(selectIsDirty(store.getState())).toBe(false));
    expect(click).toHaveBeenCalled();
    expect(selectFile(store.getState()).fileName).toBe("Timesheet-2026-10-Arbi-Kustia.json");
    expect(await screen.findByRole("status")).toHaveTextContent("Tersimpan: Timesheet-2026-10-Arbi-Kustia.json");
  });

  it("should open a document through the file input", async () => {
    const click = jest.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => undefined);
    const store = renderMenu();
    const other = loadOctoberDoc();

    other.profile.squad = "Opened";
    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    expect(click).toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Pilih file dokumen"), {
      target: { files: [new File([serializeTimesheetDoc(other)], "opened.json")] },
    });

    await waitFor(() => expect(selectDoc(store.getState()).profile.squad).toBe("Opened"));
    expect(selectFile(store.getState())).toMatchObject({ fileName: "opened.json", hasHandle: false });
  });

  it("should show a clear error for a broken file and keep the document", async () => {
    const store = renderMenu();

    fireEvent.change(screen.getByLabelText("Pilih file dokumen"), { target: { files: [new File(["{oops"], "rusak.json")] } });

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal membuka rusak.json: File bukan JSON yang valid atau rusak.");
    expect(selectDoc(store.getState()).entries).toHaveLength(23);
  });

  it("should ask before discarding changes with Baru", () => {
    const store = renderMenu();

    act(() => {
      store.dispatch(updateProfile({ squad: "Unsaved" }));
    });
    fireEvent.click(screen.getByRole("button", { name: "Baru" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut tanpa menyimpan" }));

    expect(selectDoc(store.getState()).entries).toEqual([]);
    expect(selectIsDirty(store.getState())).toBe(false);
    expect(screen.getByTestId("file-status")).toHaveTextContent("Dokumen baru · Tersimpan");
  });
});

describe("FileMenuContainer — File System Access", () => {
  it("should save as through the picker, then save in place with Ctrl+S", async () => {
    const { handle, written } = makeFileHandle();

    window.showOpenFilePicker = jest.fn();
    window.showSaveFilePicker = jest.fn().mockResolvedValue(handle);
    const store = renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Simpan Sebagai" }));
    await waitFor(() => expect(written).toHaveLength(1));
    expect(getCurrentFileHandle()).toBe(handle);
    expect(selectFile(store.getState())).toMatchObject({ fileName: handle.name, hasHandle: true });

    act(() => {
      store.dispatch(updateProfile({ squad: "Edited" }));
    });
    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    await waitFor(() => expect(written).toHaveLength(2));
    expect(written[1]).toContain("Edited");
    expect(window.showSaveFilePicker).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Buka terakhir" })).toBeInTheDocument();
  });

  it("should do nothing when the save dialog is cancelled", async () => {
    window.showOpenFilePicker = jest.fn();
    window.showSaveFilePicker = jest.fn(async () => Promise.reject(new DOMException("cancel", "AbortError")));
    const store = renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Simpan Sebagai" }));

    await waitFor(() => expect(window.showSaveFilePicker).toHaveBeenCalled());
    expect(selectFile(store.getState()).fileName).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("should report a denied write permission", async () => {
    setCurrentFileHandle(makeFileHandle({ permission: "denied" }).handle);
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Gagal menyimpan: izin menulis file ditolak");
  });

  it("should open with the picker and re-open the last file", async () => {
    const other = loadOctoberDoc();

    other.profile.squad = "Last";
    const { handle } = makeFileHandle({ name: "last.json", text: serializeTimesheetDoc(other) });

    const picked = makeFileHandle({ name: "picked.json", text: serializeTimesheetDoc(loadOctoberDoc()) }).handle;

    await rememberFileHandle(handle);
    window.showOpenFilePicker = jest.fn().mockResolvedValue([picked]);
    window.showSaveFilePicker = jest.fn();
    const store = renderMenu();

    fireEvent.click(await screen.findByRole("button", { name: "Buka terakhir" }));
    await waitFor(() => expect(selectDoc(store.getState()).profile.squad).toBe("Last"));
    expect(getCurrentFileHandle()).toBe(handle);

    fireEvent.click(screen.getByRole("button", { name: "Buka" }));
    await waitFor(() => expect(screen.getByTestId("file-status")).toHaveTextContent("picked.json"));
    await waitFor(async () => expect(await loadLastFileHandle()).toBe(picked));
  });

  it("should report a missing or refused last file", async () => {
    await rememberFileHandle(makeFileHandle({ permission: "denied" }).handle);
    window.showOpenFilePicker = jest.fn();
    window.showSaveFilePicker = jest.fn();
    renderMenu();

    fireEvent.click(await screen.findByRole("button", { name: "Buka terakhir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Izin akses file terakhir ditolak");
  });
});
