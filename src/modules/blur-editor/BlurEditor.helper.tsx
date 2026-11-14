import * as React from "react";

import type { BlurRegion } from "@/types/file.type";

import { PREVIEW_BLUR } from "./BlurEditor.config";
import type { BlurEditorProps } from "./BlurEditor.type";

/**
 * CSS box of a region, in percent of the image.
 * @param {BlurRegion} region - Region in fractions
 * @returns {React.CSSProperties} - Absolute position and size
 */
export const toRegionStyle = (region: BlurRegion): React.CSSProperties => ({
  left: `${region.x * 100}%`,
  top: `${region.y * 100}%`,
  width: `${region.width * 100}%`,
  height: `${region.height * 100}%`,
});

/**
 * One drawn region with a blurred preview of what is under it.
 * @param {BlurRegion} region - Region
 * @param {number} index - Region number (0-based)
 * @returns {React.ReactElement} - Overlay box
 */
export const renderRegion = (region: BlurRegion, index: number): React.ReactElement => (
  <div
    key={`${index}-${region.x}-${region.y}`}
    data-testid="blur-region"
    className="pointer-events-none absolute border-2 border-dashed border-danger"
    style={{ ...toRegionStyle(region), backdropFilter: PREVIEW_BLUR }}
  />
);

/**
 * The image with its drawing surface; drawn regions and the region being dragged are overlaid.
 * @param {BlurEditorProps} props - Editor props
 * @returns {React.ReactElement} - Image area
 */
export const renderSurface = (props: BlurEditorProps): React.ReactElement => {
  const isArea = props.scope === "area";

  return (
    <div className="flex max-h-[60vh] justify-center overflow-auto rounded-lg bg-neutral-200 p-2 dark:bg-neutral-800">
      <div
        className={`relative inline-block select-none ${isArea ? "cursor-crosshair touch-none" : ""}`}
        data-testid="blur-surface"
        onPointerDown={isArea ? props.onPointerDown : undefined}
        onPointerMove={isArea ? props.onPointerMove : undefined}
        onPointerUp={isArea ? props.onPointerUp : undefined}
      >
        {props.imageUrl && (
          <img
            src={props.imageUrl}
            alt="Gambar yang akan diblur"
            draggable={false}
            className="block max-h-[56vh] max-w-full"
            style={{ filter: isArea ? "none" : PREVIEW_BLUR }}
          />
        )}
        {isArea && props.regions.map(renderRegion)}
        {isArea && props.draftRegion && (
          <div className="pointer-events-none absolute border-2 border-primary-500" style={toRegionStyle(props.draftRegion)} />
        )}
      </div>
    </div>
  );
};
