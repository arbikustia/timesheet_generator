import { fireEvent, render, screen } from "@/libs/unit-test";

import { loadReviewDoc } from "@/fixture/timesheet.fixture";

import ImportReviewComponent from "./ImportReview.component";
import type { ImportReviewProps } from "./ImportReview.type";
import { buildReviewWeeks } from "./ImportReview.util";

/**
 * Build component props.
 * @param {Partial<ImportReviewProps>} [overrides] - Prop overrides
 * @returns {ImportReviewProps} - Props
 */
const makeProps = (overrides?: Partial<ImportReviewProps>): ImportReviewProps => ({
  weeks: buildReviewWeeks(loadReviewDoc()),
  pendingCount: 2,
  snapshotCommand: "timesheet snapshot",
  importCommand: 'timesheet import --doc "doc.json" --month 2026-11',
  isCopied: false,
  onCopyCommand: jest.fn(),
  onTaskChange: jest.fn(),
  onAccept: jest.fn(),
  onReject: jest.fn(),
  onAcceptWeek: jest.fn(),
  onMergeChange: jest.fn(),
  ...overrides,
});

describe("ImportReviewComponent", () => {
  it("should forward every action", () => {
    const props = makeProps();

    render(<ImportReviewComponent {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Salin perintah" }));
    fireEvent.change(screen.getAllByRole("textbox", { name: "Nama task" })[0], { target: { value: "x" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Terima" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Tolak" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Terima semua minggu ini (1)" })[0]);
    fireEvent.change(screen.getByRole("combobox", { name: "Gabung dengan baris lain" }), { target: { value: "manual" } });

    expect(screen.getByTestId("import-command")).toHaveTextContent('timesheet import --doc "doc.json" --month 2026-11');
    expect(screen.getByText("perlu nama")).toBeInTheDocument();
    [props.onCopyCommand, props.onTaskChange, props.onAccept, props.onReject, props.onAcceptWeek, props.onMergeChange].forEach((handler) =>
      expect(handler).toHaveBeenCalled(),
    );
  });

  it("should show the empty state and copy feedback", () => {
    render(<ImportReviewComponent {...makeProps({ weeks: [], pendingCount: 0, isCopied: true })} />);

    expect(screen.getByText("Tidak ada entri otomatis yang menunggu review.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Disalin" })).toBeInTheDocument();
  });
});
