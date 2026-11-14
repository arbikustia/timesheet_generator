/** Number of blocking errors listed in the dialog; the rest are in the export check tab. */
export const MAX_LISTED_ERRORS = 5;

/** Styles of the "Buka di tab baru" preview: grey desk on screen, plain A4 pages when printed from that tab. */
export const PREVIEW_TAB_CSS = `
body { margin: 0; background: #d4d4d4; }
.timesheet-document { padding: 16px 0; }
@page { size: A4; margin: 0; }
@media print {
  body { background: #ffffff; }
  .timesheet-document { display: block !important; gap: 0 !important; padding: 0; }
  [data-page-kind]:last-child { break-after: auto !important; }
}
`;

/** Shown when the browser blocks the preview tab. */
export const POPUP_BLOCKED_MESSAGE = "Tab baru diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.";
