import { render, screen, within } from "@/libs/unit-test";

import { loadOctoberDocWithEvidence } from "@/fixture/timesheet.fixture";

import TimesheetDocumentContainer from "./TimesheetDocument.container";

/**
 * Render the October golden document and return all table body rows across sheet pages.
 * @returns {HTMLElement[]} - Body rows in order
 */
const renderGoldenRows = (): HTMLElement[] => {
  render(<TimesheetDocumentContainer doc={loadOctoberDocWithEvidence()} />);

  return screen.getAllByTestId("sheet-table").flatMap((table) => Array.from(table.querySelectorAll("tbody tr")) as HTMLElement[]);
};

/**
 * Text of every cell of a row.
 * @param {HTMLElement} row - Table row
 * @returns {string[]} - Cell texts
 */
const getCellTexts = (row: HTMLElement): string[] => {
  return within(row).getAllByRole("cell").map((cell) => cell.textContent ?? "");
};

describe("TimesheetDocumentContainer — October 2026 golden test", () => {
  it("should render 31 dates with 07/10/2026 on two rows", () => {
    const dates = renderGoldenRows().map((row) => getCellTexts(row)[0]);

    expect(dates).toHaveLength(32);
    expect(new Set(dates).size).toBe(31);
    expect(dates.filter((date) => date === "07/10/2026")).toHaveLength(2);
  });

  it("should render the weekends as red Weekend rows with empty task and times", () => {
    const offRows = renderGoldenRows().filter((row) => row.getAttribute("data-row-kind") === "off");

    expect(offRows.map((row) => getCellTexts(row)[0].slice(0, 2))).toEqual(["03", "04", "10", "11", "17", "18", "24", "25", "31"]);
    offRows.forEach((row) => {
      expect(getCellTexts(row).slice(1)).toEqual(["", "", "", "Weekend"]);
      expect(row).toHaveStyle({ background: "#C00000", color: "#FFFFFF" });
    });
  });

  it("should render the fixture values and evidence page remarks", () => {
    const rows = renderGoldenRows();

    expect(getCellTexts(rows[0])).toEqual([
      "01/10/2026",
      "Tech debt case admin list",
      "08:04",
      "17:00",
      "Foto / ScreenshotEvidence Page 1",
    ]);
    expect(getCellTexts(rows[5])).toEqual([
      "06/10/2026",
      "Tech debt case admin detail",
      "08:00",
      "17:04",
      "Foto / ScreenshotEvidence Page 2",
    ]);
    expect(getCellTexts(rows.at(-2) as HTMLElement)).toEqual([
      "30/10/2026",
      "Fixing code new business for deployment",
      "08:00",
      "17:00",
      "Foto / ScreenshotEvidence Page 6",
    ]);
  });

  it("should render the red table header with exact labels and column widths only on the first page", () => {
    renderGoldenRows();

    const [firstTable, secondTable] = screen.getAllByTestId("sheet-table");
    const headers = within(firstTable).getAllByRole("columnheader");
    const widths = Array.from(firstTable.querySelectorAll("col")).map((col) => (col as HTMLElement).style.width);

    expect(headers.map((header) => header.textContent)).toEqual([
      "Date",
      "Task /Activities/ Project Name/ Ticket Number",
      "Start Time",
      "End Time",
      "Remark",
    ]);
    expect(firstTable.querySelector("thead tr")).toHaveStyle({ background: "#C00000", color: "#FFFFFF" });
    expect(widths).toEqual(["66pt", "246pt", "42pt", "43pt", "120pt"]);
    expect(within(secondTable).queryAllByRole("columnheader")).toHaveLength(0);
  });

  it("should render the header block, signature, cover and evidence pages", () => {
    renderGoldenRows();

    expect(screen.getByRole("heading", { name: "TIMESHEET" })).toBeInTheDocument();
    expect(screen.getByText("Consultan Role")).toBeInTheDocument();
    expect(screen.getAllByText("Date: 30 October 2026")).toHaveLength(3);
    expect(screen.getByText("EVIDENCE OCTOBER 2026 – ARBI KUSTIA – FRONT END DEVELOPER – EPICS ASUM")).toBeInTheDocument();
    expect(screen.getByText("Page | 1")).toBeInTheDocument();
    expect(screen.getByText("Page | 6")).toBeInTheDocument();
    expect(screen.getByText("Foto / Screenshot Evidence")).toBeInTheDocument();
    expect(screen.getByText("05-10-2026").closest("[data-page-kind]")).toHaveTextContent("Page | 1");
    expect(screen.getByText("06-10-2026").closest("[data-page-kind]")).toHaveTextContent("Page | 2");
  });
});
