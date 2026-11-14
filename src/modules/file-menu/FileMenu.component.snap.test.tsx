import test from "@/libs/unit-test";

import FileMenuComponent from "./FileMenu.component";

const BASE_PROPS = {
  fileLabel: "Timesheet-2026-10-Arbi-Kustia.json",
  statusText: "Belum disimpan ●",
  isDirty: true,
  isSaving: false,
  canReload: false,
  lastFileName: "Timesheet-2026-09-Arbi-Kustia.json",
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
};

describe("FileMenuComponent Snapshot Test", () => {
  test.assertSnapshots(FileMenuComponent, [{ desc: "should render an unsaved named document", props: BASE_PROPS }]);
});
