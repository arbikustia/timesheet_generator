import { fireEvent, render, screen } from "@/libs/unit-test";

import ExportCheckComponent from "./ExportCheck.component";

const ERROR = { id: "e", level: "error" as const, message: "Task kosong pada Kam, 01/10/2026.", target: { kind: "entry" as const, entryId: "x" } };
const INFO = { id: "i", level: "info" as const, message: 'Task "Daily" sama selama 6 hari kerja berturut-turut (01/10–08/10).', target: { kind: "date" as const, date: "2026-10-01" } };
const WARNING = { id: "w", level: "warning" as const, message: "Hari kerja Jum, 02/10/2026 belum ada aktivitas.", target: { kind: "date" as const, date: "2026-10-02" } };

describe("ExportCheckComponent", () => {
  it("should list errors and warnings and forward clicks", () => {
    const onIssueClick = jest.fn();

    render(<ExportCheckComponent summaryItems={[{ key: "hours", label: "Total jam", value: "9 jam" }]} errors={[ERROR]} warnings={[WARNING]} infos={[INFO]} onIssueClick={onIssueClick} />);

    expect(screen.getByText("Total jam")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Error (1)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Peringatan (1)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Info (1)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Info: ${INFO.message}` })).toBeInTheDocument();
    expect(screen.getByText("1 error harus diperbaiki sebelum export PDF.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: `Peringatan: ${WARNING.message}` }));
    expect(onIssueClick).toHaveBeenCalled();
  });

  it("should report a clean document", () => {
    render(<ExportCheckComponent summaryItems={[]} errors={[]} warnings={[]} infos={[]} onIssueClick={jest.fn()} />);

    expect(screen.getByText("Semua beres — siap export PDF.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Error/ })).not.toBeInTheDocument();
  });
});
