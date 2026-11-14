import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import ExportPdfContainer from "./ExportPdf.container";

describe("ExportPdfContainer", () => {
  it("should show the blocking errors of the October fixture", () => {
    const onShowCheck = jest.fn();

    Object.defineProperty(window, "print", { configurable: true, value: jest.fn() });
    renderWithStore(<ExportPdfContainer onShowCheck={onShowCheck} />, makeDocStore().getState());
    fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));

    expect(screen.getByText("Tanda tangan konsultan (Prepared by) belum diunggah.")).toBeInTheDocument();
    expect(window.print).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Lihat Cek export" }));
    expect(onShowCheck).toHaveBeenCalled();
  });
});
