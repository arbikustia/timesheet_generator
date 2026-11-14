import { type ChangeEvent, type MouseEvent, useCallback, useState } from "react";

import { getMonthDates } from "@/libs/utils/date.util";
import { isAcceptedImage, readFileAsDataUrl } from "@/libs/utils/file.util";

import type { ProfileFieldHandlers, ProfileSettingsProps, SignatureHandlers } from "./ProfileSettings.type";
import { isProfileTextField, isSignatureKey, isWorkHourField, parseTemplates } from "./ProfileSettings.util";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDoc, setSignature, updateDefaultHours, updateProfile } from "@/store/timesheet.slice";

/**
 * Change handlers of the profile fields; inputs are identified by `data-field`.
 * @returns {ProfileFieldHandlers} - Handlers
 */
export const useProfileFieldHandlers = (): ProfileFieldHandlers => {
  const dispatch = useAppDispatch();

  /**
   * Update a profile text field.
   * @param {ChangeEvent<HTMLInputElement>} event - Input event
   * @returns {void}
   */
  const handleTextChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { field } = event.currentTarget.dataset;

      if (isProfileTextField(field)) {
        dispatch(updateProfile({ [field]: event.currentTarget.value }));
      }
    },
    [dispatch],
  );

  /**
   * Update the signature date (ignores a cleared input).
   * @param {ChangeEvent<HTMLInputElement>} event - Date input event
   * @returns {void}
   */
  const handleSignDateChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      if (event.currentTarget.value) {
        dispatch(updateProfile({ signDate: event.currentTarget.value }));
      }
    },
    [dispatch],
  );

  return { onTextChange: handleTextChange, onSignDateChange: handleSignDateChange, ...usePreferenceHandlers() };
};

/**
 * Default hours and task templates handlers.
 * @returns {Pick<ProfileFieldHandlers, "onDefaultHourChange" | "onTemplatesChange">} - Handlers
 */
export const usePreferenceHandlers = (): Pick<ProfileFieldHandlers, "onDefaultHourChange" | "onTemplatesChange"> => {
  const dispatch = useAppDispatch();

  /**
   * Update a default hour named by `data-field`.
   * @param {ChangeEvent<HTMLInputElement>} event - Time input event
   * @returns {void}
   */
  const handleDefaultHourChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { field } = event.currentTarget.dataset;

      if (isWorkHourField(field)) {
        dispatch(updateDefaultHours({ [field]: event.currentTarget.value }));
      }
    },
    [dispatch],
  );

  /**
   * Update the favourite task templates (one per line).
   * @param {ChangeEvent<HTMLTextAreaElement>} event - Textarea event
   * @returns {void}
   */
  const handleTemplatesChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>): void => {
      dispatch(updateProfile({ taskTemplates: parseTemplates(event.currentTarget.value) }));
    },
    [dispatch],
  );

  return { onDefaultHourChange: handleDefaultHourChange, onTemplatesChange: handleTemplatesChange };
};

/**
 * Upload and remove signature images; inputs are identified by `data-signature-key`.
 * Images are read locally as data URLs and stored in the document only.
 * @returns {SignatureHandlers} - Error and handlers
 */
export const useSignatureHandlers = (): SignatureHandlers => {
  const dispatch = useAppDispatch();
  const [signatureError, setSignatureError] = useState<string | null>(null);

  /**
   * Read the chosen image into the signature slot.
   * @param {ChangeEvent<HTMLInputElement>} event - File input event
   * @returns {Promise<void>} - Resolves when stored
   */
  const handleSignatureChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = event.currentTarget;
    const { signatureKey } = input.dataset;
    const file = input.files?.[0];

    input.value = "";

    if (!file || !isSignatureKey(signatureKey)) {
      return;
    }

    if (!isAcceptedImage(file)) {
      setSignatureError("Gunakan gambar PNG, JPG atau WebP.");

      return;
    }

    setSignatureError(null);
    dispatch(setSignature({ key: signatureKey, dataUrl: await readFileAsDataUrl(file) }));
  };

  /**
   * Remove the signature image.
   * @param {MouseEvent<HTMLElement>} event - Click event
   * @returns {void}
   */
  const handleSignatureRemove = (event: MouseEvent<HTMLElement>): void => {
    const { signatureKey } = event.currentTarget.dataset;

    if (isSignatureKey(signatureKey)) {
      dispatch(setSignature({ key: signatureKey, dataUrl: null }));
    }
  };

  /**
   * File input change handler (fire-and-forget wrapper of the async reader).
   * @param {ChangeEvent<HTMLInputElement>} event - File input event
   * @returns {void}
   */
  const handleSignatureInput = (event: ChangeEvent<HTMLInputElement>): void => {
    void handleSignatureChange(event);
  };

  return { signatureError, onSignatureChange: handleSignatureInput, onSignatureRemove: handleSignatureRemove };
};

/**
 * Settings stored in the document: profile, signatures, default hours and task templates.
 * @returns {ProfileSettingsProps} - Values and handlers
 */
export const useProfileSettings = (): ProfileSettingsProps => {
  const { profile, period } = useAppSelector(selectDoc);
  const dates = getMonthDates(period);

  return {
    profile,
    templatesText: profile.taskTemplates.join("\n"),
    minDate: dates[0],
    maxDate: dates[dates.length - 1],
    ...useProfileFieldHandlers(),
    ...useSignatureHandlers(),
  };
};
