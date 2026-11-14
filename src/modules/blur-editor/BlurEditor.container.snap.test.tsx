import test from "@/libs/unit-test";

import BlurEditorContainer from "./BlurEditor.container";

describe("BlurEditorContainer Snapshot Test", () => {
  test.assertSnapshots(BlurEditorContainer, [
    { desc: "should render nothing visible without a request", props: { request: null, isProcessing: false, onApply: jest.fn(), onCancel: jest.fn() } },
  ]);
});
