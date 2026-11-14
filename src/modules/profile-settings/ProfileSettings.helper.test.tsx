import { fireEvent, render, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import { renderSignatureSlot, renderTextField } from "./ProfileSettings.helper";
import type { ProfileSettingsProps } from "./ProfileSettings.type";

/**
 * Build settings props for helper tests.
 * @param {string | null} preparedBy - Signature data URL
 * @returns {ProfileSettingsProps} - Props
 */
const makeProps = (preparedBy: string | null): ProfileSettingsProps => {
  const profile = loadOctoberDoc().profile;

  profile.signatures.preparedBy = preparedBy;

  return {
    profile,
    templatesText: "",
    minDate: "2026-10-01",
    maxDate: "2026-10-31",
    signatureError: null,
    onTextChange: jest.fn(),
    onSignDateChange: jest.fn(),
    onDefaultHourChange: jest.fn(),
    onTemplatesChange: jest.fn(),
    onSignatureChange: jest.fn(),
    onSignatureRemove: jest.fn(),
  };
};

describe("ProfileSettings helpers", () => {
  it("should render a text field with its hint", () => {
    const props = makeProps(null);

    render(renderTextField({ field: "squad", label: "Squad", hint: "Nama squad" }, props.profile, props.onTextChange));

    expect(screen.getByLabelText("Squad")).toHaveValue("Epics Asum");
    expect(screen.getByText("Nama squad")).toBeInTheDocument();
  });

  it("should render an empty signature slot", () => {
    render(renderSignatureSlot({ key: "preparedBy", label: "Prepared by" }, makeProps(null)));

    expect(screen.getByText("Belum ada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hapus" })).toBeNull();
  });

  it("should render a signature preview with remove button", () => {
    const props = makeProps("data:image/png;base64,AA");

    render(renderSignatureSlot({ key: "preparedBy", label: "Prepared by" }, props));
    fireEvent.click(screen.getByRole("button", { name: "Hapus" }));

    expect(screen.getByRole("img", { name: "Tanda tangan Prepared by" })).toBeInTheDocument();
    expect(props.onSignatureRemove).toHaveBeenCalled();
  });
});
