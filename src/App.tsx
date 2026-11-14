import * as React from "react";

import { parseTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import octoberFixture from "@/fixture/timesheet-2026-10.sample.json";

import TimesheetDocument from "@/modules/timesheet-document";

const PREVIEW_RESULT = parseTimesheetDoc(JSON.stringify(octoberFixture));

/**
 * Application root. Until the input panel lands (Phase 3) it previews the October 2026 fixture.
 * @returns {React.ReactElement} - App shell
 */
const App = (): React.ReactElement => {
  if (!PREVIEW_RESULT.isOk) {
    return <p role="alert">{PREVIEW_RESULT.message}</p>;
  }

  return (
    <main className="min-h-screen bg-neutral-200 py-6">
      <h1 className="sr-only">Timesheet Builder</h1>
      <TimesheetDocument doc={PREVIEW_RESULT.doc} />
    </main>
  );
};

export default App;
