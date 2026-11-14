import test from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import DocumentPreviewComponent from "./DocumentPreview.component";

describe("DocumentPreviewComponent Snapshot Test", () => {
  test.assertSnapshots(DocumentPreviewComponent, [
    {
      desc: "should render an empty February 2026 preview",
      props: { doc: createEmptyDoc({ year: 2026, month: 2 }), containerRef: { current: null }, zoom: 0.75 },
    },
  ]);
});
