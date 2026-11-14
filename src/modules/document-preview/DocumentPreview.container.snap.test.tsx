import test, { createStoreWrapper } from "@/libs/unit-test";

import { makeEmptyOctoberStore } from "@/fixture/timesheet.fixture";

import DocumentPreviewContainer from "./DocumentPreview.container";

describe("DocumentPreviewContainer Snapshot Test", () => {
  test.assertSnapshots(DocumentPreviewContainer, [{ desc: "should preview an empty October", props: {} }], {
    wrapper: createStoreWrapper(makeEmptyOctoberStore()),
  });
});
