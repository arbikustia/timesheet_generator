import type { RadioChangeEvent } from "antd";

import { act, renderHook } from "@/libs/unit-test";

import { useBlurEditor } from "./BlurEditor.hook";
import type { BlurEditorContainerProps } from "./BlurEditor.type";

const REQUEST = { key: "k", file: new Blob(["x"], { type: "image/png" }), name: "shot.png", isCode: true };

/**
 * Fake radio change.
 * @param {string} value - Selected value
 * @returns {RadioChangeEvent} - Event
 */
const radio = (value: string): RadioChangeEvent => ({ target: { value } }) as RadioChangeEvent;

/**
 * Render the hook.
 * @param {Partial<BlurEditorContainerProps>} [overrides] - Prop overrides
 * @returns {ReturnType<typeof renderHook<ReturnType<typeof useBlurEditor>, BlurEditorContainerProps>>} - Hook
 */
const renderEditor = (overrides?: Partial<BlurEditorContainerProps>) =>
  renderHook((props: BlurEditorContainerProps) => useBlurEditor(props), {
    initialProps: { request: REQUEST, isProcessing: false, onApply: jest.fn(), onCancel: jest.fn(), ...overrides },
  });

describe("useBlurEditor", () => {
  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => "blob:edit");
    URL.revokeObjectURL = jest.fn();
  });

  it("should default to blurring the whole image in one click", () => {
    const onApply = jest.fn();
    const { result, unmount } = renderEditor({ onApply });

    expect(result.current).toMatchObject({ isOpen: true, title: "Blur gambar — shot.png", imageUrl: "blob:edit", isCode: true, canApply: true });

    act(() => result.current.onApply());
    expect(onApply).toHaveBeenCalledWith({ scope: "full", effect: "blur", regions: [] });

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:edit");
  });

  it("should switch scope and effect and require a region in area mode", () => {
    const onApply = jest.fn();
    const { result } = renderEditor({ onApply });

    act(() => result.current.onScopeChange(radio("area")));
    act(() => result.current.onEffectChange(radio("pixelate")));
    expect(result.current).toMatchObject({ scope: "area", effect: "pixelate", canApply: false });

    act(() => result.current.onApply());
    expect(onApply).not.toHaveBeenCalled();

    act(() => result.current.onScopeChange(radio("full")));
    act(() => result.current.onEffectChange(radio("blur")));
    expect(result.current).toMatchObject({ scope: "full", effect: "blur" });
  });

  it("should stay closed without a request", () => {
    const { result } = renderEditor({ request: null });

    expect(result.current).toMatchObject({ isOpen: false, title: "", imageUrl: null, isCode: false, regions: [] });
  });
});
