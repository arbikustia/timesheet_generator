import type { WorkHours } from "@/types/timesheet.type";
import type { ProfileTextField, SignatureKey } from "@/types/timesheet-edit.type";

import { PROFILE_TEXT_FIELDS, SIGNATURE_SLOTS } from "./ProfileSettings.config";

/**
 * Whether a `data-field` value is an editable profile text field.
 * @param {string | undefined} value - Attribute value
 * @returns {boolean} - True for configured text fields
 */
export const isProfileTextField = (value: string | undefined): value is ProfileTextField => {
  return PROFILE_TEXT_FIELDS.some((config) => config.field === value);
};

/**
 * Whether a `data-signature-key` value is a signature slot.
 * @param {string | undefined} value - Attribute value
 * @returns {boolean} - True for configured slots
 */
export const isSignatureKey = (value: string | undefined): value is SignatureKey => {
  return SIGNATURE_SLOTS.some((slot) => slot.key === value);
};

/**
 * Whether a `data-field` value names a default hour.
 * @param {string | undefined} value - Attribute value
 * @returns {boolean} - True for start or end
 */
export const isWorkHourField = (value: string | undefined): value is keyof WorkHours => {
  return value === "start" || value === "end";
};

/**
 * Split the templates textarea into lines; blank lines are kept while typing and ignored by consumers.
 * @param {string} text - Textarea value
 * @returns {string[]} - One template per line
 */
export const parseTemplates = (text: string): string[] => {
  return text === "" ? [] : text.split("\n");
};
