/** @jest-environment node */
import { mkdtemp, readdir, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createEmptyDoc, serializeTimesheetDoc } from "@/libs/utils/timesheet-document.util";

import { acquireLock, hasErrorCode, readDocFile, withDocLock, writeDocFile, writeFileAtomic } from "./doc-file.util";

describe("document file", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "timesheet-doc-"));
  });

  afterEach(async () => rm(dir, { recursive: true, force: true }));

  it("should read, validate and atomically write documents", async () => {
    const path = join(dir, "doc.json");
    const doc = createEmptyDoc({ year: 2026, month: 11 });

    await writeDocFile(path, doc);
    expect(await readDocFile(path)).toEqual(doc);
    expect(await readdir(dir)).toEqual(["doc.json"]);

    await writeFile(path, "{}", "utf8");
    await expect(readDocFile(path)).rejects.toThrow("Dokumen tidak valid");

    await writeFileAtomic(path, serializeTimesheetDoc(doc));
    expect(await readFile(path, "utf8")).toBe(serializeTimesheetDoc(doc));
  });

  it("should hold the lock during work and release it after, even on failure", async () => {
    const path = join(dir, "doc.json");

    await expect(withDocLock(path, async () => (await readdir(dir)).includes("doc.json.lock"))).resolves.toBe(true);
    await expect(withDocLock(path, async () => Promise.reject(new Error("boom")))).rejects.toThrow("boom");
    expect(await readdir(dir)).toEqual([]);
  });

  it("should refuse a fresh lock and replace a stale one", async () => {
    const lock = join(dir, "doc.json.lock");

    await writeFile(lock, "123", "utf8");
    await expect(acquireLock(lock, Date.now())).rejects.toThrow("Dokumen sedang dikunci");

    const old = new Date(Date.now() - 11 * 60 * 1000);

    await utimes(lock, old, old);
    await expect(acquireLock(lock, Date.now())).resolves.toBeUndefined();
    expect(await readFile(lock, "utf8")).toBe(String(process.pid));
  });

  it("should rethrow other lock errors and match error codes", async () => {
    await expect(acquireLock(join(dir, "missing", "doc.json.lock"), Date.now())).rejects.toThrow("ENOENT");
    expect(hasErrorCode({ code: "EEXIST" }, "EEXIST")).toBe(true);
    expect(hasErrorCode({}, "EEXIST")).toBe(false);
    expect(hasErrorCode(null, "EEXIST")).toBe(false);
  });
});
