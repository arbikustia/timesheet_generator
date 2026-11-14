import type { ChangeEvent, MouseEvent } from "react";

import type { Profile } from "@/types/timesheet.type";
import type { ProfileTextField, SignatureKey } from "@/types/timesheet-edit.type";

export type ProfileTextFieldConfig = {
  field: ProfileTextField;
  label: string;
  hint?: string;
};

export type SignatureSlotConfig = {
  key: SignatureKey;
  label: string;
};

export type ProfileFieldHandlers = {
  onTextChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSignDateChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDefaultHourChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTemplatesChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export type SignatureHandlers = {
  signatureError: string | null;
  onSignatureChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSignatureRemove: (event: MouseEvent<HTMLElement>) => void;
};

export type ProfileSettingsProps = ProfileFieldHandlers &
  SignatureHandlers & {
    profile: Profile;
    templatesText: string;
    minDate: string;
    maxDate: string;
  };
