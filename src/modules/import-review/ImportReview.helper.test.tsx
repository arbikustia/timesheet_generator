import { render, screen } from "@/libs/unit-test";

import { loadReviewDoc } from "@/fixture/timesheet.fixture";

import { renderItemDetails } from "./ImportReview.helper";
import { buildReviewItem } from "./ImportReview.util";

describe("ImportReview helpers", () => {
  it("should render minimal details of a manual-looking item", () => {
    const entry = { ...loadReviewDoc().entries[2], source: "vscode" as const, refs: undefined };

    render(<div>{renderItemDetails(buildReviewItem(entry, [entry]))}</div>);

    expect(screen.getByText("VS Code")).toBeInTheDocument();
    expect(screen.queryByText(/file tersentuh/)).not.toBeInTheDocument();
  });
});
