import * as React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { Button, Divider, Tabs, type TabsProps } from "antd";

import { BUILDER_TAB_LABELS } from "./TimesheetBuilder.config";
import type { TimesheetBuilderProps } from "./TimesheetBuilder.type";

import DayOverrides from "@/modules/day-overrides";
import DocumentPreview from "@/modules/document-preview";
import EditHistory from "@/modules/edit-history";
import EntryForm from "@/modules/entry-form";
import EntryList from "@/modules/entry-list";
import EvidencePanel from "@/modules/evidence-panel";
import ExportCheck from "@/modules/export-check";
import ExportPdf from "@/modules/export-pdf";
import FileMenu from "@/modules/file-menu";
import PeriodPanel from "@/modules/period-panel";
import ProfileSettings from "@/modules/profile-settings";

/**
 * Label of the export check tab with the number of errors (or warnings when there is no error).
 * @param {TimesheetBuilderProps} props - Shell props
 * @returns {React.ReactElement} - Tab label
 */
const _renderCheckTabLabel = (props: TimesheetBuilderProps): React.ReactElement => {
  const hasErrors = props.errorCount > 0;
  const count = hasErrors ? props.errorCount : props.warningCount;

  return (
    <span className="inline-flex items-center gap-1.5">
      {BUILDER_TAB_LABELS.check}
      {count > 0 && (
        <>
          <span aria-hidden className={`rounded-full px-1.5 text-xs font-semibold ${hasErrors ? "bg-danger-strong text-white" : "bg-warning-subtle text-warning-strong"}`}>
            {count}
          </span>
          <span className="sr-only">{hasErrors ? `${count} error` : `${count} peringatan`}</span>
        </>
      )}
    </span>
  );
};

/**
 * Tabs of the input panel.
 * @param {TimesheetBuilderProps} props - Shell props
 * @returns {TabsProps["items"]} - Tab items
 */
const _buildTabItems = (props: TimesheetBuilderProps): TabsProps["items"] => [
  {
    key: "activities",
    label: BUILDER_TAB_LABELS.activities,
    children: (
      <div className="flex flex-col">
        <EntryForm />
        <Divider />
        <EntryList />
      </div>
    ),
  },
  { key: "evidence", label: BUILDER_TAB_LABELS.evidence, children: <EvidencePanel /> },
  { key: "days", label: BUILDER_TAB_LABELS.days, children: <DayOverrides /> },
  { key: "settings", label: BUILDER_TAB_LABELS.settings, children: <ProfileSettings /> },
  { key: "check", label: _renderCheckTabLabel(props), children: <ExportCheck onNavigate={props.onNavigate} /> },
];

/**
 * Top bar: app name, file menu, current period and the UI theme toggle.
 * @param {TimesheetBuilderProps} props - Shell props
 * @returns {React.ReactElement} - Header
 */
const _renderTopBar = (props: TimesheetBuilderProps): React.ReactElement => (
  <header className="flex flex-wrap items-center gap-3 border-b border-border-default bg-background-surface px-4 py-2">
    <h1 className="text-lg font-semibold">Timesheet Builder</h1>
    <FileMenu />
    <EditHistory />
    <ExportPdf onShowCheck={props.onShowCheck} />
    <span className="ml-auto text-sm text-text-secondary">
      {props.consultantName ? `${props.periodLabel} · ${props.consultantName}` : props.periodLabel}
    </span>
    <Button
      type="text"
      aria-label={props.theme === "dark" ? "Mode terang" : "Mode gelap"}
      icon={props.theme === "dark" ? <FiSun aria-hidden /> : <FiMoon aria-hidden />}
      onClick={props.onToggleTheme}
    />
  </header>
);

/**
 * Single-screen layout: input panel (≈40%) on the left, live A4 preview (≈60%) on the right.
 * @param {TimesheetBuilderProps} props - Shell props
 * @returns {React.ReactElement} - Page
 */
const TimesheetBuilderComponent = (props: TimesheetBuilderProps): React.ReactElement => (
  <div className="flex h-screen flex-col bg-background-page text-text-primary">
    {_renderTopBar(props)}
    <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[2fr_3fr]">
      <aside aria-label="Panel input" className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-border-default p-4">
        <PeriodPanel />
        <Tabs activeKey={props.activeTab} items={_buildTabItems(props)} onChange={props.onTabChange} />
      </aside>
      <div className="min-h-0">
        <DocumentPreview />
      </div>
    </main>
  </div>
);

export default TimesheetBuilderComponent;
