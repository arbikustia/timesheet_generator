import test from "@/libs/unit-test";

import ImportReviewComponent from "./ImportReview.component";

describe("ImportReviewComponent Snapshot Test", () => {
  test.assertSnapshots(ImportReviewComponent, [
    {
      desc: "should render the empty review",
      props: {
        weeks: [],
        pendingCount: 0,
        snapshotCommand: "timesheet snapshot",
        importCommand: 'timesheet import --doc "doc.json" --month 2026-11',
        isCopied: false,
        onCopyCommand: jest.fn(),
        onTaskChange: jest.fn(),
        onAccept: jest.fn(),
        onReject: jest.fn(),
        onAcceptWeek: jest.fn(),
        onMergeChange: jest.fn(),
      },
    },
  ]);
});
