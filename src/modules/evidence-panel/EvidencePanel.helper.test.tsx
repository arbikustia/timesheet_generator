import { render, screen } from "@/libs/unit-test";

import { SAMPLE_IMAGE } from "@/fixture/timesheet.fixture";

import { renderDateBlock } from "./EvidencePanel.helper";
import type { EvidenceDateBlock, EvidencePanelProps } from "./EvidencePanel.type";

const HANDLERS = {
  onRemove: jest.fn(),
  onSwap: jest.fn(),
  onBlurImage: jest.fn(),
  onActivate: jest.fn(),
  onPaste: jest.fn(),
  onFileChange: jest.fn(),
  onDrop: jest.fn(),
  onDragOver: jest.fn(),
} as Pick<EvidencePanelProps, "onRemove" | "onSwap" | "onBlurImage" | "onActivate" | "onPaste" | "onFileChange" | "onDrop" | "onDragOver">;

/**
 * Build a date block.
 * @param {Partial<EvidenceDateBlock>} [overrides] - Block overrides
 * @returns {EvidenceDateBlock} - Block
 */
const makeBlock = (overrides?: Partial<EvidenceDateBlock>): EvidenceDateBlock => ({
  date: "2026-10-01",
  label: "Kam, 01/10/2026",
  tasks: "Tech debt case admin list",
  images: [],
  hasEntries: true,
  isActive: false,
  isProcessing: false,
  ...overrides,
});

/**
 * Render one block inside a list.
 * @param {EvidenceDateBlock} block - Block
 * @returns {void}
 */
const renderBlock = (block: EvidenceDateBlock): void => {
  render(<ul>{renderDateBlock(block, HANDLERS as EvidencePanelProps)}</ul>);
};

describe("renderDateBlock", () => {
  it("should render two drop zones for an empty date", () => {
    renderBlock(makeBlock());

    expect(screen.getByText("Kiri: tarik gambar atau klik")).toBeInTheDocument();
    expect(screen.getByText("Kanan: tarik gambar atau klik")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Tukar/ })).toBeNull();
  });

  it("should render images, the blurred badge and the swap button", () => {
    renderBlock(makeBlock({ images: [SAMPLE_IMAGE, { ...SAMPLE_IMAGE, id: "b", blurred: true }], isActive: true }));

    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByText("Diblur")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Blur gambar/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Tukar posisi Kam, 01/10/2026" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveAttribute("aria-current", "true");
  });

  it("should label a date without activities", () => {
    renderBlock(makeBlock({ hasEntries: false, tasks: "", isProcessing: true }));

    expect(screen.getByText("Tanpa aktivitas")).toBeInTheDocument();
  });
});
