import { useElementWidth } from "@/hooks/useElementWidth";

import type { DocumentPreviewProps } from "./DocumentPreview.type";
import { getFitWidthZoom } from "./DocumentPreview.util";

import { useAppSelector } from "@/store/hooks";
import { selectDoc } from "@/store/timesheet.slice";

/**
 * Live preview of the store document, zoomed to fit the preview width.
 * @returns {DocumentPreviewProps} - Document, container ref and zoom
 */
export const useDocumentPreview = (): DocumentPreviewProps => {
  const doc = useAppSelector(selectDoc);
  const { ref, width } = useElementWidth<HTMLDivElement>();

  return { doc, containerRef: ref, zoom: getFitWidthZoom(width) };
};
