import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import ExportPdfContainer from "./ExportPdf.container";

describe("ExportPdfContainer Snapshot Test", () => {
  test.assertSnapshots(ExportPdfContainer, [{ desc: "should render the export button", props: { onShowCheck: jest.fn() } }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
