# Keputusan Arsitektur — Timesheet Builder

Catatan keputusan yang diambil saat membangun aplikasi di atas template QuoteFlow (lihat `docs/PROMPT.md` §0.4).
Format: tanggal · keputusan · alasan.

## Fase 0 — Setup (2026-11-14)

### D-001 · Template QuoteFlow dibersihkan total
- Dihapus: semua modul & halaman route (`src/modules/*`, `src/app/*`), `src/services`, layer API
  (`src/libs/api`, `src/libs/ApiRtkServices`), `src/hooks`, `src/utils`, `src/constants`, fixture lama,
  aset QuoteFlow, e2e auth, service worker, PWA manifest, `docs/manual-book`.
- Komponen shared yang dipertahankan (generik, lolos lint): Alert, Button, Checkbox, ConfirmModal, DatePicker,
  Input, Modal, Select, Skeleton, Switch, Tabs, ActionMenu. Dihapus karena tak relevan atau rusak:
  Table (bergantung Pagination), DateRangePicker (hook di file component), Drawer, Sidebar, Navbar, dll.
- `Select` dimigrasi ke API antd 6 (`showSearch={{ optionFilterProp, filterOption, onSearch }}`).
- Alasan: aplikasi 100% client-side tanpa backend/auth (PROMPT §0.2, §10).

### D-002 · Dependency
- Dihapus: `axios`, `react-router-dom`, `jspdf`, `jspdf-autotable`, `qrcode*`, `react-quill-new`, `dompurify`.
- Dipertahankan: React, Redux Toolkit (state dokumen nanti jadi slice), antd, Tailwind, react-hook-form,
  react-icons, zod.
- Belum ditambah: `date-fns` (generator tanggal cukup dengan `Date` native — dievaluasi di Fase 1),
  `idb-keyval` (ditambah di Fase 4 untuk draft & file handle).

### D-003 · Tanpa router
- Aplikasi satu layar (split view). `react-router-dom` dihapus; `@/libs/unit-test` tidak lagi membungkus
  render dengan `MemoryRouter`. `vercel.json` (SPA rewrite) tetap aman dipakai.

### D-004 · Lokasi schema & util dokumen
- Zod schema + tipe `z.infer`: `src/types/timesheet.type.ts` — dipakai lintas modul (engine, render, input,
  file), jadi masuk shared types (Convention §6), bukan di satu modul.
- Parse/migrate/serialize/createEmptyDoc: `src/libs/utils/timesheet-document.util.ts` (+ test).
- ESLint strict (Convention §4) kini berlaku untuk `src/App.tsx`, `src/modules/**`, `src/libs/utils/**`,
  `src/types/**`. `src/libs/utils/**` tidak lagi di-ignore.

### D-005 · Fallback tunggal lewat schema
- `parseTimesheetDoc(text)` adalah satu-satunya titik masuk data dokumen; semua default lewat Zod `.default()`
  / `.prefault()` (Convention §9.1, tanpa lodash). Komponen hilir tidak boleh menambah fallback.
- Fixture Oktober tidak punya `footerCompany`, `footerGroup`, `defaults`, `source`, `reviewed`, `automation`
  → diisi default saat parse. Tetap `schemaVersion: 1` (tidak perlu migrasi).
- Default untuk entri lama: `source: "manual"`, `reviewed: true`. Importer otomatis (Fase 7) wajib menulis
  `reviewed: false` secara eksplisit.
- Default `sensitivity` evidence = `"plain"` di schema; paste & automation wajib menulis `"code"` eksplisit
  (PROMPT §5.1).

### D-006 · Tambahan field di luar skema PROMPT §4
- `profile.taskTemplates: string[]` — template task favorit (PROMPT §7).
- `profile.pdfFilePrefix` (default `"BHN II - Timesheet"`) — prefix nama PDF yang bisa diubah (PROMPT §6).

### D-007 · Migrasi
- `migrateDoc` menjalankan langkah `N → N+1` dari registry `DOC_MIGRATIONS`. Versi lebih baru dari aplikasi
  ditolak dengan pesan jelas; file rusak → `ParseDocFailure` (tidak pernah throw).

### D-008 · Batasan convention yang disadari
- `evidence`, `dayOverrides`, `automation.ticketMap` memakai `Record<string, …>` (kunci = tanggal ISO / ticket)
  karena bentuknya ditetapkan format file di PROMPT §4. Kunci tanggal divalidasi `z.iso.date()`.
- Fixture tetap di `src/fixture/` (konvensi template), bukan `fixtures/` di root.
- Font UI tetap Poppins dari Google Fonts (`src/index.css`); tidak ada data pengguna yang dikirim.
  Halaman A4 memakai stack `"Trebuchet MS", "Fira Sans", sans-serif` (Fase 2).

## Fase 1 — Engine (2026-11-14)

### D-009 · Tanpa date-fns
- Semua kalkulasi tanggal memakai string ISO + `Date.UTC` (bebas zona waktu) di `src/libs/utils/date.util.ts`.
  Kebutuhannya kecil (jumlah hari, weekend, 4 format), jadi tidak perlu dependency baru.

### D-010 · Lokasi engine
- `src/libs/utils/timesheet-engine.util.ts` (shared, dipakai render/input/validasi). Tipe baris & halaman
  evidence di `src/types/timesheet-engine.type.ts`; konstanta label/kapasitas di `src/constants/timesheet.constant.ts`.
- Peta nomor halaman evidence memakai `Map<string, number>` (bukan `Record` terbuka, Convention §4.3).

### D-011 · Aturan baris
- Entri selalu menang atas weekend/holiday/cuti: tanggal tsb dirender sebagai baris kerja agar data tidak
  tersembunyi; validasi (Fase 6) akan memberi peringatan.
- Entri di luar periode tidak dirender (validasi: error "tanggal di luar bulan").
- Baris kerja tanpa evidence: Remark hanya `Foto / Screenshot` (nomor halaman belum bisa ditentukan);
  validasi memberi peringatan "tanggal ber-entri tanpa evidence".
- `remarkOverride` dipisah per `\n` menjadi baris Remark.
- Evidence pages: semua tanggal dalam periode yang punya ≥1 gambar, urut naik; kapasitas 3 lalu 4.
- Default tanggal form cepat: hari kerja pertama di bulan itu yang bukan weekend, tidak ditandai libur/cuti,
  dan belum ada entri.

## Fase 2 — Render (2026-11-14)

### D-012 · Geometri diukur dari PDF contoh
- Posisi & ukuran (pt) diambil dari `BHN II - Timesheet October.pdf` (teks + kotak via pdf.js) dan disimpan
  di `TimesheetDocument.config.ts`: logo (20, 8, 93×46), judul y≈76, blok info y=119 (baris 14.5pt), tabel
  x=36 lebar 517 (66/246/42/43/120), header 29pt, tabel tanda tangan (169.5/183.7/162.9; baris 14.6 & 117.3),
  blok merah cover (atas y=54.7 h=112; bawah y=373.7 h=410.6, lebar 524.2), slot evidence (gambar kiri x=43
  w=268, kanan x=342 w=216, tinggi 140, jarak antar-slot 178pt).
- Halaman memakai posisi absolut dalam `pt` di dalam bingkai `210mm × 297mm`: satu implementasi untuk
  preview dan print (PROMPT §6).

### D-013 · Paginasi tabel deterministik
- Tinggi baris dihitung, bukan diukur dari DOM: Weekend/Libur 22pt, baris kerja min. 39pt dan bertambah
  13pt per baris teks (estimasi wrap dengan lebar glyph konservatif 5.6pt @11pt). Tinggi yang sama dipasang
  sebagai `height` baris, jadi preview = PDF dan bisa di-test di jsdom.
- Batas bawah halaman 822pt, halaman lanjutan mulai di y=9pt tanpa header tabel. Baris tidak pernah dipotong.
- Akibatnya halaman 1 Oktober berakhir di 16/10 (di contoh 17/10) karena contoh Word memakai tinggi baris
  campuran 30.8/38.8pt, sedangkan spesifikasi menetapkan ≈39pt. Isi dan urutan tetap sama.

### D-014 · Font halaman tanda tangan
- PROMPT §2.B menyebut Times New Roman, tetapi PDF contoh memakai font yang sama dengan judul `TIMESHEET`
  (Trebuchet MS Bold, dicek dari lebar glyph). Mengikuti contoh karena tujuan utamanya "identik dengan contoh";
  cukup ubah `fontFamily` di `signatureTable` (`TimesheetDocument.style.ts`) bila ingin Times.

### D-015 · Detail kecil
- Baris 31/10 di contoh menampilkan jam `08:00 08:00` pada baris Weekend — dianggap artefak; kolom
  Task/Start/End baris merah selalu kosong (PROMPT §2.A).
- Preview sementara di `App` merender fixture Oktober sampai panel input selesai (Fase 3).
- Visual regression Playwright belum jalan: Chromium headless di WSL butuh library sistem
  (`sudo npx playwright install-deps chromium`).
