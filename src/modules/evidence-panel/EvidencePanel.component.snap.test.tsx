import test from "@/libs/unit-test";

import { SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

import EvidencePanelComponent from "./EvidencePanel.component";

const HANDLERS = {
  onToggleCodeUpload: jest.fn(),
  onDismissError: jest.fn(),
  onRemove: jest.fn(),
  onSwap: jest.fn(),
  onBlurImage: jest.fn(),
  onActivate: jest.fn(),
  onPaste: jest.fn(),
  onFileChange: jest.fn(),
  onDrop: jest.fn(),
  onDragOver: jest.fn(),
};

describe("EvidencePanelComponent Snapshot Test", () => {
  test.assertSnapshots(EvidencePanelComponent, [
    {
      desc: "should render one date with an image and an empty slot",
      props: {
        ...HANDLERS,
        blocks: [
          {
            date: "2026-10-01",
            label: "Kam, 01/10/2026",
            tasks: "Tech debt case admin list",
            images: [SAMPLE_IMAGE],
            hasEntries: true,
            isActive: true,
            isProcessing: false,
          },
        ],
        sizeLabel: "12 KB",
        isTooLarge: false,
        error: null,
        isCodeUpload: false,
      },
    },
  ]);
});
