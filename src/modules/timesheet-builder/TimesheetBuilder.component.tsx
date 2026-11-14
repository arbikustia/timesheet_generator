import * as React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { Button, Divider, Tabs, type TabsProps } from "antd";

import { BUILDER_TAB_LABELS } from "./TimesheetBuilder.config";
import type { TimesheetBuilderProps } from "./TimesheetBuilder.type";

import DayOverrides from "@/modules/day-overrides";
import DocumentPreview from "@/modules/document-preview";
import EntryForm from "@/modules/entry-form";
import EntryList from "@/modules/entry-list";
import FileMenu from "@/modules/file-menu";
import PeriodPanel from "@/modules/period-panel";
import ProfileSettings from "@/modules/profile-settings";

/**
 * Tabs of the input panel.
 * @returns {TabsProps["items"]} - Tab items
 */
const _buildTabItems = (): TabsProps["items"] => [
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
  { key: "days", label: BUILDER_TAB_LABELS.days, children: <DayOverrides /> },
  { key: "settings", label: BUILDER_TAB_LABELS.settings, children: <ProfileSettings /> },
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
        <Tabs activeKey={props.activeTab} items={_buildTabItems()} onChange={props.onTabChange} />
      </aside>
      <div className="min-h-0">
        <DocumentPreview />
      </div>
    </main>
  </div>
);

export default TimesheetBuilderComponent;
