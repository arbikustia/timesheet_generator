import { render, screen } from "@/libs/unit-test";

import { SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

import {
  renderEvidenceImage,
  renderEvidenceSlot,
  renderInfoCells,
  renderSheetRow,
  renderSignatureImageCell,
} from "./TimesheetDocument.helper";

/**
 * Render table cells inside a valid table.
 * @param {React.ReactNode} cells - Cells or rows to mount
 * @returns {void}
 */
const renderInTable = (cells: React.ReactNode): void => {
  render(
    <table>
      <tbody>{cells}</tbody>
    </table>,
  );
};

describe("TimesheetDocument helpers", () => {
  it("should render an info line without colon when it has no value", () => {
    renderInTable(<tr>{renderInfoCells({ label: "Legacy Platform", value: null }, 99)}</tr>);

    const cells = screen.getAllByRole("cell");

    expect(cells.map((cell) => cell.textContent)).toEqual(["Legacy Platform", "", ""]);
  });

  it("should render an info line with colon and value", () => {
    renderInTable(<tr>{renderInfoCells({ label: "Squad", value: "Epics Asum" }, 99)}</tr>);

    expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["Squad", ":", "Epics Asum"]);
  });

  it("should render an off row with empty task and times", () => {
    renderInTable(
      renderSheetRow({
        row: { kind: "off", key: "03", date: "2026-10-03", reason: "weekend", remark: "Weekend" },
        heightPt: 22,
      }),
    );

    expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["03/10/2026", "", "", "", "Weekend"]);
    expect(screen.getByRole("row")).toHaveStyle({ height: "22pt", background: "#C00000" });
  });

  it("should render an empty working-day row", () => {
    renderInTable(renderSheetRow({ row: { kind: "empty", key: "05", date: "2026-10-05" }, heightPt: 39 }));

    expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(["05/10/2026", "", "", "", ""]);
  });

  it("should render the signature image only when uploaded", () => {
    renderInTable(
      <tr>
        {renderSignatureImageCell({ key: "preparedBy", nameLabel: "Name : A", imageSrc: null })}
        {renderSignatureImageCell({ key: "leadProject", nameLabel: "Name: B", imageSrc: "data:image/png;base64,AA" })}
      </tr>,
    );

    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Tanda tangan Name: B");
  });

  it("should render an empty evidence box without image", () => {
    const { container } = render(renderEvidenceImage("right"));

    expect(container.querySelector("img")).toBeNull();
    expect(container.firstChild).toHaveAttribute("data-evidence-side", "right");
  });

  it("should render an evidence slot with dash date label and images", () => {
    render(renderEvidenceSlot({ date: "2026-10-07", images: [SAMPLE_IMAGE] }, 66));

    expect(screen.getByText("07-10-2026")).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});
