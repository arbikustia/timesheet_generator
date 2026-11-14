import test, { createStoreWrapper } from "@/libs/unit-test";

import { loadReviewDoc, makeDocStore } from "@/fixture/timesheet.fixture";

import ImportReviewContainer from "./ImportReview.container";

describe("ImportReviewContainer Snapshot Test", () => {
  test.assertSnapshots(ImportReviewContainer, [{ desc: "should render two pending entries", props: {} }], {
    wrapper: createStoreWrapper(makeDocStore(loadReviewDoc())),
  });
});
