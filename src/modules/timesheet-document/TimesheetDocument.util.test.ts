import type { TimesheetRow, WorkRow } from "@/types/timesheet-engine.type";

import { loadOctoberDoc, loadOctoberDocWithEvidence } from "@/fixture/timesheet.fixture";

import {
  buildCoverView,
  buildDocumentView,
  buildInfoLines,
  buildSignatureView,
  estimateLineCount,
  getColumnCharsPerLine,
  getRowHeight,
  paginateSheetRows,
} from "./TimesheetDocument.util";

const WORK_ROW: WorkRow = {
  kind: "work",
  key: "e1",
  date: "2026-10-01",
  entryId: "e1",
  task: "Tech debt case admin list",
  start: "08:00",
  end: "17:00",
  evidencePage: 1,
  remarkLines: ["Foto / Screenshot", "Evidence Page 1"],
};

describe("estimateLineCount", () => {
  it("should count wrapped lines with greedy word wrap", () => {
    expect(estimateLineCount("Tech debt case admin list", 43)).toBe(1);
    expect(estimateLineCount("aaaa bbbb cccc", 9)).toBe(2);
    expect(estimateLineCount("aaaa bbbb cccc", 4)).toBe(3);
  });

  it("should honour explicit line breaks and empty text", () => {
    expect(estimateLineCount("Foto / Screenshot\nEvidence Page 1", 20)).toBe(2);
    expect(estimateLineCount("", 20)).toBe(1);
  });

  it("should split a word longer than a line", () => {
    expect(estimateLineCount("x".repeat(90), 42)).toBe(3);
    expect(estimateLineCount(`ab ${"x".repeat(50)} cd`, 42)).toBe(3);
  });
});

describe("getColumnCharsPerLine", () => {
  it("should derive capacity from the column width", () => {
    expect(getColumnCharsPerLine("task")).toBe(43);
    expect(getColumnCharsPerLine("remark")).toBe(20);
  });
});

describe("getRowHeight", () => {
  it("should use fixed heights for off and empty rows", () => {
    expect(getRowHeight({ kind: "off", key: "d", date: "2026-10-03", reason: "weekend", remark: "Weekend" })).toBe(22);
    expect(getRowHeight({ kind: "empty", key: "d", date: "2026-10-05" })).toBe(39);
  });

  it("should keep 39pt for a short work row and grow for wrapped text", () => {
    expect(getRowHeight(WORK_ROW)).toBe(39);
    expect(getRowHeight({ ...WORK_ROW, task: "word ".repeat(40) })).toBe(5 * 13 + 4);
  });
});

describe("paginateSheetRows", () => {
  it("should flow the October table onto two pages without splitting rows", () => {
    const pages = buildDocumentView(loadOctoberDoc()).sheetPages;

    expect(pages).toHaveLength(2);
    expect(pages.map((page) => page.isFirst)).toEqual([true, false]);
    expect(pages[0].rows.at(-1)?.row.date).toBe("2026-10-16");
    expect(pages[1].rows[0].row.date).toBe("2026-10-17");
    expect(pages[0].rows.length + pages[1].rows.length).toBe(32);
  });

  it("should return one empty page without rows", () => {
    expect(paginateSheetRows([])).toEqual([{ index: 0, isFirst: true, rows: [] }]);
  });

  it("should never leave a page empty for an oversized row", () => {
    const huge: TimesheetRow = { ...WORK_ROW, task: "word ".repeat(1000) };
    const pages = paginateSheetRows([huge, huge]);

    expect(pages.map((page) => page.rows.length)).toEqual([1, 1]);
  });
});

describe("view builders", () => {
  const { profile } = loadOctoberDoc();

  it("should build the info block with the original labels", () => {
    const [left, right] = buildInfoLines(profile, "October 2026");

    expect(left).toEqual([
      { label: "Vendor Name", value: "PT Negeri Emas Perkasa" },
      { label: "Consultant Name", value: "Arbi Kustia" },
      { label: "Consultan Role", value: "Front End Developer" },
      { label: "Month", value: "October 2026" },
    ]);
    expect(right).toEqual([
      { label: "Legacy Platform", value: null },
      { label: "Lead Project/PO", value: "Fahly Faraby" },
      { label: "Tribe Leader", value: "Rio Hermanto" },
      { label: "Squad", value: "Epics Asum" },
    ]);
  });

  it("should build signature names and date", () => {
    const signature = buildSignatureView(profile);

    expect(signature.columns.map((column) => column.nameLabel)).toEqual([
      "Name : Arbi Kustia",
      "Name: Fahly Faraby",
      "Name: Rio Hermanto",
    ]);
    expect(signature.columns.every((column) => column.imageSrc === null)).toBe(true);
    expect(signature.dateLabel).toBe("Date: 30 October 2026");
  });

  it("should build the uppercase cover title", () => {
    expect(buildCoverView(loadOctoberDocWithEvidence().profile, "October 2026")).toEqual({
      title: "EVIDENCE OCTOBER 2026 – ARBI KUSTIA – FRONT END DEVELOPER – EPICS ASUM",
      footerLines: ["PT NEGERI EMAS PERKASA", "INDONESIA FINANCIAL GROUP (IFG)"],
    });
  });

  it("should wire evidence pages into the remark numbering", () => {
    const view = buildDocumentView(loadOctoberDocWithEvidence());
    const row = view.sheetPages[0].rows.find((item) => item.row.date === "2026-10-06")?.row;

    expect(view.monthLabel).toBe("October 2026");
    expect(view.evidencePages).toHaveLength(6);
    expect(row?.kind === "work" && row.remarkLines).toEqual(["Foto / Screenshot", "Evidence Page 2"]);
  });
});
