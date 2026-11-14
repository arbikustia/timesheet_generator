import * as React from "react";
import { FiDownload } from "react-icons/fi";
import { Alert, Button } from "antd";

import type { PreviousMonthImportProps } from "./PreviousMonthImport.type";

/**
 * Button that takes over profile, signatures and task list from last month's `.json` file.
 * @param {PreviousMonthImportProps} props - View props
 * @returns {React.ReactElement} - Section
 */
const PreviousMonthImportComponent = (props: PreviousMonthImportProps): React.ReactElement => {
  const { fileInputRef, notice } = props;

  return (
  <section aria-labelledby="previous-month-title" className="flex flex-col gap-2 rounded-lg border border-border-default p-2">
    <h3 id="previous-month-title" className="m-0 text-sm font-semibold">
      Impor dari bulan lalu
    </h3>
    <p className="m-0 text-xs text-text-secondary">
      Ambil profil, tanda tangan, daftar task, ticket dan repo dari file bulan sebelumnya. Hanya isian yang masih kosong yang diisi; aktivitas dan
      evidence tidak ikut.
    </p>
    <Button className="self-start" icon={<FiDownload aria-hidden />} loading={props.isReading} onClick={props.onChooseFile}>
      Pilih file bulan lalu…
    </Button>
    <input ref={fileInputRef} type="file" accept=".json,application/json" hidden aria-label="File dokumen bulan lalu" onChange={props.onFileChange} />
    {notice && <Alert type={notice.type} showIcon role={notice.type === "error" ? "alert" : "status"} title={notice.text} />}
  </section>
  );
};

export default PreviousMonthImportComponent;
