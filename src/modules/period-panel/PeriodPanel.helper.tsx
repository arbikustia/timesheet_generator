import * as React from "react";
import { Button } from "antd";

import { formatPeriodLabelId } from "@/libs/utils/date.util";

import type { PendingPeriodAction, PeriodPanelProps } from "./PeriodPanel.type";

/**
 * Text of the confirmation dialog.
 * @param {PendingPeriodAction} action - Pending action
 * @param {string} nextPeriodLabel - Label of the next month
 * @returns {string} - Dialog message
 */
export const getConfirmMessage = (action: PendingPeriodAction, nextPeriodLabel: string): string => {
  if (action.kind === "next-month") {
    return `Mulai ${nextPeriodLabel} dengan profil & tanda tangan yang sama. Aktivitas, evidence dan hari khusus bulan ini tidak ikut.`;
  }

  return `Periode diganti ke ${formatPeriodLabelId(action.period)}. Pindahkan aktivitas & evidence ke tanggal yang sama di bulan itu, atau mulai periode baru yang kosong?`;
};

/**
 * Footer buttons of the confirmation dialog.
 * @param {PeriodPanelProps} props - Panel props
 * @param {PendingPeriodAction} action - Pending action
 * @returns {React.ReactElement[]} - Buttons
 */
export const renderConfirmFooter = (props: PeriodPanelProps, action: PendingPeriodAction): React.ReactElement[] => {
  const cancel = (
    <Button key="cancel" onClick={props.onCancel}>
      Batal
    </Button>
  );

  if (action.kind === "next-month") {
    return [
      cancel,
      <Button key="next" type="primary" onClick={props.onConfirmNextMonth}>
        Mulai bulan berikutnya
      </Button>,
    ];
  }

  return [
    cancel,
    <Button key="reset" danger onClick={props.onConfirmReset}>
      Mulai periode baru
    </Button>,
    <Button key="move" type="primary" onClick={props.onConfirmMove}>
      Pindahkan tanggal
    </Button>,
  ];
};
