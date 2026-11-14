/** @jest-environment node */
import { extractTicket, getBranchWords } from "./ticket.util";

const PATTERN = "(BIT|ASUM)-\\d+";

describe("ticket util", () => {
  it("should extract the ticket from common branch names", () => {
    expect(extractTicket("feature/BIT-12-x", PATTERN)).toBe("BIT-12");
    expect(extractTicket("BIT-12", PATTERN)).toBe("BIT-12");
    expect(extractTicket("bit-12-x", PATTERN)).toBe("BIT-12");
    expect(extractTicket("asum-7/fix", PATTERN)).toBe("ASUM-7");
    expect(extractTicket("main", PATTERN)).toBeNull();
    expect(extractTicket("BIT-1", "(")).toBeNull();
  });

  it("should turn the rest of the branch into words", () => {
    expect(getBranchWords("feature/BIT-231-case-transfer", "BIT-231")).toBe("case transfer");
    expect(getBranchWords("bit-231_case_transfer", "BIT-231")).toBe("case transfer");
    expect(getBranchWords("main", null)).toBe("main");
    expect(getBranchWords("BIT-1", "BIT-1")).toBe("");
  });
});
