import { createEmptyDoc, parseTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import { type AppStore, makeStore } from "@/store";

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
  return makeStore({ timesheet: { doc } });
};

/**
 * Store with an empty October 2026 document.
 * @returns {AppStore} - Store
 */
export const makeEmptyOctoberStore = (): AppStore => {
  return makeDocStore(createEmptyDoc({ year: 2026, month: 10 }));
};
