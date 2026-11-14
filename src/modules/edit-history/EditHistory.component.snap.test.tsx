import test from "@/libs/unit-test";

import EditHistoryComponent from "./EditHistory.component";

describe("EditHistoryComponent Snapshot Test", () => {
  test.assertSnapshots(EditHistoryComponent, [
    { desc: "should render undo enabled and redo disabled", props: { canUndo: true, canRedo: false, onUndo: jest.fn(), onRedo: jest.fn() } },
  ]);
});
