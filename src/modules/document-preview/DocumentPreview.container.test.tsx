import { renderWithStore, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import DocumentPreviewContainer from "./DocumentPreview.container";

describe("DocumentPreviewContainer", () => {
  it("should preview the store document", () => {
    renderWithStore(<DocumentPreviewContainer />, { timesheet: { doc: loadOctoberDoc() } });

    expect(screen.getAllByText("Tech debt case admin detail", { selector: "td" })).toHaveLength(3);
  });
});
