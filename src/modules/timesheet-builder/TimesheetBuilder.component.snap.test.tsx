import test, { createStoreWrapper } from "@/libs/unit-test";
import { createEmptyDoc } from "@/libs/utils/timesheet-document.util";

import { makeDocStore } from "@/fixture/timesheet.fixture";

import TimesheetBuilderComponent from "./TimesheetBuilder.component";

describe("TimesheetBuilderComponent Snapshot Test", () => {
  test.assertSnapshots(
    TimesheetBuilderComponent,
    [
      {
        desc: "should render the builder for an empty February 2026",
        props: {
          activeTab: "activities" as const,
          periodLabel: "Februari 2026",
          consultantName: "",
          theme: "light" as const,
          errorCount: 3,
          warningCount: 20,
          onTabChange: jest.fn(),
          onToggleTheme: jest.fn(),
          onNavigate: jest.fn(),
          onShowCheck: jest.fn(),
        },
      },
    ],
    { wrapper: createStoreWrapper(makeDocStore(createEmptyDoc({ year: 2026, month: 2 }))) },
  );
});
