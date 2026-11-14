import * as React from "react";

import { formatDateDash, formatDateSlash } from "@/libs/utils/date.util";

import type { Evidence } from "@/types/timesheet.type";
import type { EvidencePage, EvidenceSlot } from "@/types/timesheet-engine.type";

import ifgLogo from "@/assets/ifg-logo.png";

import { EVIDENCE, INFO, INFO_COLUMN_WIDTHS_PT, SHEET_COLUMNS, SHEET_TITLE, SIGNATURE, TABLE } from "./TimesheetDocument.config";
import styles, { ALIGN_STYLES, EVIDENCE_SIDE_STYLES, ROW_KIND_STYLES } from "./TimesheetDocument.style";
import type {
  CoverView,
  DocumentView,
  EvidenceSide,
  InfoLine,
  PageKind,
  SheetPage,
  SheetRow,
  SignatureColumn,
  SignatureView,
} from "./TimesheetDocument.type";

/**
 * Render one A4 page frame.
 * @param {PageKind} kind - Page kind, exposed as `data-page-kind`
 * @param {string} key - React key
 * @param {React.ReactNode} children - Page content
 * @returns {React.ReactElement} - A4 page
 */
export const renderPage = (kind: PageKind, key: string, children: React.ReactNode): React.ReactElement => (
  <section key={key} data-page-kind={kind} style={styles.page}>
    {children}
  </section>
);

/**
 * Render one info block line as label, colon, value cells.
 * @param {InfoLine} line - Info line
 * @param {number} labelWidthPt - Width of the label cell
 * @returns {React.ReactElement[]} - Table cells
 */
export const renderInfoCells = (line: InfoLine, labelWidthPt: number): React.ReactElement[] => [
  <td key="label" style={{ ...styles.infoCell, width: `${labelWidthPt}pt` }}>
    {line.label}
  </td>,
  <td key="colon" style={styles.infoCell}>
    {line.value === null ? "" : ":"}
  </td>,
  <td key="value" style={styles.infoCell}>
    {line.value ?? ""}
  </td>,
];

/**
 * Render the logo, title and the two-column info block of the first timesheet page.
 * @param {DocumentView} view - Document view
 * @returns {React.ReactElement} - Sheet header
 */
export const renderSheetHeader = (view: DocumentView): React.ReactElement => (
  <React.Fragment>
    <img src={ifgLogo} alt="IFG" style={styles.logo} />
    <h1 style={styles.title}>{SHEET_TITLE}</h1>
    <table style={styles.infoTable} data-testid="sheet-info">
      <colgroup>
        {INFO_COLUMN_WIDTHS_PT.map((width, index) => (
          <col key={`${index}-${width}`} style={{ width: `${width}pt` }} />
        ))}
      </colgroup>
      <tbody>
        {view.infoLeft.map((line, index) => (
          <tr key={line.label}>
            {renderInfoCells(line, INFO.LEFT_LABEL_WIDTH_PT)}
            {renderInfoCells(view.infoRight[index], INFO.RIGHT_LABEL_WIDTH_PT)}
          </tr>
        ))}
      </tbody>
    </table>
  </React.Fragment>
);

/**
 * Render the cells of one table row; off rows keep task/start/end empty.
 * @param {SheetRow} sheetRow - Row with its height
 * @returns {React.ReactElement} - Table row
 */
export const renderSheetRow = (sheetRow: SheetRow): React.ReactElement => {
  const { row, heightPt } = sheetRow;
  const isWork = row.kind === "work";
  const remarkLines = row.kind === "work" ? row.remarkLines : [row.kind === "off" ? row.remark : ""];

  return (
    <tr key={row.key} data-row-kind={row.kind} data-date={row.date} style={{ ...ROW_KIND_STYLES[row.kind], height: `${heightPt}pt` }}>
      <td style={{ ...styles.cell, ...styles.dateCell }}>{formatDateSlash(row.date)}</td>
      <td style={styles.cell}>{isWork ? row.task : ""}</td>
      <td style={{ ...styles.cell, ...ALIGN_STYLES.center }}>{isWork ? row.start : ""}</td>
      <td style={{ ...styles.cell, ...ALIGN_STYLES.center }}>{isWork ? row.end : ""}</td>
      <td style={styles.cell}>
        {remarkLines.map((line, index) => (
          <span key={`${index}-${line}`} style={styles.remarkLine}>
            {line}
          </span>
        ))}
      </td>
    </tr>
  );
};

/**
 * Render the table header row (first page only).
 * @returns {React.ReactElement} - Table head
 */
export const renderSheetTableHead = (): React.ReactElement => (
  <thead>
    <tr style={styles.headerRow}>
      {SHEET_COLUMNS.map((column) => (
        <th key={column.key} scope="col" style={styles.headerCell}>
          {column.label}
        </th>
      ))}
    </tr>
  </thead>
);

/**
 * Render one timesheet page: header block and table head only on the first page.
 * @param {SheetPage} page - Paginated sheet page
 * @param {DocumentView} view - Document view
 * @returns {React.ReactElement} - A4 page
 */
export const renderSheetPage = (page: SheetPage, view: DocumentView): React.ReactElement => {
  const top = page.isFirst ? TABLE.FIRST_PAGE_TOP_PT : TABLE.NEXT_PAGE_TOP_PT;

  return renderPage(
    "sheet",
    `sheet-${page.index}`,
    <React.Fragment>
      {page.isFirst && renderSheetHeader(view)}
      <table style={{ ...styles.sheetTable, top: `${top}pt` }} data-testid="sheet-table">
        <colgroup>
          {SHEET_COLUMNS.map((column) => (
            <col key={column.key} data-column={column.key} style={{ width: `${column.widthPt}pt` }} />
          ))}
        </colgroup>
        {page.isFirst && renderSheetTableHead()}
        <tbody>{page.rows.map(renderSheetRow)}</tbody>
      </table>
    </React.Fragment>,
  );
};

/**
 * Render the signature image cell of one column.
 * @param {SignatureColumn} column - Signature column
 * @returns {React.ReactElement} - Table cell
 */
export const renderSignatureImageCell = (column: SignatureColumn): React.ReactElement => (
  <td key={column.key} style={styles.signatureImageCell}>
    {column.imageSrc && <img src={column.imageSrc} alt={`Tanda tangan ${column.nameLabel}`} style={styles.signatureImage} />}
  </td>
);

/**
 * Render the Prepared by / Approved by signature page.
 * @param {SignatureView} signature - Signature view
 * @returns {React.ReactElement} - A4 page
 */
export const renderSignaturePage = (signature: SignatureView): React.ReactElement =>
  renderPage(
    "signature",
    "signature",
    <table style={styles.signatureTable} data-testid="signature-table">
      <colgroup>
        {SIGNATURE.COLUMN_WIDTHS_PT.map((width) => (
          <col key={width} style={{ width: `${width}pt` }} />
        ))}
      </colgroup>
      <tbody>
        <tr>
          <td style={styles.signatureCell}>{SIGNATURE.PREPARED_BY}</td>
          <td style={styles.signatureCell} colSpan={2}>
            {SIGNATURE.APPROVED_BY}
          </td>
        </tr>
        <tr>
          {signature.columns.map((column) => (
            <td key={column.key} style={styles.signatureCell}>
              {column.nameLabel}
            </td>
          ))}
        </tr>
        <tr>{signature.columns.map(renderSignatureImageCell)}</tr>
        <tr>
          {signature.columns.map((column) => (
            <td key={column.key} style={styles.signatureCell}>
              {signature.dateLabel}
            </td>
          ))}
        </tr>
      </tbody>
    </table>,
  );

/**
 * Render the red evidence cover page.
 * @param {CoverView} cover - Cover view
 * @returns {React.ReactElement} - A4 page
 */
export const renderEvidenceCover = (cover: CoverView): React.ReactElement =>
  renderPage(
    "cover",
    "cover",
    <React.Fragment>
      <div style={styles.coverTopBlock} />
      <p style={styles.coverTitle}>{cover.title}</p>
      <div style={styles.coverBottomBlock} />
      <p style={styles.coverFooter}>
        {cover.footerLines.map((line, index) => (
          <span key={`${index}-${line}`} style={styles.remarkLine}>
            {line}
          </span>
        ))}
      </p>
    </React.Fragment>,
  );

/**
 * Render one evidence image box; an empty slot renders an empty box.
 * @param {EvidenceSide} side - Left or right slot
 * @param {Evidence} [image] - Image of the slot
 * @returns {React.ReactElement} - Image box
 */
export const renderEvidenceImage = (side: EvidenceSide, image?: Evidence): React.ReactElement => (
  <div key={side} data-evidence-side={side} style={{ ...styles.evidenceImageBox, ...EVIDENCE_SIDE_STYLES[side] }}>
    {image && <img src={image.dataUrl} alt={image.name} style={styles.evidenceImage} />}
  </div>
);

/**
 * Render one date block: `DD-MM-YYYY` label and two images side by side.
 * @param {EvidenceSlot} slot - Evidence slot
 * @param {number} topPt - Top position of the slot
 * @returns {React.ReactElement} - Slot block
 */
export const renderEvidenceSlot = (slot: EvidenceSlot, topPt: number): React.ReactElement => (
  <div key={slot.date} data-evidence-date={slot.date} style={{ ...styles.evidenceSlot, top: `${topPt}pt` }}>
    <p style={styles.evidenceLabel}>{formatDateDash(slot.date)}</p>
    {renderEvidenceImage("left", slot.images[0])}
    {renderEvidenceImage("right", slot.images[1])}
  </div>
);

/**
 * Render one evidence page; only the first has the month header.
 * @param {EvidencePage} page - Evidence page
 * @param {string} monthLabel - `MMMM YYYY`
 * @returns {React.ReactElement} - A4 page
 */
export const renderEvidencePage = (page: EvidencePage, monthLabel: string): React.ReactElement => {
  const firstTop = page.isFirst ? EVIDENCE.FIRST_SLOT_TOP_PT : EVIDENCE.NEXT_SLOT_TOP_PT;

  return renderPage(
    "evidence",
    `evidence-${page.pageNumber}`,
    <React.Fragment>
      <p style={styles.pageNumber}>{`Page | ${page.pageNumber}`}</p>
      {page.isFirst && <p style={styles.evidenceMonth}>{monthLabel}</p>}
      {page.isFirst && <p style={styles.evidenceSubtitle}>{EVIDENCE.SUBTITLE}</p>}
      {page.slots.map((slot, index) => renderEvidenceSlot(slot, firstTop + index * EVIDENCE.SLOT_PITCH_PT))}
    </React.Fragment>,
  );
};
