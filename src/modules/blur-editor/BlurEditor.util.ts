import { MIN_REGION_FRACTION } from "@/constants/image.constant";
import type { BlurRegion, BlurScope, BlurSpec } from "@/types/file.type";

import type { BoxBounds, FractionPoint } from "./BlurEditor.type";

/**
 * Clamp a number to 0–1.
 * @param {number} value - Value
 * @returns {number} - Clamped value
 */
const _clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/**
 * Position of a pointer inside a box, in fractions of the box.
 * @param {number} clientX - Pointer x in px
 * @param {number} clientY - Pointer y in px
 * @param {BoxBounds} bounds - Box position and size in px
 * @returns {FractionPoint | null} - Point, or null when the box has no size
 */
export const toFractionPoint = (clientX: number, clientY: number, bounds: BoxBounds): FractionPoint | null => {
  if (bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  return { x: _clamp01((clientX - bounds.left) / bounds.width), y: _clamp01((clientY - bounds.top) / bounds.height) };
};

/**
 * Rectangle spanned by two points, in any drag direction.
 * @param {FractionPoint} start - Drag start
 * @param {FractionPoint} end - Drag end
 * @returns {BlurRegion} - Region
 */
export const toRegion = (start: FractionPoint, end: FractionPoint): BlurRegion => ({
  x: Math.min(start.x, end.x),
  y: Math.min(start.y, end.y),
  width: Math.abs(end.x - start.x),
  height: Math.abs(end.y - start.y),
});

/**
 * Whether a region is big enough to be intentional.
 * @param {BlurRegion} region - Region
 * @returns {boolean} - True when both sides reach the minimum
 */
export const isUsableRegion = (region: BlurRegion): boolean => {
  return region.width >= MIN_REGION_FRACTION && region.height >= MIN_REGION_FRACTION;
};

/**
 * Whether the editor can apply: the full scope always, the area scope once a region is drawn.
 * @param {BlurScope} scope - Scope
 * @param {BlurRegion[]} regions - Drawn regions
 * @returns {boolean} - True when applicable
 */
export const canApplySpec = (scope: BlurScope, regions: BlurRegion[]): boolean => {
  return scope === "full" || regions.length > 0;
};

/**
 * Build the spec sent to image processing.
 * @param {BlurSpec["scope"]} scope - Scope
 * @param {BlurSpec["effect"]} effect - Effect
 * @param {BlurRegion[]} regions - Regions (dropped for the full scope)
 * @returns {BlurSpec} - Spec
 */
export const buildBlurSpec = (scope: BlurSpec["scope"], effect: BlurSpec["effect"], regions: BlurRegion[]): BlurSpec => ({
  scope,
  effect,
  regions: scope === "area" ? regions : [],
});
