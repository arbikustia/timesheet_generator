import { fireEvent, render, screen } from "@/libs/unit-test";

import type { BlurEditorContainerProps } from "./BlurEditor.type";

import BlurEditorContainer from "./BlurEditor.container";

/**
 * Render the editor for one in-memory image.
 * @param {BlurEditorContainerProps["onApply"]} onApply - Apply callback
 * @returns {void}
 */
const renderEditor = (onApply: BlurEditorContainerProps["onApply"]): void => {
  URL.createObjectURL = jest.fn(() => "blob:edit");
  URL.revokeObjectURL = jest.fn();
  render(<BlurEditorContainer request={{ key: "k", file: new Blob(["x"]), name: "shot.png", isCode: false }} isProcessing={false} onApply={onApply} onCancel={jest.fn()} />);
};

/**
 * Drag over the drawing surface (a 200×100 box at the origin).
 * @param {HTMLElement} surface - Drawing surface
 * @param {number[]} from - Start `[x, y]` in px
 * @param {number[]} to - End `[x, y]` in px
 * @returns {void}
 */
const drag = (surface: HTMLElement, from: number[], to: number[]): void => {
  fireEvent.pointerDown(surface, { clientX: from[0], clientY: from[1], pointerId: 1 });
  fireEvent.pointerMove(surface, { clientX: to[0], clientY: to[1], pointerId: 1 });
  fireEvent.pointerUp(surface, { clientX: to[0], clientY: to[1], pointerId: 1 });
};

describe("BlurEditorContainer", () => {
  it("should apply the default whole-image blur", () => {
    const onApply = jest.fn();

    renderEditor(onApply);
    fireEvent.click(screen.getByRole("button", { name: "Terapkan blur" }));

    expect(onApply).toHaveBeenCalledWith({ scope: "full", effect: "blur", regions: [] });
  });

  it("should draw, undo and pixelate areas", () => {
    const onApply = jest.fn();

    renderEditor(onApply);
    fireEvent.click(screen.getByRole("radio", { name: "Area tertentu" }));
    fireEvent.click(screen.getByRole("radio", { name: "Pixelate" }));

    const surface = screen.getByTestId("blur-surface");

    surface.getBoundingClientRect = (): DOMRect => DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 });
    fireEvent.pointerMove(surface, { clientX: 5, clientY: 5 });
    drag(surface, [20, 10], [120, 60]);
    drag(surface, [0, 0], [1, 0]);
    expect(screen.getAllByTestId("blur-region")).toHaveLength(1);

    drag(surface, [150, 50], [190, 90]);
    fireEvent.click(screen.getByRole("button", { name: "Urungkan area" }));
    fireEvent.click(screen.getByRole("button", { name: "Terapkan blur" }));

    expect(onApply).toHaveBeenCalledWith({ scope: "area", effect: "pixelate", regions: [{ x: 0.1, y: 0.1, width: 0.5, height: 0.5 }] });

    fireEvent.click(screen.getByRole("button", { name: "Hapus semua area" }));
    expect(screen.queryByTestId("blur-region")).not.toBeInTheDocument();
  });
});
