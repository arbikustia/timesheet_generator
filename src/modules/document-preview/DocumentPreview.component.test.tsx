import { render, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import DocumentPreviewComponent from "./DocumentPreview.component";

describe("DocumentPreviewComponent", () => {
  it("should render the document pages with the zoom factor", () => {
    render(<DocumentPreviewComponent doc={loadOctoberDoc()} containerRef={{ current: null }} zoom={0.5} />);

    expect(screen.getByRole("region", { name: "Pratinjau dokumen" })).toBeInTheDocument();
    expect(screen.getByTestId("preview-zoom")).toHaveAttribute("data-zoom", "0.500");
    expect(screen.getByRole("heading", { name: "TIMESHEET" })).toBeInTheDocument();
  });
});
