import { PREVIEW_TAB_CSS } from "./ExportPdf.config";

/**
 * Open the rendered document in a new tab: the print copy's markup (the same `<Page>` tree, inline styles)
 * is copied into a blank same-origin tab, which can also be printed from there.
 * @param {Element | null} source - The print copy (`.print-root`)
 * @param {string} title - Tab title (also the default PDF name when printed)
 * @param {Pick<Window, "open">} [opener=window] - Window that opens the tab
 * @returns {boolean} - False when there is nothing to show or the pop-up was blocked
 */
export const openDocumentInNewTab = (source: Element | null, title: string, opener: Pick<Window, "open"> = window): boolean => {
  const tab = source ? opener.open("", "_blank") : null;

  if (!source || !tab) {
    return false;
  }

  const { document: target } = tab;
  const style = target.createElement("style");

  target.title = title;
  style.textContent = PREVIEW_TAB_CSS;
  target.head.append(style);
  target.body.innerHTML = source.innerHTML;

  return true;
};
