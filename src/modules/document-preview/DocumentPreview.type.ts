import type { RefObject } from "react";

import type { TimesheetDoc } from "@/types/timesheet.type";

export type DocumentPreviewProps = {
  doc: TimesheetDoc;
  containerRef: RefObject<HTMLDivElement | null>;
  zoom: number;
};
