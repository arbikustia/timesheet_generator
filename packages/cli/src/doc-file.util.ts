import { readFile, rename, stat, unlink, writeFile } from "node:fs/promises";

import { parseTimesheetDoc, serializeTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import type { TimesheetDoc } from "@/types/timesheet.type";

import { LOCK_STALE_MS } from "./cli.config";
import type { NodeErrorLike } from "./cli.type";

/**
 * Read and validate a document file (same parser as the app: JSON → migrate → Zod).
 * @param {string} path - Document path
 * @returns {Promise<TimesheetDoc>} - Document
 */
export const readDocFile = async (path: string): Promise<TimesheetDoc> => {
  const result = parseTimesheetDoc(await readFile(path, "utf8"));

  if (!result.isOk) {
    throw new Error(`Dokumen tidak valid (${path}): ${[result.message, ...result.issues.slice(0, 3)].join(" ")}`);
  }

  return result.doc;
};

/**
 * Write a file atomically: write a temporary sibling, then rename it over the target.
 * @param {string} path - Target path
 * @param {string} text - Contents
 * @returns {Promise<void>} - Resolves when replaced
 */
export const writeFileAtomic = async (path: string, text: string): Promise<void> => {
  const temp = `${path}.${process.pid}.${Date.now()}.tmp`;

  await writeFile(temp, text, "utf8");
  await rename(temp, path);
};

/**
 * Write a document atomically.
 * @param {string} path - Document path
 * @param {TimesheetDoc} doc - Document
 * @returns {Promise<void>} - Resolves when written
 */
export const writeDocFile = (path: string, doc: TimesheetDoc): Promise<void> => writeFileAtomic(path, serializeTimesheetDoc(doc));

/**
 * Whether a thrown value carries the given Node error code (duck-typed: core errors may come from another realm).
 * @param {NodeErrorLike | null | undefined} error - Thrown value
 * @param {string} code - Error code, e.g. `EEXIST`
 * @returns {boolean} - True when it matches
 */
export const hasErrorCode = (error: NodeErrorLike | null | undefined, code: string): boolean => error?.code === code;

/**
 * Take `<doc>.lock` exclusively; a lock older than 10 minutes is stale and replaced.
 * @param {string} lockPath - Lock file path
 * @param {number} now - Current time in ms
 * @returns {Promise<void>} - Resolves when held; rejects when another process holds a fresh lock
 */
export const acquireLock = async (lockPath: string, now: number): Promise<void> => {
  try {
    await writeFile(lockPath, String(process.pid), { flag: "wx" });
  } catch (error) {
    if (!hasErrorCode(error as NodeErrorLike, "EEXIST")) {
      throw error;
    }

    const age = now - (await stat(lockPath)).mtimeMs;

    if (age < LOCK_STALE_MS) {
      throw new Error(`Dokumen sedang dikunci (${lockPath}). Coba lagi nanti, atau hapus file lock bila tidak ada proses lain.`);
    }

    await unlink(lockPath);
    await writeFile(lockPath, String(process.pid), { flag: "wx" });
  }
};

/**
 * Run work on a document while holding its lock.
 * @param {string} docPath - Document path
 * @param {() => Promise<T>} work - Work to run
 * @param {number} [now=Date.now()] - Current time in ms
 * @returns {Promise<T>} - Result of the work
 */
export const withDocLock = async <T>(docPath: string, work: () => Promise<T>, now: number = Date.now()): Promise<T> => {
  const lockPath = `${docPath}.lock`;

  await acquireLock(lockPath, now);

  try {
    return await work();
  } finally {
    await unlink(lockPath).catch(() => undefined);
  }
};
