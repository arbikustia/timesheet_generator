import test from "@/libs/unit-test";

import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { loadOctoberDocWithEvidence } from "@/fixture/timesheet.fixture";

import TimesheetDocumentComponent from "./TimesheetDocument.component";
import { buildDocumentView } from "./TimesheetDocument.util";

const snapshotConfigs = [
  {
    desc: "should render the October 2026 document with evidence",
    props: { view: buildDocumentView(loadOctoberDocWithEvidence()) },
  },
  {
    desc: "should render an empty February 2026 document",
    props: { view: buildDocumentView(createEmptyDoc({ year: 2026, month: 2 })) },
  },
];

describe("TimesheetDocumentComponent Snapshot Test", () => {
  test.assertSnapshots(TimesheetDocumentComponent, snapshotConfigs);
});
