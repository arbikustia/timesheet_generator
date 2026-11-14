import test from "@/libs/unit-test";

import BlurEditorComponent from "./BlurEditor.component";

describe("BlurEditorComponent Snapshot Test", () => {
  test.assertSnapshots(BlurEditorComponent, [
    {
      desc: "should render the closed editor",
      props: {
        isOpen: false,
        title: "",
        imageUrl: null,
        isCode: false,
        scope: "full" as const,
        effect: "blur" as const,
        regions: [],
        draftRegion: null,
        canApply: true,
        isProcessing: false,
        onScopeChange: jest.fn(),
        onEffectChange: jest.fn(),
        onPointerDown: jest.fn(),
        onPointerMove: jest.fn(),
        onPointerUp: jest.fn(),
        onUndoRegion: jest.fn(),
        onClearRegions: jest.fn(),
        onApply: jest.fn(),
        onCancel: jest.fn(),
      },
    },
  ]);
});
