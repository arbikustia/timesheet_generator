import type { SignatureKey } from "@/types/timesheet-edit.type";
import type { RequiredProfileField } from "@/types/timesheet-validation.type";

/** Daily total below this many hours triggers a warning (PROMPT §7). */
export const MIN_DAILY_HOURS = 8;

/** Daily total above this many hours triggers a warning (PROMPT §7). */
export const MAX_DAILY_HOURS = 12;

/** Indonesian labels of the profile fields the export check requires. */
export const REQUIRED_PROFILE_FIELD_LABELS: Record<RequiredProfileField, string> = {
  consultantName: "Nama konsultan",
  leadProject: "Nama Lead Project/PO",
  tribeLeader: "Nama Tribe Leader",
};

/** Indonesian labels of the signature images. */
export const SIGNATURE_LABELS: Record<SignatureKey, string> = {
  preparedBy: "Tanda tangan konsultan (Prepared by)",
  leadProject: "Tanda tangan Lead Project/PO",
  tribeLeader: "Tanda tangan Tribe Leader",
};
