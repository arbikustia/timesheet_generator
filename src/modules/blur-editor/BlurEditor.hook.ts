import { type PointerEvent, useEffect, useMemo, useState } from "react";
import type { RadioChangeEvent } from "antd";

import type { BlurEffect, BlurRegion, BlurScope } from "@/types/file.type";

import type { BlurEditorContainerProps, BlurEditorProps, DragState, FractionPoint } from "./BlurEditor.type";
import { buildBlurSpec, canApplySpec, isUsableRegion, toFractionPoint, toRegion } from "./BlurEditor.util";

/**
 * Temporary object URL of the image under edit, revoked when it changes or the editor closes.
 * @param {Blob | null} file - Image in memory
 * @returns {string | null} - Object URL
 */
export const useObjectUrl = (file: Blob | null): string | null => {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return (): void => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  return url;
};

/**
 * Pointer position over the drawing surface in fractions.
 * @param {PointerEvent<HTMLDivElement>} event - Pointer event
 * @returns {FractionPoint | null} - Point, or null when the surface has no size
 */
const _pointOf = (event: PointerEvent<HTMLDivElement>): FractionPoint | null => {
  return toFractionPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
};

/**
 * Draw rectangles by dragging over the image; each one becomes a region.
 * @param {(region: BlurRegion) => void} onRegion - Called with every finished region
 * @returns {Pick<BlurEditorProps, "draftRegion" | "onPointerDown" | "onPointerMove" | "onPointerUp">} - Drag state and handlers
 */
export const useRegionDrawing = (
  onRegion: (region: BlurRegion) => void,
): Pick<BlurEditorProps, "draftRegion" | "onPointerDown" | "onPointerMove" | "onPointerUp"> => {
  const [drag, setDrag] = useState<DragState | null>(null);

  /**
   * Start a rectangle.
   * @param {PointerEvent<HTMLDivElement>} event - Pointer event
   * @returns {void}
   */
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    const point = _pointOf(event);

    if (point) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDrag({ start: point, current: point });
    }
  };

  /**
   * Resize the rectangle being drawn.
   * @param {PointerEvent<HTMLDivElement>} event - Pointer event
   * @returns {void}
   */
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const point = _pointOf(event);

    if (drag && point) {
      setDrag({ ...drag, current: point });
    }
  };

  /**
   * Finish the rectangle; tiny ones (accidental clicks) are dropped.
   * @param {PointerEvent<HTMLDivElement>} event - Pointer event
   * @returns {void}
   */
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>): void => {
    const region = drag ? toRegion(drag.start, _pointOf(event) ?? drag.current) : null;

    setDrag(null);

    if (region && isUsableRegion(region)) {
      onRegion(region);
    }
  };

  return {
    draftRegion: drag ? toRegion(drag.start, drag.current) : null,
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
  };
};

/**
 * Blur editor state: scope, effect and drawn regions of the requested image. The parent mounts the
 * editor with `key={request.key}`, so every image starts with "Seluruh gambar" + "Blur" (one click).
 * @param {BlurEditorContainerProps} props - Request and callbacks
 * @returns {BlurEditorProps} - View props
 */
export const useBlurEditor = (props: BlurEditorContainerProps): BlurEditorProps => {
  const { request, onApply } = props;
  const [scope, setScope] = useState<BlurScope>("full");
  const [effect, setEffect] = useState<BlurEffect>("blur");
  const [regions, setRegions] = useState<BlurRegion[]>([]);
  const imageUrl = useObjectUrl(request?.file ?? null);
  const drawing = useRegionDrawing((region) => setRegions((prev) => [...prev, region]));

  /**
   * Switch between the whole image and drawn areas.
   * @param {RadioChangeEvent} event - Radio event
   * @returns {void}
   */
  const handleScopeChange = (event: RadioChangeEvent): void => setScope(event.target.value === "area" ? "area" : "full");

  /**
   * Switch between blur and pixelate.
   * @param {RadioChangeEvent} event - Radio event
   * @returns {void}
   */
  const handleEffectChange = (event: RadioChangeEvent): void => setEffect(event.target.value === "pixelate" ? "pixelate" : "blur");

  /**
   * Remove the last drawn region.
   * @returns {void}
   */
  const handleUndoRegion = (): void => setRegions((prev) => prev.slice(0, -1));

  /**
   * Remove every drawn region.
   * @returns {void}
   */
  const handleClearRegions = (): void => setRegions([]);

  /**
   * Send the spec to processing.
   * @returns {void}
   */
  const handleApply = (): void => {
    if (canApplySpec(scope, regions)) {
      onApply(buildBlurSpec(scope, effect, regions));
    }
  };

  return {
    isOpen: request !== null,
    title: request ? `Blur gambar — ${request.name}` : "",
    imageUrl,
    isCode: request?.isCode ?? false,
    scope,
    effect,
    regions,
    canApply: canApplySpec(scope, regions),
    isProcessing: props.isProcessing,
    onScopeChange: handleScopeChange,
    onEffectChange: handleEffectChange,
    onUndoRegion: handleUndoRegion,
    onClearRegions: handleClearRegions,
    onApply: handleApply,
    onCancel: props.onCancel,
    ...drawing,
  };
};
