/** Longest side of a stored evidence image, in px. */
export const EVIDENCE_MAX_SIDE_PX = 1600;

/** JPEG quality of stored evidence images. */
export const EVIDENCE_JPEG_QUALITY = 0.8;

/** Pixelate block size of the full blur, in px of the final image. */
export const BLUR_BLOCK_PX = 14;

/** Gaussian blur radius layered on top of the pixelation, in px. */
export const BLUR_RADIUS_PX = 6;

/** Document size above which the UI warns (PROMPT §5: < ~15 MB per month). */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

/** Accepted evidence image types. */
export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";
