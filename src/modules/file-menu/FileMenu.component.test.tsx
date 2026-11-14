import { fireEvent, render, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import FileMenuComponent from "./FileMenu.component";
import type { FileMenuProps } from "./FileMenu.type";

/**
 * Build component props.
 * @param {Partial<FileMenuProps>} [overrides] - Prop overrides
 * @returns {FileMenuProps} - Props
 */
const makeProps = (overrides?: Partial<FileMenuProps>): FileMenuProps => ({
  fileLabel: "Dokumen baru",
  statusText: "Tersimpan",
  isDirty: false,
  isSaving: false,
  canReload: false,
  lastFileName: null,
  notice: null,
  pendingConfirm: null,
  draft: null,
  fileInputRef: { current: null },
  onNew: jest.fn(),
  onOpen: jest.fn(),
  onOpenLast: jest.fn(),
  onReload: jest.fn(),
  onSave: jest.fn(),
  onSaveAs: jest.fn(),
  onFileInputChange: jest.fn(),
  onConfirm: jest.fn(),
  onCancelConfirm: jest.fn(),
  onRestoreDraft: jest.fn(),
  onDiscardDraft: jest.fn(),
  onDismissNotice: jest.fn(),
  ...overrides,
});

describe("FileMenuComponent", () => {
  it("should render the buttons and status and forward clicks", () => {
    const props = makeProps();

    render(<FileMenuComponent {...props} />);

    ["Baru", "Buka", "Simpan", "Simpan Sebagai"].forEach((name) => fireEvent.click(screen.getByRole("button", { name })));

    expect(screen.queryByRole("button", { name: "Buka terakhir" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Muat ulang" })).toBeNull();
    expect(screen.getByTestId("file-status")).toHaveTextContent("Dokumen baru · Tersimpan");
    expect(props.onNew).toHaveBeenCalled();
    expect(props.onOpen).toHaveBeenCalled();
    expect(props.onSave).toHaveBeenCalled();
    expect(props.onSaveAs).toHaveBeenCalled();
  });

  it("should show Buka terakhir, the dirty status, a notice and the dialogs", () => {
    const props = makeProps({
      lastFileName: "Timesheet-2026-10.json",
      canReload: true,
      isDirty: true,
      statusText: "Belum disimpan ●",
      notice: { type: "error", text: "Gagal membuka" },
      pendingConfirm: "new",
      draft: { savedAt: new Date(2026, 10, 14, 9, 5).toISOString(), doc: loadOctoberDoc() },
    });

    render(<FileMenuComponent {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Buka terakhir" }));
    fireEvent.click(screen.getByRole("button", { name: "Muat ulang" }));
    fireEvent.click(screen.getByRole("button", { name: "Lanjut tanpa menyimpan" }));
    fireEvent.click(screen.getByRole("button", { name: "Pulihkan draft" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Gagal membuka");
    expect(screen.getByText("Buat dokumen baru?")).toBeInTheDocument();
    expect(screen.getByText(/draft 09:05/)).toBeInTheDocument();
    expect(props.onOpenLast).toHaveBeenCalled();
    expect(props.onReload).toHaveBeenCalled();
    expect(props.onConfirm).toHaveBeenCalled();
    expect(props.onRestoreDraft).toHaveBeenCalled();
  });
});
