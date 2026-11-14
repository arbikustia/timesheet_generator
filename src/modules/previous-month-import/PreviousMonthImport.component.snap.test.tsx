import test from "@/libs/unit-test";

import PreviousMonthImportComponent from "./PreviousMonthImport.component";

describe("PreviousMonthImportComponent Snapshot Test", () => {
  test.assertSnapshots(PreviousMonthImportComponent, [
    {
      desc: "should render an error notice",
      props: { fileInputRef: { current: null }, isReading: false, notice: { type: "error" as const, text: "Gagal membaca x.json" }, onChooseFile: jest.fn(), onFileChange: jest.fn() },
    },
  ]);
});
