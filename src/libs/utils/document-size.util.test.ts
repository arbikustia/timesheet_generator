import { estimateDocumentBytes, formatBytes } from "@/libs/utils/document-size.util";
import { serializeTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import { loadOctoberDocWithEvidence } from "@/fixture/timesheet.fixture";

describe("estimateDocumentBytes", () => {
  it("should stay close to the real serialized size", () => {
    const doc = loadOctoberDocWithEvidence();

    doc.profile.signatures.preparedBy = `data:image/png;base64,${"A".repeat(50_000)}`;
    Object.values(doc.evidence).forEach((images) => images.forEach((image) => Object.assign(image, { dataUrl: `data:image/jpeg;base64,${"B".repeat(100_000)}` })));

    const actual = serializeTimesheetDoc(doc).length;
    const estimate = estimateDocumentBytes(doc);

    expect(Math.abs(estimate - actual) / actual).toBeLessThan(0.05);
  });
});

describe("formatBytes", () => {
  it("should pick a readable unit", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(20_480)).toBe("20 KB");
    expect(formatBytes(3.25 * 1024 * 1024)).toBe("3.3 MB");
  });
});
