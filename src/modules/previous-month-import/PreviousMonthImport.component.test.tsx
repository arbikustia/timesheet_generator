import { fireEvent, render, screen } from "@/libs/unit-test";

import PreviousMonthImportComponent from "./PreviousMonthImport.component";

describe("PreviousMonthImportComponent", () => {
  it("should forward the button and show an info notice", () => {
    const onChooseFile = jest.fn();

    render(
      <PreviousMonthImportComponent
        fileInputRef={{ current: null }}
        isReading={false}
        notice={{ type: "info", text: "Tidak ada yang perlu diambil." }}
        onChooseFile={onChooseFile}
        onFileChange={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Pilih file bulan lalu…" }));

    expect(onChooseFile).toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Tidak ada yang perlu diambil.");
  });
});
