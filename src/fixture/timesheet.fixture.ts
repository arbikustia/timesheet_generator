import { createEmptyDoc, parseTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import { type AppStore, makeStore } from "@/store";
import { createTimesheetState } from "@/store/timesheet.slice";

import octoberFixture from "./timesheet-2026-10.sample.json";

import type { Evidence, TimesheetDoc } from "@/types/timesheet.type";

/** Tiny evidence image for tests. */
export const SAMPLE_IMAGE: Evidence = {
  id: "img",
  name: "shot.png",
  mime: "image/png",
  dataUrl: "data:image/png;base64,AA",
  w: 10,
  h: 10,
  sensitivity: "plain",
  blurred: false,
};

/**
 * Load the October 2026 fixture as a parsed document (fresh copy per call).
 * @returns {TimesheetDoc} - Parsed fixture
 */
export const loadOctoberDoc = (): TimesheetDoc => {
  const result = parseTimesheetDoc(JSON.stringify(octoberFixture));

  if (!result.isOk) {
    throw new Error(result.message);
  }

  return result.doc;
};

/**
 * Load the October fixture with two evidence images on every entry date and the cover footer filled.
 * @returns {TimesheetDoc} - Fixture with evidence
 */
export const loadOctoberDocWithEvidence = (): TimesheetDoc => {
  const doc = loadOctoberDoc();

  doc.profile.footerCompany = "PT NEGERI EMAS PERKASA";
  doc.profile.footerGroup = "INDONESIA FINANCIAL GROUP (IFG)";
  doc.entries.forEach((entry) => {
    doc.evidence[entry.date] = [
      { ...SAMPLE_IMAGE, id: `${entry.date}-l`, name: `${entry.date}-left.png` },
      { ...SAMPLE_IMAGE, id: `${entry.date}-r`, name: `${entry.date}-right.png` },
    ];
  });

  return doc;
};

/**
 * Store preloaded with a document (October fixture by default).
 * @param {TimesheetDoc} [doc] - Document to preload
 * @returns {AppStore} - Store
 */
export const makeDocStore = (doc: TimesheetDoc = loadOctoberDoc()): AppStore => {
  return makeStore({ timesheet: createTimesheetState(doc) });
};

/**
 * Store with an empty October 2026 document.
 * @returns {AppStore} - Store
 */
export const makeEmptyOctoberStore = (): AppStore => {
  return makeDocStore(createEmptyDoc({ year: 2026, month: 10 }));
};

/**
 * November 2026 document with two automatic entries waiting for review (week of 2 Nov) and one manual row.
 * @returns {TimesheetDoc} - Document
 */
export const loadReviewDoc = (): TimesheetDoc => {
  const doc = createEmptyDoc({ year: 2026, month: 11 });
  const base = { start: "08:00", end: "17:00", remarkOverride: null };

  doc.profile.consultantName = "Arbi Kustia";
  doc.entries = [
    { ...base, id: "manual", date: "2026-11-02", task: "Daily standup", source: "manual", reviewed: true },
    {
      ...base,
      id: "git-1",
      date: "2026-11-02",
      task: "BIT-231 – case transfer",
      source: "git",
      reviewed: false,
      refs: { repo: "BANTUIT FE", branch: "BIT-231-case-transfer", ticket: "BIT-231", hint: { first: "08:12", last: "17:40" }, files: ["src/a.ts"], needsName: true },
    },
    {
      ...base,
      id: "claude-1",
      date: "2026-11-10",
      task: "Integrate api notes",
      source: "claude-code",
      reviewed: false,
      refs: { repo: "BANTUIT FE", summary: "refactor notes api" },
    },
  ];

  return doc;
};
