import { createTimesheetState } from "@/store/timesheet.slice";
import { renderWithStore, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import DocumentPreviewContainer from "./DocumentPreview.container";

describe("DocumentPreviewContainer", () => {
  it("should preview the store document", () => {
    renderWithStore(<DocumentPreviewContainer />, { timesheet: createTimesheetState(loadOctoberDoc()) });

    expect(screen.getAllByText("Tech debt case admin detail", { selector: "td" })).toHaveLength(3);
  });
});
