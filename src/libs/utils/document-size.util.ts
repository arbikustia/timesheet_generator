import type { TimesheetDoc } from "@/types/timesheet.type";

/**
 * Approximate size of the saved file in bytes without serializing the images on every edit:
 * image data URLs dominate, so they are summed and only the small rest is stringified.
 * @param {TimesheetDoc} doc - Document
 * @returns {number} - Estimated bytes
 */
export const estimateDocumentBytes = (doc: TimesheetDoc): number => {
  const evidenceBytes = Object.values(doc.evidence)
    .flat()
    .reduce((total, image) => total + image.dataUrl.length + image.name.length + 200, 0);
  const signatureBytes = Object.values(doc.profile.signatures).reduce((total, src) => total + (src?.length ?? 0), 0);
  const rest = JSON.stringify({ ...doc, evidence: {}, profile: { ...doc.profile, signatures: {} } }).length;

  return evidenceBytes + signatureBytes + rest;
};

/**
 * Human-readable size, e.g. `3.2 MB`.
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
