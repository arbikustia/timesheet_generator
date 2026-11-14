import type { BlurEffect, BlurScope } from "@/types/file.type";

export const SCOPE_OPTIONS: { value: BlurScope; label: string }[] = [
  { value: "full", label: "Seluruh gambar" },
  { value: "area", label: "Area tertentu" },
];

export const EFFECT_OPTIONS: { value: BlurEffect; label: string }[] = [
  { value: "blur", label: "Blur" },
  { value: "pixelate", label: "Pixelate" },
];

/** CSS blur used only for the on-screen preview; the stored image is censored on canvas pixels. */
export const PREVIEW_BLUR = "blur(8px)";
