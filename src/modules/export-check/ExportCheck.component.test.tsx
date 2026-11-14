import { fireEvent, render, screen } from "@/libs/unit-test";

import ExportCheckComponent from "./ExportCheck.component";

const ERROR = { id: "e", level: "error" as const, message: "Task kosong pada Kam, 01/10/2026.", target: { kind: "entry" as const, entryId: "x" } };
const WARNING = { id: "w", level: "warning" as const, message: "Hari kerja Jum, 02/10/2026 belum ada aktivitas.", target: { kind: "date" as const, date: "2026-10-02" } };

describe("ExportCheckComponent", () => {
  it("should list errors and warnings and forward clicks", () => {
    const onIssueClick = jest.fn();

    render(<ExportCheckComponent summaryItems={[{ key: "hours", label: "Total jam", value: "9 jam" }]} errors={[ERROR]} warnings={[WARNING]} onIssueClick={onIssueClick} />);

    expect(screen.getByText("Total jam")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Error (1)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Peringatan (1)" })).toBeInTheDocument();
    expect(screen.getByText("1 error harus diperbaiki sebelum export PDF.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `Peringatan: ${WARNING.message}` }));
    expect(onIssueClick).toHaveBeenCalled();
  });

  it("should report a clean document", () => {
    render(<ExportCheckComponent summaryItems={[]} errors={[]} warnings={[]} onIssueClick={jest.fn()} />);

    expect(screen.getByText("Semua beres — siap export PDF.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Error/ })).not.toBeInTheDocument();
  });
});
