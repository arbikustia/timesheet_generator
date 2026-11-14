import type { LineCounts, StatusEntry, StatusReport } from "./cli.type";

/** Fields before the path in porcelain v2 records, by record type. */
const PATH_FIELD_INDEX: Partial<Record<string, number>> = { "1": 8, "2": 9, u: 10 };

/**
 * Status letter of an `XY` pair: the index letter when set, else the worktree letter.
 * @param {string} xy - Two-letter status
 * @returns {string} - Status letter
 */
const _statusLetter = (xy: string): string => (xy[0] !== "." ? xy[0] : xy[1]);

/**
 * Parse one changed-path record of `git status --porcelain=v2`.
 * @param {string} line - Record line
 * @returns {StatusEntry | null} - Entry, or null for headers and ignored files
 */
export const parseStatusRecord = (line: string): StatusEntry | null => {
  if (line.startsWith("? ")) {
    return { path: line.slice(2), status: "?", isUntracked: true };
  }

  const fields = line.split(" ");
  const pathIndex = PATH_FIELD_INDEX[fields[0]];

  if (pathIndex === undefined || fields.length <= pathIndex) {
    return null;
  }

  const path = fields.slice(pathIndex).join(" ").split("\t")[0];

  return { path, status: _statusLetter(fields[1]), isUntracked: false };
};

/**
 * Parse `git status --porcelain=v2 --branch` output.
 * @param {string} text - Command output
 * @returns {StatusReport} - Current branch (null when detached) and changed paths
 */
export const parsePorcelainV2 = (text: string): StatusReport => {
  const lines = text.split("\n").filter(Boolean);
  const head = lines.find((line) => line.startsWith("# branch.head "))?.slice("# branch.head ".length) ?? null;

  return {
    branch: head && head !== "(detached)" ? head : null,
    entries: lines.map(parseStatusRecord).filter((entry): entry is StatusEntry => entry !== null),
  };
};

/**
 * New path of a numstat rename, e.g. `src/{a => b}/x.ts` → `src/b/x.ts`, `a.ts => b.ts` → `b.ts`.
 * @param {string} path - Numstat path
 * @returns {string} - Resulting path
 */
export const resolveRenamePath = (path: string): string => {
  const open = path.indexOf("{");
  const close = path.indexOf("}", open);
  const arrow = path.indexOf(" => ", open);

  if (open >= 0 && close > arrow && arrow > open) {
    return `${path.slice(0, open)}${path.slice(arrow + 4, close)}${path.slice(close + 1)}`.replace(/\/\//g, "/");
  }

  return path.includes(" => ") ? (path.split(" => ").at(-1) ?? path) : path;
};

/**
 * Parse `git diff --numstat`; binary files (`-`) count as 0 lines.
 * @param {string} text - Command output
 * @returns {Map<string, LineCounts>} - Added/deleted lines by path
 */
export const parseNumstat = (text: string): Map<string, LineCounts> => {
  const counts = new Map<string, LineCounts>();

  text
    .split("\n")
    .filter(Boolean)
    .forEach((line) => {
      const [add, del, ...rest] = line.split("\t");

      counts.set(resolveRenamePath(rest.join("\t")), { add: Number(add) || 0, del: Number(del) || 0 });
    });

  return counts;
};

/**
 * Sum unstaged and staged line counts per path.
 * @param {Map<string, LineCounts>[]} parts - Numstat maps
 * @returns {Map<string, LineCounts>} - Totals
 */
export const sumLineCounts = (parts: Map<string, LineCounts>[]): Map<string, LineCounts> => {
  const total = new Map<string, LineCounts>();

  parts.forEach((part) =>
    part.forEach((counts, path) => {
      const current = total.get(path) ?? { add: 0, del: 0 };

      total.set(path, { add: current.add + counts.add, del: current.del + counts.del });
    }),
  );

  return total;
};
