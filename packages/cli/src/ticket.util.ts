/**
 * Ticket key found in a branch name, e.g. `feature/BIT-12-x`, `BIT-12` or `bit-12-x` → `BIT-12`.
 * @param {string} branch - Branch name
 * @param {string} pattern - Ticket regex source (`automation.ticketPattern`)
 * @returns {string | null} - Upper-case ticket, or null when none (or the pattern is invalid)
 */
export const extractTicket = (branch: string, pattern: string): string | null => {
  try {
    const match = new RegExp(pattern, "i").exec(branch);

    return match ? match[0].toUpperCase() : null;
  } catch {
    return null;
  }
};

/**
 * Readable rest of a branch name: prefix folders, the ticket and separators removed.
 * `feature/BIT-231-case-transfer` → `case transfer`.
 * @param {string} branch - Branch name
 * @param {string | null} ticket - Ticket in the branch
 * @returns {string} - Words, possibly empty
 */
export const getBranchWords = (branch: string, ticket: string | null): string => {
  const name = branch.split("/").at(-1) ?? branch;
  const withoutTicket = ticket ? name.replace(new RegExp(ticket.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "") : name;

  return withoutTicket.replace(/[-_]+/g, " ").trim();
};
