import {
  _formatIssues,
  createEmptyDoc,
  getDefaultDocFileName,
  migrateDoc,
  parseTimesheetDoc,
  serializeTimesheetDoc,
} from "@/libs/utils/timesheet-document.util";

import { TimesheetDocSchema } from "@/types/timesheet.type";

import octoberFixture from "@/fixture/timesheet-2026-10.sample.json";

const FIXTURE_TEXT = JSON.stringify(octoberFixture);

describe("parseTimesheetDoc", () => {
  it("should parse the October 2026 fixture and fill missing fields with defaults", () => {
    const result = parseTimesheetDoc(FIXTURE_TEXT);

    expect(result.isOk).toBe(true);

    if (!result.isOk) {
      return;
    }

    expect(result.doc.period).toEqual({ year: 2026, month: 10 });
    expect(result.doc.entries).toHaveLength(23);
    expect(result.doc.entries.filter((entry) => entry.date === "2026-10-07")).toHaveLength(2);
    expect(result.doc.entries[0]).toMatchObject({ source: "manual", reviewed: true });
    expect(result.doc.profile.defaults).toEqual({ start: "08:00", end: "17:00" });
    expect(result.doc.profile.footerCompany).toBe("");
    expect(result.doc.automation.ticketPattern).toBe("(BIT|ASUM)-\\d+");
  });

  it("should reject text that is not JSON", () => {
    const result = parseTimesheetDoc("{not json");

    expect(result).toMatchObject({ isOk: false, code: "invalid-json" });
  });

  it("should reject JSON without schemaVersion", () => {
    expect(parseTimesheetDoc("{\"entries\":[]}")).toMatchObject({ isOk: false, code: "invalid-shape" });
  });

  it("should reject documents from a newer app version", () => {
    expect(parseTimesheetDoc("{\"schemaVersion\":99}")).toMatchObject({
      isOk: false,
      code: "unsupported-version",
    });
  });

  it("should report field issues for an invalid document", () => {
    const broken = { ...JSON.parse(FIXTURE_TEXT), period: { year: 2026, month: 13 } };
    const result = parseTimesheetDoc(JSON.stringify(broken));

    expect(result).toMatchObject({ isOk: false, code: "invalid-shape" });
    expect(result.isOk ? [] : result.issues).toEqual(expect.arrayContaining([expect.stringContaining("period.month")]));
  });

  it("should reject more than two evidence images per date", () => {
    const image = { id: "x", mime: "image/png", dataUrl: "data:image/png;base64,AA", w: 1, h: 1 };
    const broken = { ...JSON.parse(FIXTURE_TEXT), evidence: { "2026-10-01": [image, image, image] } };

    expect(parseTimesheetDoc(JSON.stringify(broken)).isOk).toBe(false);
  });

  it("should round-trip through serialize and parse", () => {
    const doc = createEmptyDoc({ year: 2024, month: 2 });
    const result = parseTimesheetDoc(serializeTimesheetDoc(doc));

    expect(result).toEqual({ isOk: true, doc });
  });
});

describe("migrateDoc", () => {
  it("should return the document unchanged when already current", () => {
    const doc = { schemaVersion: 1, foo: "bar" };

    expect(migrateDoc(doc)).toBe(doc);
  });

  it("should apply each step in order from an older version", () => {
    const migrated = migrateDoc(
      { schemaVersion: 0, legacy: true },
      { 0: (doc) => ({ ...doc, schemaVersion: 1, upgraded: true }) },
    );

    expect(migrated).toEqual({ schemaVersion: 1, legacy: true, upgraded: true });
  });

  it("should throw when a migration step is missing", () => {
    expect(() => migrateDoc({ schemaVersion: 0 }, {})).toThrow("schemaVersion 0");
  });

  it("should reject a non-positive schemaVersion as an invalid document", () => {
    expect(parseTimesheetDoc("{\"schemaVersion\":0}")).toMatchObject({ isOk: false, code: "invalid-shape" });
  });
});

describe("createEmptyDoc", () => {
  it("should create a valid document with empty data and the last weekday as sign date", () => {
    const doc = createEmptyDoc({ year: 2026, month: 10 });

    expect(TimesheetDocSchema.safeParse(doc).success).toBe(true);
    expect(doc.entries).toEqual([]);
    expect(doc.evidence).toEqual({});
    expect(doc.profile.signDate).toBe("2026-10-30");
    expect(doc.profile.signatures).toEqual({ preparedBy: null, leadProject: null, tribeLeader: null });
  });
});

describe("getDefaultDocFileName", () => {
  it("should include year, zero-padded month and the consultant name", () => {
    const doc = createEmptyDoc({ year: 2026, month: 3 });

    doc.profile.consultantName = " Arbi  Kustia/ ";

    expect(getDefaultDocFileName(doc)).toBe("Timesheet-2026-03-Arbi-Kustia.json");
  });

  it("should omit the consultant part when it is empty", () => {
    expect(getDefaultDocFileName(createEmptyDoc({ year: 2026, month: 11 }))).toBe("Timesheet-2026-11.json");
  });
});

describe("_formatIssues", () => {
  it("should label root-level issues", () => {
    const result = TimesheetDocSchema.safeParse(null);

    expect(result.success ? [] : _formatIssues(result.error)).toEqual([expect.stringMatching(/^\(root\): /)]);
  });
});
