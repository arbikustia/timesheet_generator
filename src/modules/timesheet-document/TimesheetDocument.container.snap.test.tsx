import test from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import TimesheetDocumentContainer from "./TimesheetDocument.container";

const snapshotConfigs = [
  {
    desc: "should render the October 2026 fixture without evidence",
    props: { doc: loadOctoberDoc() },
  },
];

describe("TimesheetDocumentContainer Snapshot Test", () => {
  test.assertSnapshots(TimesheetDocumentContainer, snapshotConfigs);
});
