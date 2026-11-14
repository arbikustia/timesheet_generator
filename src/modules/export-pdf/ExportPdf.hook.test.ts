import { act, createStoreWrapper, renderHook } from "@/libs/unit-test";

import { loadOctoberDocWithEvidence, makeDocStore } from "@/fixture/timesheet.fixture";

import { useExportPdf } from "./ExportPdf.hook";

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
});
