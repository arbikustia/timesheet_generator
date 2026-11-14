import { useEffect, useRef } from "react";

/**
 * Use `title` as the page title while printing; browsers take it as the default PDF file name.
 * The previous title is restored after printing. Works for the export button and the browser menu.
 * @param {string} title - Title during printing
 * @returns {void}
 */
export const usePrintTitle = (title: string): void => {
  const titleRef = useRef(title);

  useEffect(() => {
    titleRef.current = title;
  });

  useEffect(() => {
    let previousTitle: string | null = null;

    /**
     * Swap in the print title.
     * @returns {void}
     */
    const handleBeforePrint = (): void => {
      previousTitle = document.title;
      document.title = titleRef.current;
    };

    /**
     * Restore the app title.
     * @returns {void}
     */
    const handleAfterPrint = (): void => {
      if (previousTitle !== null) {
        document.title = previousTitle;
        previousTitle = null;
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return (): void => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);
};
