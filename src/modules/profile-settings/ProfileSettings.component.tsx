import * as React from "react";
import { Alert, Input } from "antd";

import { PROFILE_TEXT_FIELDS, SIGNATURE_SLOTS } from "./ProfileSettings.config";
import { renderSignatureSlot, renderTextField } from "./ProfileSettings.helper";
import type { ProfileSettingsProps } from "./ProfileSettings.type";

/**
 * Signature date and images.
 * @param {ProfileSettingsProps} props - Settings props
 * @returns {React.ReactElement} - Fieldset
 */
const _renderSignatures = (props: ProfileSettingsProps): React.ReactElement => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-2 text-sm font-semibold">Tanda tangan</legend>
    <label className="flex flex-col gap-1 text-sm font-medium">
      Tanggal tanda tangan
      <Input aria-label="Tanggal tanda tangan" type="date" min={props.minDate} max={props.maxDate} value={props.profile.signDate} onChange={props.onSignDateChange} />
    </label>
    {props.signatureError && <Alert type="error" showIcon title={props.signatureError} />}
    <div className="grid grid-cols-3 gap-2">{SIGNATURE_SLOTS.map((slot) => renderSignatureSlot(slot, props))}</div>
  </fieldset>
);

/**
 * Default hours and favourite task templates.
 * @param {ProfileSettingsProps} props - Settings props
 * @returns {React.ReactElement} - Fieldset
 */
const _renderDefaults = (props: ProfileSettingsProps): React.ReactElement => (
  <fieldset className="flex flex-col gap-2">
    <legend className="mb-2 text-sm font-semibold">Default & template</legend>
    <div className="grid grid-cols-2 gap-2">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Jam mulai default
        <Input aria-label="Jam mulai default" type="time" value={props.profile.defaults.start} data-field="start" onChange={props.onDefaultHourChange} />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Jam selesai default
        <Input aria-label="Jam selesai default" type="time" value={props.profile.defaults.end} data-field="end" onChange={props.onDefaultHourChange} />
      </label>
    </div>
    <label className="flex flex-col gap-1 text-sm font-medium">
      Template task (satu per baris)
      <Input.TextArea aria-label="Template task" autoSize={{ minRows: 3, maxRows: 8 }} value={props.templatesText} onChange={props.onTemplatesChange} />
    </label>
  </fieldset>
);

/**
 * Settings stored in the document (one-time setup).
 * @param {ProfileSettingsProps} props - Settings props
 * @returns {React.ReactElement} - Settings panel
 */
const ProfileSettingsComponent = (props: ProfileSettingsProps): React.ReactElement => (
  <section aria-labelledby="profile-settings-title" className="flex flex-col gap-5">
    <h3 id="profile-settings-title" className="sr-only">
      Pengaturan
    </h3>
    <fieldset className="grid grid-cols-2 gap-2">
      <legend className="mb-2 text-sm font-semibold">Data dokumen</legend>
      {PROFILE_TEXT_FIELDS.map((config) => renderTextField(config, props.profile, props.onTextChange))}
    </fieldset>
    {_renderSignatures(props)}
    {_renderDefaults(props)}
  </section>
);

export default ProfileSettingsComponent;
