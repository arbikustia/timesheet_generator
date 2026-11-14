import test from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import EntryListComponent from "./EntryList.component";
import { buildEntryRows } from "./EntryList.hook";

const DOC = loadOctoberDoc();
const HANDLERS = {
  dragIndex: null,
  onFieldChange: jest.fn(),
  onRemarkChange: jest.fn(),
  onDuplicate: jest.fn(),
  onRemove: jest.fn(),
  onDragStart: jest.fn(),
  onDragOver: jest.fn(),
  onDrop: jest.fn(),
  onDragEnd: jest.fn(),
  onMoveUp: jest.fn(),
  onMoveDown: jest.fn(),
};

describe("EntryListComponent Snapshot Test", () => {
  test.assertSnapshots(EntryListComponent, [
    {
      desc: "should render two activities",
      props: {
        ...HANDLERS,
        rows: buildEntryRows({ ...DOC, entries: DOC.entries.slice(0, 2) }),
        dateOptions: [{ value: "2026-10-01", label: "Kam, 01/10/2026" }, { value: "2026-10-02", label: "Jum, 02/10/2026" }],
      },
    },
    { desc: "should render the empty state", props: { ...HANDLERS, rows: [], dateOptions: [] } },
  ]);
});
