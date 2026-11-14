import {
  BLUR_BLOCK_PX,
  BLUR_RADIUS_PX,
  EVIDENCE_JPEG_QUALITY,
  EVIDENCE_MAX_SIDE_PX,
} from "@/constants/image.constant";
import type { FileCarrier, ImageSize, LoadedImage, ProcessedImage, ProcessImageOptions } from "@/types/file.type";

/**
 * Fit a size inside a square bound, keeping the aspect ratio and never upscaling.
 * @param {ImageSize} size - Original size
 * @param {number} maxSide - Longest allowed side
 * @returns {ImageSize} - Scaled integer size (at least 1×1)
 */
export const getScaledSize = (size: ImageSize, maxSide: number): ImageSize => {
  const scale = Math.min(1, maxSide / Math.max(size.width, size.height));

  return { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) };
};

/**
 * Size of the low-resolution copy used for pixelation.
 * @param {ImageSize} size - Image size
 * @param {number} blockPx - Block size in px
 * @returns {ImageSize} - Reduced size (at least 1×1)
 */
export const getPixelatedSize = (size: ImageSize, blockPx: number): ImageSize => {
  return { width: Math.max(1, Math.round(size.width / blockPx)), height: Math.max(1, Math.round(size.height / blockPx)) };
};

/**
 * Create a canvas with a 2D context.
 * @param {ImageSize} size - Canvas size
 * @returns {{ canvas: HTMLCanvasElement; context: CanvasRenderingContext2D }} - Canvas and context
 */
export const createCanvas = (size: ImageSize): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } => {
  const canvas = document.createElement("canvas");

  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas tidak tersedia di browser ini.");
  }

  return { canvas, context };
};

/**
 * Decode an image file (EXIF orientation applied by the browser).
 * @param {Blob} blob - Image file
 * @returns {Promise<LoadedImage>} - Decoded image
 */
export const loadImage = async (blob: Blob): Promise<LoadedImage> => {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);

    /**
     * Free the decoded bitmap.
     * @returns {void}
     */
    const releaseBitmap = (): void => bitmap.close();

    return { source: bitmap, width: bitmap.width, height: bitmap.height, release: releaseBitmap };
  }

  const url = URL.createObjectURL(blob);
  const image = new Image();

  image.src = url;
  await image.decode();

  /**
   * Revoke the temporary object URL.
   * @returns {void}
   */
  const releaseUrl = (): void => URL.revokeObjectURL(url);

  return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: releaseUrl };
};

/**
 * Irreversibly blur a canvas in place: pixelate (down/up-scale) then a Gaussian blur on top.
 * Done on pixels, not with a CSS filter, so the stored image cannot be "un-blurred".
 * @param {HTMLCanvasElement} canvas - Canvas to blur
 * @param {CanvasRenderingContext2D} context - Its 2D context
 * @returns {void}
 */
export const applyFullBlur = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void => {
  const size = { width: canvas.width, height: canvas.height };
  const small = createCanvas(getPixelatedSize(size, BLUR_BLOCK_PX));

  small.context.imageSmoothingEnabled = true;
  small.context.drawImage(canvas, 0, 0, small.canvas.width, small.canvas.height);
  context.clearRect(0, 0, size.width, size.height);
  context.imageSmoothingEnabled = true;
  context.filter = `blur(${BLUR_RADIUS_PX}px)`;
  context.drawImage(small.canvas, 0, 0, size.width, size.height);
  context.filter = "none";
};

/**
 * Resize, optionally blur, and compress an image to JPEG.
 * Transparent areas become white because JPEG has no alpha.
 * @param {Blob} blob - Source image
 * @param {ProcessImageOptions} options - Whether to apply the full blur
 * @returns {Promise<ProcessedImage>} - Stored image data
 */
export const processEvidenceImage = async (blob: Blob, options: ProcessImageOptions): Promise<ProcessedImage> => {
  const image = await loadImage(blob);
  const size = getScaledSize(image, EVIDENCE_MAX_SIDE_PX);
  const { canvas, context } = createCanvas(size);

  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(image.source, 0, 0, size.width, size.height);
  image.release();

  if (options.shouldBlur) {
    applyFullBlur(canvas, context);
  }

  return { dataUrl: canvas.toDataURL("image/jpeg", EVIDENCE_JPEG_QUALITY), mime: "image/jpeg", w: size.width, h: size.height };
};

/**
 * Decode a base64 data URL into a Blob (no network request).
 * @param {string} dataUrl - `data:<mime>;base64,...`
 * @returns {Blob} - Binary blob
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, base64 = ""] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new Blob([bytes], { type: mime });
};

/**
 * Image files contained in a clipboard or drag payload.
 * @param {FileCarrier | null} transfer - Clipboard data, drop data or a file input
 * @returns {File[]} - Image files
 */
export const getImageFiles = (transfer: FileCarrier | null): File[] => {
  return Array.from(transfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
};
