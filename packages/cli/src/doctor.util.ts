import { access, constants, mkdir } from "node:fs/promises";

import type { AutomationRepo } from "@/types/timesheet.type";

import type { CliPaths, DoctorCheck, GitRunner } from "./cli.type";

/**
 * Check one repository: it is a git work tree and has `user.email` (needed to count own commits).
 * @param {AutomationRepo} repo - Repository
 * @param {GitRunner} git - Git runner
 * @returns {Promise<DoctorCheck[]>} - Checks
 */
export const checkRepo = async (repo: AutomationRepo, git: GitRunner): Promise<DoctorCheck[]> => {
  const label = repo.label || repo.path;
  const isRepo = (await git(repo.path, ["rev-parse", "--is-inside-work-tree"]).catch(() => "")).trim() === "true";

  if (!isRepo) {
    return [{ ok: false, label: `Repo ${label}`, detail: `${repo.path} bukan repo git atau tidak ditemukan.` }];
  }

  const email = (await git(repo.path, ["config", "--get", "user.email"]).catch(() => "")).trim();

  return [
    { ok: true, label: `Repo ${label}`, detail: repo.path },
    { ok: Boolean(email), label: `Email git ${label}`, detail: email || "user.email belum diatur — commit hari ini tidak bisa dihitung." },
  ];
};

/**
 * Check that the data folder can be created and written.
 * @param {CliPaths} paths - CLI paths
 * @returns {Promise<DoctorCheck>} - Check
 */
export const checkDataFolder = async (paths: CliPaths): Promise<DoctorCheck> => {
  try {
    await mkdir(paths.home, { recursive: true });
    await access(paths.home, constants.W_OK);

    return { ok: true, label: "Folder worklog", detail: paths.worklog };
  } catch {
    return { ok: false, label: "Folder worklog", detail: `${paths.home} tidak bisa ditulis.` };
  }
};

/**
 * Check the ticket regex of the document.
 * @param {string} pattern - Ticket regex source
 * @returns {DoctorCheck} - Check
 */
export const checkTicketPattern = (pattern: string): DoctorCheck => {
  try {
    new RegExp(pattern);

    return { ok: true, label: "Pola ticket", detail: pattern };
  } catch {
    return { ok: false, label: "Pola ticket", detail: `Regex tidak valid: ${pattern}` };
  }
};

/**
 * Human-readable check list.
 * @param {DoctorCheck[]} checks - Checks
 * @returns {string} - One line per check
 */
export const formatChecks = (checks: DoctorCheck[]): string => {
  return checks.map((check) => `${check.ok ? "✓" : "✗"} ${check.label}: ${check.detail}`).join("\n");
};
