import { fireEvent, render, screen } from "@/libs/unit-test";

import EvidencePanelComponent from "./EvidencePanel.component";
import type { EvidencePanelProps } from "./EvidencePanel.type";

/**
 * Build component props.
 * @param {Partial<EvidencePanelProps>} [overrides] - Prop overrides
 * @returns {EvidencePanelProps} - Props
 */
const makeProps = (overrides?: Partial<EvidencePanelProps>): EvidencePanelProps => ({
  blocks: [],
  sizeLabel: "12 KB",
  isTooLarge: false,
  error: null,
  isCodeUpload: false,
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
  ...overrides,
});

describe("EvidencePanelComponent", () => {
  it("should show the empty state, size and the code upload toggle", () => {
    const props = makeProps();

    render(<EvidencePanelComponent {...props} />);
    fireEvent.click(screen.getByRole("checkbox"));

    expect(screen.getByText(/Belum ada aktivitas/)).toBeInTheDocument();
    expect(screen.getByTestId("document-size")).toHaveTextContent("Ukuran dokumen: 12 KB");
    expect(props.onToggleCodeUpload).toHaveBeenCalled();
  });

  it("should show the size warning and the error", () => {
    render(<EvidencePanelComponent {...makeProps({ isTooLarge: true, error: "Maksimal 2 gambar per tanggal." })} />);

    expect(screen.getByText(/lebih dari 15 MB/)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Maksimal 2 gambar per tanggal.");
  });
});
