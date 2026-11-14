import { isRepoField, toTicketRows, validateTicket } from "./AutomationSettings.util";

describe("AutomationSettings util", () => {
  it("should sort ticket rows", () => {
    expect(toTicketRows({ "BIT-9": "b", "ASUM-1": "a" })).toEqual([
      { ticket: "ASUM-1", name: "a" },
      { ticket: "BIT-9", name: "b" },
    ]);
  });

  it("should recognise repo fields", () => {
    expect(isRepoField("path")).toBe(true);
    expect(isRepoField("label")).toBe(true);
    expect(isRepoField("other")).toBe(false);
    expect(isRepoField(undefined)).toBe(false);
  });

  it("should validate tickets against the pattern", () => {
    expect(validateTicket(" ", "(BIT|ASUM)-\\d+")).toBe("Ticket wajib diisi.");
    expect(validateTicket("bit-12", "(BIT|ASUM)-\\d+")).toBeNull();
    expect(validateTicket("JIRA-1", "(BIT|ASUM)-\\d+")).toBe("Ticket tidak cocok dengan pola (BIT|ASUM)-\\d+.");
    expect(validateTicket("anything", "(")).toBeNull();
  });
});
