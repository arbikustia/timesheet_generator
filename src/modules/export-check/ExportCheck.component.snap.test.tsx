import test from "@/libs/unit-test";

import ExportCheckComponent from "./ExportCheck.component";

describe("ExportCheckComponent Snapshot Test", () => {
  test.assertSnapshots(ExportCheckComponent, [
    {
      desc: "should render the summary with one error and one warning",
      props: {
        summaryItems: [
          { key: "workdays" as const, label: "Hari kerja terisi", value: "21 / 22" },
          { key: "hours" as const, label: "Total jam", value: "189 jam" },
        ],
        errors: [{ id: "signature:preparedBy", level: "error" as const, message: "Tanda tangan konsultan (Prepared by) belum diunggah.", target: { kind: "signature" as const, key: "preparedBy" as const } }],
        warnings: [{ id: "size", level: "warning" as const, message: "Ukuran dokumen 16.0 MB, di atas batas 15.0 MB.", target: null }],
        infos: [],
        onIssueClick: jest.fn(),
      },
    },
  ]);
});
