import * as React from "react";
import { Alert, Button, Input, Select } from "antd";

import { renderOverrideItem } from "./DayOverrides.helper";
import type { DayOverridesProps } from "./DayOverrides.type";

/**
 * Form to mark a day as public holiday or leave, and the list of marked days.
 * @param {DayOverridesProps} props - Props
 * @returns {React.ReactElement} - Panel
 */
const DayOverridesComponent = (props: DayOverridesProps): React.ReactElement => {
  const { values, dateOptions, typeOptions, items, error } = props;

  return (
    <section aria-labelledby="day-overrides-title" className="flex flex-col gap-3">
      <h3 id="day-overrides-title" className="text-sm font-semibold">
        Hari khusus (baris merah)
      </h3>
      <form aria-label="Tandai hari khusus" className="grid grid-cols-2 items-end gap-2" onSubmit={props.onSubmit}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Tanggal
          <Select aria-label="Tanggal hari khusus" showSearch value={values.date} options={dateOptions} onChange={props.onDateChange} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Jenis
          <Select aria-label="Jenis hari khusus" value={values.type} options={typeOptions} onChange={props.onTypeChange} />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm font-medium">
          Keterangan (Remark)
          <Input aria-label="Keterangan" value={values.label} onChange={props.onLabelChange} />
        </label>
        {error && <Alert className="col-span-2" type="error" showIcon title={error} />}
        <Button className="col-span-2" type="primary" htmlType="submit">
          Tandai
        </Button>
      </form>
      {items.length > 0 && <ul className="flex flex-col gap-2">{items.map((item) => renderOverrideItem(item, props.onRemove))}</ul>}
    </section>
  );
};

export default DayOverridesComponent;
