import { useEffect } from "react";

/**
 * Ask the browser to confirm leaving the page while there are unsaved changes.
 * @param {boolean} isEnabled - True while the document is dirty
 * @returns {void}
 */
export const useBeforeUnload = (isEnabled: boolean): void => {
  useEffect(() => {
    if (!isEnabled) {
      return undefined;
    }

    /**
     * Trigger the browser's "leave site?" confirmation.
     * @param {BeforeUnloadEvent} event - Unload event
     * @returns {void}
     */
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return (): void => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEnabled]);
};
