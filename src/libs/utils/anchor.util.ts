import type { SignatureKey } from "@/types/timesheet-edit.type";

/**
 * DOM id of an activity in the activity list (target of the export check).
 * @param {string} entryId - Entry id
 * @returns {string} - Element id
 */
export const getEntryAnchorId = (entryId: string): string => `entry-${entryId}`;

/**
 * DOM id of a date block in the evidence panel.
 * @param {string} isoDate - ISO date
 * @returns {string} - Element id
 */
export const getEvidenceAnchorId = (isoDate: string): string => `evidence-${isoDate}`;

/**
 * DOM id of a profile text input in Settings.
 * @param {string} field - Profile field name
 * @returns {string} - Element id
 */
export const getProfileFieldAnchorId = (field: string): string => `profile-${field}`;

/**
 * DOM id of a signature slot in Settings.
 * @param {SignatureKey} key - Signature key
 * @returns {string} - Element id
 */
export const getSignatureAnchorId = (key: SignatureKey): string => `signature-${key}`;

/**
 * CSS selector of a date's table rows inside the live preview (not the hidden print copy).
 * @param {string} isoDate - ISO date
 * @returns {string} - Selector
 */
export const getPreviewRowSelector = (isoDate: string): string => `[data-preview] tr[data-date="${isoDate}"]`;
