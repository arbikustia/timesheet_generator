import { render, screen } from "@/libs/unit-test";

import { loadOctoberDoc, loadOctoberDocWithEvidence } from "@/fixture/timesheet.fixture";

import TimesheetDocumentComponent from "./TimesheetDocument.component";
import { buildDocumentView } from "./TimesheetDocument.util";

/**
 * Read the page kinds in render order.
 * @param {HTMLElement} root - Document root
 * @returns {string[]} - `data-page-kind` values
 */
const getPageKinds = (root: HTMLElement): string[] => {
  return Array.from(root.querySelectorAll("[data-page-kind]")).map((page) => page.getAttribute("data-page-kind") ?? "");
};

describe("TimesheetDocumentComponent", () => {
  it("should render timesheet, signature, cover and evidence pages in order", () => {
    render(<TimesheetDocumentComponent view={buildDocumentView(loadOctoberDocWithEvidence())} />);

    expect(getPageKinds(screen.getByTestId("timesheet-document"))).toEqual([
      "sheet",
      "sheet",
      "signature",
      "cover",
      ...Array(6).fill("evidence"),
    ]);
  });

  it("should render no evidence page when there is no evidence", () => {
    render(<TimesheetDocumentComponent view={buildDocumentView(loadOctoberDoc())} />);

    expect(getPageKinds(screen.getByTestId("timesheet-document"))).toEqual(["sheet", "sheet", "signature", "cover"]);
  });
});
