import { fireEvent, render, screen } from "@/libs/unit-test";

import { loadOctoberDoc } from "@/fixture/timesheet.fixture";

import ProfileSettingsComponent from "./ProfileSettings.component";
import type { ProfileSettingsProps } from "./ProfileSettings.type";

/**
 * Build component props.
 * @param {Partial<ProfileSettingsProps>} [overrides] - Prop overrides
 * @returns {ProfileSettingsProps} - Props
 */
const makeProps = (overrides?: Partial<ProfileSettingsProps>): ProfileSettingsProps => ({
  profile: loadOctoberDoc().profile,
  templatesText: "Daily standup",
  minDate: "2026-10-01",
  maxDate: "2026-10-31",
  signatureError: null,
  onTextChange: jest.fn(),
  onSignDateChange: jest.fn(),
  onDefaultHourChange: jest.fn(),
  onTemplatesChange: jest.fn(),
  onSignatureChange: jest.fn(),
  onSignatureRemove: jest.fn(),
  ...overrides,
});

describe("ProfileSettingsComponent", () => {
  it("should render every field and forward changes", () => {
    const props = makeProps();

    render(<ProfileSettingsComponent {...props} />);

    expect(screen.getByLabelText("Consultan Role")).toHaveValue("Front End Developer");
    expect(screen.getByLabelText("Tanggal tanda tangan")).toHaveValue("2026-10-30");
    expect(screen.getByLabelText("Template task")).toHaveValue("Daily standup");

    fireEvent.change(screen.getByLabelText("Squad"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Jam mulai default"), { target: { value: "09:00" } });

    expect(props.onTextChange).toHaveBeenCalled();
    expect(props.onDefaultHourChange).toHaveBeenCalled();
  });

  it("should show a signature error", () => {
    render(<ProfileSettingsComponent {...makeProps({ signatureError: "Gunakan gambar PNG, JPG atau WebP." })} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Gunakan gambar PNG");
  });
});
