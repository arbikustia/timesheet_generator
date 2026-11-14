import * as React from "react";
import { FiCopy } from "react-icons/fi";
import { Alert, Button } from "antd";

import { renderReviewWeek } from "./ImportReview.helper";
import type { ImportReviewProps } from "./ImportReview.type";

/**
 * How to bring collector data in: the browser cannot run git, so the CLI writes into the file.
 * @param {ImportReviewProps} props - Panel props
 * @returns {React.ReactElement} - Instructions
 */
const _renderInstructions = (props: ImportReviewProps): React.ReactElement => (
  <details className="rounded-lg border border-border-default p-2 text-sm">
    <summary className="cursor-pointer font-medium">Cara impor dari worklog</summary>
    <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
      <li>
        Simpan dokumen ke file, lalu di terminal jalankan <code>{props.snapshotCommand}</code> (otomatis tiap sore bila scheduler terpasang).
      </li>
      <li className="flex flex-col gap-1">
        <span>Impor worklog ke file dokumen (dari folder tempat file berada):</span>
        <span className="flex flex-wrap items-center gap-2">
          <code className="break-all rounded bg-background-subtle px-1.5 py-0.5" data-testid="import-command">
            {props.importCommand}
          </code>
          <Button size="small" icon={<FiCopy aria-hidden />} onClick={props.onCopyCommand}>
            {props.isCopied ? "Disalin" : "Salin perintah"}
          </Button>
        </span>
      </li>
      <li>
        Klik <strong>Muat ulang</strong> di top bar. Entri otomatis muncul di bawah sebagai usulan dan memblokir export sampai direview.
      </li>
    </ol>
  </details>
);

/**
 * "Import & Review" (PROMPT §12.5): automatic entries wait here until accepted, merged or rejected.
 * @param {ImportReviewProps} props - Panel props
 * @returns {React.ReactElement} - Panel
 */
const ImportReviewComponent = (props: ImportReviewProps): React.ReactElement => (
  <section aria-labelledby="import-review-title" className="flex flex-col gap-3">
    <h3 id="import-review-title" className="m-0 text-sm font-semibold">
      Import &amp; Review
    </h3>
    {props.pendingCount > 0 ? (
      <Alert type="warning" showIcon title={`${props.pendingCount} entri otomatis belum direview — export diblokir sampai semuanya direview.`} />
    ) : (
      <Alert type="success" showIcon title="Tidak ada entri otomatis yang menunggu review." />
    )}
    {_renderInstructions(props)}
    {props.weeks.map((week) => renderReviewWeek(week, props))}
  </section>
);

export default ImportReviewComponent;
