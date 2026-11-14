import { fireEvent, renderWithStore, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import ExportPdfComponent from "./ExportPdf.component";
import type { ExportPdfProps } from "./ExportPdf.type";

/**
 * Build component props.
 * @param {Partial<ExportPdfProps>} [overrides] - Prop overrides
 * @returns {ExportPdfProps} - Props
 */
const makeProps = (overrides?: Partial<ExportPdfProps>): ExportPdfProps => ({
  doc: loadOctoberDoc(),
  printContainer: document.body,
  errorMessages: ["Nama Tribe Leader kosong."],
  isBlockedOpen: false,
  onExport: jest.fn(),
  onCloseBlocked: jest.fn(),
  onShowCheck: jest.fn(),
  ...overrides,
});

describe("ExportPdfComponent", () => {
  it("should export on click and mount the hidden print copy", () => {
    const props = makeProps();

    renderWithStore(<ExportPdfComponent {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Export PDF" }));

    expect(props.onExport).toHaveBeenCalled();
    expect(screen.getByTestId("print-root")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("print-root").querySelectorAll("[data-page-kind]").length).toBeGreaterThan(3);
  });

  it("should list blocking errors", () => {
    const props = makeProps({ isBlockedOpen: true });

    renderWithStore(<ExportPdfComponent {...props} />);

    expect(screen.getByText("Nama Tribe Leader kosong.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Lihat Cek export" }));
    fireEvent.click(screen.getByRole("button", { name: "Tutup" }));

    expect(props.onShowCheck).toHaveBeenCalled();
    expect(props.onCloseBlocked).toHaveBeenCalled();
  });
});
