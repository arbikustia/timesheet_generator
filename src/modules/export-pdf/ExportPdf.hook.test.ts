import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { loadOctoberDocWithEvidence, makeDocStore } from "@/fixture/timesheet.fixture";

import { getBlockingMessages, useExportPdf } from "./ExportPdf.hook";

/**
 * October document that passes the export check.
 * @returns {ReturnType<typeof loadOctoberDocWithEvidence>} - Document
 */
const makeReadyDoc = (): ReturnType<typeof loadOctoberDocWithEvidence> => {
  const doc = loadOctoberDocWithEvidence();

  doc.profile.signatures = { preparedBy: "data:image/png;base64,A", leadProject: "data:image/png;base64,B", tribeLeader: "data:image/png;base64,C" };

  return doc;
};

describe("useExportPdf", () => {
  beforeEach(() => {
    Object.defineProperty(window, "print", { configurable: true, value: jest.fn() });
  });

  it("should block the export while the check has errors", () => {
    const onShowCheck = jest.fn();
    const { result } = renderHook(() => useExportPdf(onShowCheck), { wrapper: createStoreWrapper(makeDocStore()) });

    act(() => result.current.onExport());
    expect(window.print).not.toHaveBeenCalled();
    expect(result.current.isBlockedOpen).toBe(true);
    expect(result.current.errorMessages).toHaveLength(3);

    act(() => result.current.onShowCheck());
    expect(result.current.isBlockedOpen).toBe(false);
    expect(onShowCheck).toHaveBeenCalled();

    act(() => result.current.onExport());
    act(() => result.current.onCloseBlocked());
    expect(result.current.isBlockedOpen).toBe(false);
  });

  it("should print a valid document with the PDF file name as title, also via Ctrl+P", () => {
    document.title = "Timesheet Builder";
    renderHook(() => useExportPdf(jest.fn()), { wrapper: createStoreWrapper(makeDocStore(makeReadyDoc())) });

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", ctrlKey: true, cancelable: true }));
    });
    expect(window.print).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("beforeprint"));
    expect(document.title).toBe("BHN II - Timesheet October");
    window.dispatchEvent(new Event("afterprint"));
    expect(document.title).toBe("Timesheet Builder");
  });

  it("should open the preview tab or explain a blocked pop-up", () => {
    const tabDocument = document.implementation.createHTMLDocument("");
    const open = jest.spyOn(window, "open").mockReturnValue(null);
    const { result } = renderHook(() => useExportPdf(jest.fn()), { wrapper: createStoreWrapper(makeDocStore(makeReadyDoc())) });

    act(() => result.current.onOpenTab());
    expect(result.current.tabError).toContain("Tab baru diblokir browser");

    const printRoot = document.createElement("div");

    printRoot.className = "print-root";
    document.body.append(printRoot);
    open.mockReturnValue({ document: tabDocument } as Window);
    act(() => result.current.onOpenTab());
    expect(result.current.tabError).toBeNull();
    expect(tabDocument.title).toBe("BHN II - Timesheet October");
    printRoot.remove();
    open.mockRestore();
  });

  it("should list only the first blocking errors", () => {
    const issues = Array.from({ length: 7 }, (_, index) => ({ id: String(index), level: "error" as const, message: `E${index}`, target: null }));

    expect(getBlockingMessages([...issues, { id: "w", level: "warning", message: "W", target: null }])).toEqual(["E0", "E1", "E2", "E3", "E4"]);
  });
});
