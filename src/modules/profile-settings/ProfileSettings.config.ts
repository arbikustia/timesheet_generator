import type { ProfileTextFieldConfig, SignatureSlotConfig } from "./ProfileSettings.type";

/** Text fields of the document profile, in form order. */
export const PROFILE_TEXT_FIELDS: ProfileTextFieldConfig[] = [
  { field: "vendorName", label: "Vendor Name" },
  { field: "consultantName", label: "Consultant Name" },
  { field: "consultantRole", label: "Consultan Role", hint: "Ejaan label di dokumen memang \"Consultan\"." },
  { field: "platform", label: "Platform (kanan atas)" },
  { field: "leadProject", label: "Lead Project/PO" },
  { field: "tribeLeader", label: "Tribe Leader" },
  { field: "squad", label: "Squad" },
  { field: "footerCompany", label: "Footer cover — perusahaan", hint: "mis. PT NEGERI EMAS PERKASA" },
  { field: "footerGroup", label: "Footer cover — grup", hint: "mis. INDONESIA FINANCIAL GROUP (IFG)" },
  { field: "pdfFilePrefix", label: "Prefix nama file PDF" },
];

/** Signature images shown on the signature page. */
export const SIGNATURE_SLOTS: SignatureSlotConfig[] = [
  { key: "preparedBy", label: "Prepared by (konsultan)" },
  { key: "leadProject", label: "Lead Project/PO" },
  { key: "tribeLeader", label: "Tribe Leader" },
];

export const ACCEPTED_SIGNATURE_TYPES = "image/png,image/jpeg,image/webp";
