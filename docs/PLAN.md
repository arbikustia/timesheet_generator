# Rencana Kerja — Timesheet Builder

Sumber: `docs/PROMPT.md` §9. Setiap fase ditutup dengan `npm run lint`, `npx tsc -p tsconfig.app.json --noEmit`,
`npm test`, `npm run build`. Keputusan dicatat di `docs/DECISIONS.md`.

| Fase | Status | Isi |
|---|---|---|
| 0 — Setup | ✅ | Bersihkan template, dependency, `DECISIONS.md`, Zod schema dokumen + parse/migrate/serialize |
| 1 — Engine | ⏳ | Generator tanggal & baris tabel, weekend/holiday, paginasi evidence (3 lalu 4), numbering `Evidence Page N` |
| 2 — Render | ⏳ | `<Page>` A4 untuk Timesheet, Signature, Evidence cover, Evidence pages; golden test Oktober |
| 3 — Input | ⏳ | Split view, panel periode/aktivitas/daftar/hari khusus/settings, live preview |
| 4 — File | ⏳ | New/Open/Save/Save As (File System Access + fallback), autosave, draft IndexedDB, buka terakhir |
| 5 — Evidence | ⏳ | Dropzone + paste, kompresi canvas, layout evidence |
| 6 — Export & polish | ⏳ | Print CSS → PDF, panel validasi, ringkasan, shortcut, undo/redo, a11y |
| 7 — Blur & Import | ⏳ | Editor blur/pixelate, CLI `snapshot`/`import`, panel Import & Review |
| 8 — Collectors | ⏳ | Scheduler, VS Code, hook Claude Code, skill `/timesheet`, auto-evidence |

## Rancangan per fase

**Fase 1 — Engine** (`src/modules/timesheet-engine/` atau `src/libs/utils/`, murni + ter-test)
- `getMonthDays(period)`, `isWeekend(iso)`, `buildTimesheetRows(doc)` → baris kerja / weekend / holiday / kosong.
- `paginateEvidence(doc)` → halaman `[3, 4, 4, …]` per tanggal unik ber-evidence.
- `getEvidencePageByDate()` → nomor untuk Remark (override per baris tetap menang).
- Formatter: `DD/MM/YYYY`, `DD-MM-YYYY`, `MMMM YYYY` (Inggris), `D MMMM YYYY`.

**Fase 2 — Render** (`src/modules/timesheet-document/`)
- Satu set komponen A4 (pt → CSS) untuk preview & print; aliran tabel ke halaman 2 tanpa memotong baris dan
  tanpa mengulang header.
- Golden test unit (31 baris, weekend, 07/10 dua baris, lebar kolom, warna) + Playwright visual nanti.

**Fase 3–6** mengikuti PROMPT §3–§7; state dokumen di Redux slice (`document`), undo/redo di slice yang sama.

**Fase 7–8** baru dimulai setelah Fase 0–6 dipakai minimal satu bulan nyata (PROMPT §9).
