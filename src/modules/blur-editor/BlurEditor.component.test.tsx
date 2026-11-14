import { fireEvent, render, screen } from "@/libs/unit-test";

import BlurEditorComponent from "./BlurEditor.component";
import type { BlurEditorProps } from "./BlurEditor.type";

/**
 * Build component props.
 * @param {Partial<BlurEditorProps>} [overrides] - Prop overrides
 * @returns {BlurEditorProps} - Props
 */
const makeProps = (overrides?: Partial<BlurEditorProps>): BlurEditorProps => ({
  isOpen: true,
  title: "Blur gambar — shot.png",
  imageUrl: "blob:edit",
  isCode: true,
  scope: "full",
  effect: "blur",
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
  ...overrides,
});

describe("BlurEditorComponent", () => {
  it("should preview a full blur and apply or cancel", () => {
    const props = makeProps();

    render(<BlurEditorComponent {...props} />);

    expect(screen.getByText(/Versi asli tidak pernah ditulis ke file/)).toBeInTheDocument();
    expect(screen.getByAltText("Gambar yang akan diblur")).toHaveStyle({ filter: "blur(8px)" });

    fireEvent.click(screen.getByRole("radio", { name: "Area tertentu" }));
    fireEvent.click(screen.getByRole("radio", { name: "Pixelate" }));
    fireEvent.click(screen.getByRole("button", { name: "Terapkan blur" }));
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    expect(props.onScopeChange).toHaveBeenCalled();
    expect(props.onEffectChange).toHaveBeenCalled();
    expect(props.onApply).toHaveBeenCalled();
    expect(props.onCancel).toHaveBeenCalled();
  });

  it("should draw regions in area mode", () => {
    const region = { x: 0.1, y: 0.1, width: 0.2, height: 0.2 };
    const props = makeProps({ scope: "area", isCode: false, regions: [region], draftRegion: region, canApply: true });

    render(<BlurEditorComponent {...props} />);

    const surface = screen.getByTestId("blur-surface");

    fireEvent.pointerDown(surface);
    fireEvent.pointerMove(surface);
    fireEvent.pointerUp(surface);
    fireEvent.click(screen.getByRole("button", { name: "Urungkan area" }));
    fireEvent.click(screen.getByRole("button", { name: "Hapus semua area" }));

    expect(screen.getByText("Seret di gambar untuk menandai area · 1 area")).toBeInTheDocument();
    expect(screen.getAllByTestId("blur-region")).toHaveLength(1);
    expect(screen.queryByText(/Versi asli/)).not.toBeInTheDocument();
    expect(props.onPointerDown).toHaveBeenCalled();
    expect(props.onPointerMove).toHaveBeenCalled();
    expect(props.onPointerUp).toHaveBeenCalled();
    expect(props.onUndoRegion).toHaveBeenCalled();
    expect(props.onClearRegions).toHaveBeenCalled();
  });

  it("should disable apply until a region exists", () => {
    render(<BlurEditorComponent {...makeProps({ scope: "area", canApply: false, imageUrl: null })} />);

    expect(screen.getByRole("button", { name: "Terapkan blur" })).toBeDisabled();
    expect(screen.queryByAltText("Gambar yang akan diblur")).not.toBeInTheDocument();
  });
});
