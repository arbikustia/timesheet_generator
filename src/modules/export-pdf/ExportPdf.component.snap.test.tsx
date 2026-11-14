import test from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import ExportPdfComponent from "./ExportPdf.component";

describe("ExportPdfComponent Snapshot Test", () => {
  test.assertSnapshots(ExportPdfComponent, [
    {
      desc: "should render the export button",
      props: {
        doc: createEmptyDoc({ year: 2026, month: 2 }),
        printContainer: document.createElement("div"),
        errorMessages: [],
        isBlockedOpen: false,
        onExport: jest.fn(),
        onCloseBlocked: jest.fn(),
        onShowCheck: jest.fn(),
      },
    },
  ]);
});
