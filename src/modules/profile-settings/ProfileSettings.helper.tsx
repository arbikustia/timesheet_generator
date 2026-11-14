import * as React from "react";
import { FiTrash2 } from "react-icons/fi";
import { Button, Input } from "antd";

import type { Profile } from "@/types/timesheet.type";

import { ACCEPTED_SIGNATURE_TYPES } from "./ProfileSettings.config";
import type { ProfileSettingsProps, ProfileTextFieldConfig, SignatureSlotConfig } from "./ProfileSettings.type";

/**
 * One labelled profile text input.
 * @param {ProfileTextFieldConfig} config - Field config
 * @param {Profile} profile - Current profile
 * @param {ProfileSettingsProps["onTextChange"]} onTextChange - Change handler
 * @returns {React.ReactElement} - Field
 */
export const renderTextField = (
  config: ProfileTextFieldConfig,
  profile: Profile,
  onTextChange: ProfileSettingsProps["onTextChange"],
): React.ReactElement => (
  <label key={config.field} className="flex flex-col gap-1 text-sm font-medium">
    {config.label}
    <Input aria-label={config.label} value={profile[config.field]} data-field={config.field} onChange={onTextChange} />
    {config.hint && <span className="text-xs font-normal text-text-secondary">{config.hint}</span>}
  </label>
);

/**
 * One signature upload slot with preview.
 * @param {SignatureSlotConfig} slot - Slot config
 * @param {ProfileSettingsProps} props - Settings props
 * @returns {React.ReactElement} - Slot
 */
export const renderSignatureSlot = (slot: SignatureSlotConfig, props: ProfileSettingsProps): React.ReactElement => {
  const src = props.profile.signatures[slot.key];

  return (
    <div key={slot.key} className="flex flex-col gap-2 rounded-lg border border-border-default p-2 text-sm">
      <span className="font-medium">{slot.label}</span>
      <div className="flex h-20 items-center justify-center rounded bg-white">
        {src ? <img src={src} alt={`Tanda tangan ${slot.label}`} className="max-h-20 max-w-full object-contain" /> : <span className="text-xs text-neutral-500">Belum ada</span>}
      </div>
      <input
        type="file"
        aria-label={`Unggah tanda tangan ${slot.label}`}
        accept={ACCEPTED_SIGNATURE_TYPES}
        className="text-xs"
        data-signature-key={slot.key}
        onChange={props.onSignatureChange}
      />
      {src && (
        <Button size="small" danger icon={<FiTrash2 aria-hidden />} data-signature-key={slot.key} onClick={props.onSignatureRemove}>
          Hapus
        </Button>
      )}
    </div>
  );
};
