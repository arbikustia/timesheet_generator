/**
 * Read a file or blob as a data URL in the browser (never uploaded anywhere).
 * @param {Blob} file - File to read
 * @returns {Promise<string>} - `data:<mime>;base64,...`
 */
export const readFileAsDataUrl = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Gagal membaca file.")));
    reader.readAsDataURL(file);
  });
};

/**
 * Read a file or blob as UTF-8 text.
 * @param {Blob} file - File to read
 * @returns {Promise<string>} - Text contents
 */
export const readFileAsText = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(reader.error ?? new Error("Gagal membaca file.")));
    reader.readAsText(file);
  });
};

/**
 * Whether a file is an image type accepted for evidence and signatures.
 * @param {Blob} file - File to check
 * @returns {boolean} - True for PNG, JPEG or WebP
 */
export const isAcceptedImage = (file: Blob): boolean => {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type);
};
