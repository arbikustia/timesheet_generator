import {
  getEntryAnchorId,
  getEvidenceAnchorId,
  getPreviewRowSelector,
  getProfileFieldAnchorId,
  getSignatureAnchorId,
} from "@/libs/utils/anchor.util";

describe("anchor ids", () => {
  it("should build stable ids and selectors", () => {
    expect(getEntryAnchorId("e1")).toBe("entry-e1");
    expect(getEvidenceAnchorId("2026-10-01")).toBe("evidence-2026-10-01");
    expect(getProfileFieldAnchorId("squad")).toBe("profile-squad");
    expect(getSignatureAnchorId("preparedBy")).toBe("signature-preparedBy");
    expect(getPreviewRowSelector("2026-10-01")).toBe('[data-preview] tr[data-date="2026-10-01"]');
  });
});
