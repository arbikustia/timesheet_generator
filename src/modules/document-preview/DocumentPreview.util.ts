import { A4_WIDTH_PX, MAX_ZOOM, PREVIEW_GUTTER_PX } from "./DocumentPreview.config";

/**
 * Zoom factor that fits an A4 page to the preview width.
 * @param {number} width - Preview width in px (0 before the first measure)
 * @returns {number} - Zoom factor, 1 until measured
 */
export const getFitWidthZoom = (width: number): number => {
  if (width <= 0) {
    return 1;
  }

  return Math.min(MAX_ZOOM, Math.max(0.2, (width - PREVIEW_GUTTER_PX) / A4_WIDTH_PX));
};
