import {
  _buildDateRow,
  buildTimesheetRows,
  getEvidenceDates,
  getEvidencePageMap,
  getEvidenceRemarkLines,
  getNextUnfilledWorkday,
  paginateEvidence,
} from "@/libs/utils/timesheet-engine.util";

import {
  loadOctoberDoc as loadOctober,
  loadOctoberDocWithEvidence as loadOctoberWithEvidence,
  SAMPLE_IMAGE as IMAGE,
} from "@/fixture/timesheet.fixture";

describe("paginateEvidence", () => {
  it("should put 3 dates on the first page and 4 on each following page", () => {
    const pages = paginateEvidence(loadOctoberWithEvidence());

    expect(pages.map((page) => page.slots.length)).toEqual([3, 4, 4, 4, 4, 3]);
    expect(pages.map((page) => page.isFirst)).toEqual([true, false, false, false, false, false]);
    expect(pages[0].slots.map((slot) => slot.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-05"]);
    expect(pages[1].slots[0].date).toBe("2026-10-06");
    expect(pages[0].slots[0].images).toHaveLength(2);
  });

  it("should return no page without evidence", () => {
    expect(paginateEvidence(loadOctober())).toEqual([]);
  });

  it("should ignore empty slots and dates outside the period", () => {
    const doc = loadOctober();

    doc.evidence = { "2026-10-02": [IMAGE], "2026-10-01": [], "2026-11-02": [IMAGE] };

    expect(getEvidenceDates(doc)).toEqual(["2026-10-02"]);
  });

  it("should open a third page after 7 dates", () => {
    const doc = loadOctober();

    doc.entries.slice(0, 9).forEach((entry) => {
      doc.evidence[entry.date] = [IMAGE];
    });

    expect(paginateEvidence(doc).map((page) => page.slots.length)).toEqual([3, 4, 1]);
  });
});

describe("buildTimesheetRows (October 2026 golden)", () => {
  it("should render one row per date with 07/10 twice", () => {
    const rows = buildTimesheetRows(loadOctober());
    const dates = rows.map((row) => row.date.slice(8));

    expect(rows).toHaveLength(32);
    expect(new Set(dates).size).toBe(31);
    expect(dates.filter((day) => day === "07")).toHaveLength(2);
  });

  it("should render the weekends as red Weekend rows", () => {
    const offRows = buildTimesheetRows(loadOctober()).filter((row) => row.kind === "off");

    expect(offRows.map((row) => row.date.slice(8))).toEqual(["03", "04", "10", "11", "17", "18", "24", "25", "31"]);
    expect(offRows.every((row) => row.kind === "off" && row.remark === "Weekend" && row.reason === "weekend")).toBe(true);
  });

  it("should keep the fixture values of work rows", () => {
    const first = buildTimesheetRows(loadOctober())[0];

    expect(first).toMatchObject({
      kind: "work",
      date: "2026-10-01",
      task: "Tech debt case admin list",
      start: "08:04",
      end: "17:00",
      evidencePage: null,
      remarkLines: ["Foto / Screenshot"],
    });
  });

  it("should number Evidence Page N by the 3-then-4 capacity rule", () => {
    const rows = buildTimesheetRows(loadOctoberWithEvidence());
    const pageByDay = new Map(rows.flatMap((row) => (row.kind === "work" ? [[row.date.slice(8), row.evidencePage]] : [])));

    expect(Object.fromEntries(pageByDay)).toEqual({
      "01": 1, "02": 1, "05": 1,
      "06": 2, "07": 2, "08": 2, "09": 2,
      "12": 3, "13": 3, "14": 3, "15": 3,
      "16": 4, "19": 4, "20": 4, "21": 4,
      "22": 5, "23": 5, "26": 5, "27": 5,
      "28": 6, "29": 6, "30": 6,
    });
    expect(rows.find((row) => row.date === "2026-10-06")).toMatchObject({
      remarkLines: ["Foto / Screenshot", "Evidence Page 2"],
    });
  });

  it("should prefer a manual remark override", () => {
    const doc = loadOctoberWithEvidence();

    doc.entries[0].remarkOverride = "Foto / Screenshot\nEvidence Page 9";

    expect(buildTimesheetRows(doc)[0]).toMatchObject({ remarkLines: ["Foto / Screenshot", "Evidence Page 9"] });
  });

  it("should render a holiday override and an empty working day", () => {
    const doc = loadOctober();

    doc.entries = doc.entries.filter((entry) => entry.date !== "2026-10-01" && entry.date !== "2026-10-02");
    doc.dayOverrides["2026-10-01"] = { type: "holiday", label: "Public Holiday" };

    const rows = buildTimesheetRows(doc);

    expect(rows[0]).toEqual({ kind: "off", key: "2026-10-01", date: "2026-10-01", reason: "holiday", remark: "Public Holiday" });
    expect(rows[1]).toEqual({ kind: "empty", key: "2026-10-02", date: "2026-10-02" });
  });

  it("should keep entries on a weekend instead of hiding them", () => {
    const doc = loadOctober();

    doc.entries.push({ ...doc.entries[0], id: "sat", date: "2026-10-03" });

    expect(buildTimesheetRows(doc).find((row) => row.date === "2026-10-03")).toMatchObject({ kind: "work" });
  });

  it("should ignore entries outside the period", () => {
    const doc = loadOctober();

    doc.entries.push({ ...doc.entries[0], id: "nov", date: "2026-11-02" });

    expect(buildTimesheetRows(doc)).toHaveLength(32);
  });
});

describe("helpers", () => {
  it("should build remark lines with and without evidence", () => {
    expect(getEvidenceRemarkLines(3)).toEqual(["Foto / Screenshot", "Evidence Page 3"]);
    expect(getEvidenceRemarkLines(null)).toEqual(["Foto / Screenshot"]);
  });

  it("should build a leave row from its override label", () => {
    expect(_buildDateRow("2026-10-05", { type: "leave", label: "Cuti" })).toMatchObject({ reason: "leave", remark: "Cuti" });
  });

  it("should map evidence dates to page numbers", () => {
    const map = getEvidencePageMap(paginateEvidence(loadOctoberWithEvidence()));

    expect(map.get("2026-10-05")).toBe(1);
    expect(map.get("2026-10-30")).toBe(6);
    expect(map.has("2026-10-03")).toBe(false);
  });
});

describe("getNextUnfilledWorkday", () => {
  it("should return null when every working day is filled", () => {
    expect(getNextUnfilledWorkday(loadOctober())).toBeNull();
  });

  it("should skip weekends, overrides and filled days", () => {
    const doc = loadOctober();

    doc.entries = doc.entries.filter((entry) => entry.date >= "2026-10-08");
    doc.dayOverrides["2026-10-01"] = { type: "leave", label: "Cuti" };

    expect(getNextUnfilledWorkday(doc)).toBe("2026-10-02");
  });

  it("should return the first weekday of an empty month", () => {
    const doc = loadOctober();

    doc.entries = [];
    doc.period = { year: 2026, month: 11 };

    expect(getNextUnfilledWorkday(doc)).toBe("2026-11-02");
  });
});
