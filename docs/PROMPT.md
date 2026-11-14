# PROMPT — Timesheet Builder (project baru dari template)

> Cara pakai: taruh file ini + folder `assets/` + `fixtures/` + PDF contoh di project baru
> (mis. `docs/PROMPT.md`, `src/assets/`, `fixtures/`), lalu minta Claude Code:
> **"Baca docs/PROMPT.md sampai habis, buat rencana kerja per fase, lalu kerjakan Fase 0 dulu."**

---

## 0. Peran & cara kerja

Kamu adalah senior frontend engineer. Bangun aplikasi **Timesheet Builder** di atas **template project yang sudah ada di repo ini**.

Aturan awal (wajib, sebelum menulis kode):
1. Baca seluruh struktur template, `README`, `CLAUDE.md`/dokumen code convention (jika ada), `package.json`, config lint/test/tsconfig. **Ikuti convention template** (struktur folder, naming, state management, testing, lint). Jangan mengarang convention baru.
2. Hapus/nonaktifkan bagian template yang tidak relevan (layer API, auth, route dummy, dsb.) — aplikasi ini **100% client-side, tanpa backend, tanpa database**.
3. Kerjakan per fase (Bagian 9). Setiap fase selesai → jalankan lint + test + build, lalu laporkan singkat apa yang jadi dan apa yang belum.
4. Jika ada hal ambigu yang mengubah arsitektur, tanya satu pertanyaan singkat; selain itu ambil keputusan paling masuk akal dan catat di `docs/DECISIONS.md`.

---

## 1. Tujuan produk

Saya (konsultan Front End Developer) tiap bulan harus mengirim **timesheet + evidence** ke atasan dalam format PDF yang sudah baku (contoh: `BHN II - Timesheet October.pdf`). Sekarang saya edit dokumen manual — lambat dan rawan salah.

Aplikasi ini harus memungkinkan:
- Mengisi **hanya data yang muncul di tabel** (tanggal, task, jam mulai, jam selesai) + upload evidence.
- Pilih **bulan & tahun** (default = bulan berjalan). Daftar tanggal, baris weekend, nomor halaman evidence, dan tanda tangan terisi **otomatis**.
- Hasil akhir **identik dengan format contoh** (karena itu format dari atasan) dan bisa diekspor ke **PDF**.
- Data disimpan **langsung ke file dokumen** (konsep Microsoft Word: New / Open / Save / Save As), **tanpa database**.

Bukan tujuan: multi-user, login, sinkronisasi cloud, approval workflow.

---

## 2. Struktur dokumen output (A4 portrait, 595 × 842 pt)

Dokumen = 4 bagian berurutan, semua dirender dari satu sumber data.

| Bagian | Isi |
|---|---|
| **A. Timesheet** (1–2 halaman, mengalir) | Logo IFG kiri atas, judul `TIMESHEET`, blok info vendor/konsultan, tabel harian |
| **B. Signature page** | Tabel Prepared by / Approved by (3 kolom) + gambar tanda tangan + tanggal |
| **C. Evidence cover** | Halaman merah penuh dengan teks judul evidence & footer perusahaan |
| **D. Evidence pages** | Header bulan + screenshot per tanggal, nomor halaman `Page \| N` |

### A. Timesheet — spesifikasi presisi
- **Logo**: `assets/ifg-logo.png` (sudah diekstrak dari contoh), posisi x=20pt, y=8pt, ukuran ≈ 93 × 46 pt.
- **Judul** `TIMESHEET`: Trebuchet MS **Bold 18pt**, center, y≈78pt.
- **Blok info** (Trebuchet MS 12pt, hitam, 2 kolom, label sejajar titik dua):
  - Kiri: `Vendor Name`, `Consultant Name`, `Consultan Role` *(typo asli "Consultan" — pertahankan persis)*, `Month` → diisi `October 2026` (nama bulan **bahasa Inggris**, format `MMMM YYYY`).
  - Kanan: baris pertama = teks `Legacy Platform` (tanpa titik dua, rata kiri), lalu `Lead Project/PO`, `Tribe Leader`, `Squad`.
- **Tabel**: x=36 → 553pt (lebar 517pt), border hitam tipis (~0.75pt), kolom:

| Kolom | Lebar | Rata | Catatan |
|---|---|---|---|
| Date | 66pt | kiri | format `DD/MM/YYYY`, 12pt |
| Task /Activities/ Project Name/ Ticket Number | 246pt | kiri | 11pt, boleh wrap |
| Start Time | 42pt | tengah | `HH:mm` 11pt |
| End Time | 43pt | tengah | `HH:mm` 11pt |
| Remark | 120pt | kiri | 11pt |

- **Header tabel**: background **#C00000**, teks putih, Trebuchet **Bold 12pt**, center, tinggi ≈ 29pt. Label header persis: `Date` | `Task /Activities/ Project Name/ Ticket Number` | `Start Time` | `End Time` | `Remark`.
- **Baris kerja**: background putih, teks hitam, tinggi ≈ 39pt. Remark selalu dua baris:
  `Foto / Screenshot` ⏎ `Evidence Page {N}`.
- **Baris weekend/libur**: background #C00000, teks putih, tinggi ≈ 22pt, kolom Task/Start/End **kosong**, Remark = `Weekend` (atau `Public Holiday` untuk libur nasional).
- Satu tanggal boleh punya **lebih dari satu baris** (contoh 07/10/2026 muncul 2×) — tanggal ditulis ulang di tiap baris.
- Tabel **mengalir otomatis ke halaman 2**; baris tidak boleh terpotong di tengah; **header tabel tidak diulang** di halaman lanjutan (sesuai contoh).
- Font: **Trebuchet MS** (Windows/macOS sudah punya). Siapkan fallback `"Trebuchet MS", "Fira Sans", sans-serif` dan jangan bundling font berlisensi tanpa izin.

### B. Signature page
- Tabel 3 kolom: header `Prepared by,` (1 kolom) dan `Approved by,` (menggabung 2 kolom).
- Baris nama: `Name : {consultantName}` | `Name: {leadProject}` | `Name: {tribeLeader}`.
- Baris gambar tanda tangan (tinggi ≈ 120pt), lalu baris `Date: {D MMMM YYYY}` di tiap kolom (contoh: `Date: 30 October 2026`).
- Font Times New Roman ~12pt, border hitam. Tanda tangan = gambar PNG transparan yang diunggah sekali di Settings.

### C. Evidence cover
- Dua blok merah #C00000 (atas dan bawah, ±bagian atas halaman dan ±sepertiga bawah), area tengah putih.
- Teks tengah (bold, center): `EVIDENCE {MONTH UPPERCASE} {YEAR} – {CONSULTANT NAME UPPERCASE} – {ROLE UPPERCASE} – {SQUAD UPPERCASE}`
  → contoh: `EVIDENCE OCTOBER 2026 – ARBI KUSTIA – FRONT END DEVELOPER – EPICS ASUM`
- Teks bawah di blok merah (putih, bold, center): `PT NEGERI EMAS PERKASA` ⏎ `INDONESIA FINANCIAL GROUP (IFG)` — **tersimpan di profile**, bukan hardcode.

### D. Evidence pages
- Pojok kanan atas: `Page | {N}` (mulai 1).
- **Hanya halaman evidence pertama** punya header: `October 2026` (bold) + `Foto / Screenshot Evidence` dengan **highlight kuning** (#FFFF00).
- Per **tanggal unik** yang punya evidence: label `DD-MM-YYYY` (strip, bukan slash) + **2 gambar berdampingan** (kiri & kanan, tiap gambar ±215–270 × 140pt, `object-fit: contain`).
- **Kapasitas per halaman**: halaman evidence pertama = **3 tanggal**, halaman berikutnya = **4 tanggal**.
- Tanggal tanpa evidence tidak dibuat slot (weekend tidak pernah punya slot).
- **Nomor "Evidence Page N" di kolom Remark dihitung otomatis** dari posisi tanggal tsb di evidence pages (tanggal sama dengan >1 baris → nomor sama). User bisa override manual per baris bila perlu.

> Catatan: di contoh Oktober, tanggal 05/10 ada di Page 1 dan 06/10 di Page 2 — konsisten dengan aturan 3 + 4 + 4 + … di atas.

---

## 3. Input & alur pengguna

### 3.1 Layout aplikasi (satu layar, split view)
- **Kiri (≈40%)**: panel input. **Kanan (≈60%)**: **live preview** halaman A4 persis seperti PDF (zoom fit-width, scroll per halaman).
- **Top bar ala Word**: `Baru` · `Buka` · `Simpan` · `Simpan Sebagai` · `Export PDF` · indikator status (`Tersimpan` / `Belum disimpan ●` / nama file).

### 3.2 Panel input (hanya yang dibutuhkan tabel)
1. **Periode**: select **Bulan** (Januari–Desember, default bulan berjalan) + select **Tahun** (default tahun berjalan, rentang ±3 tahun).
2. **Tambah aktivitas** (form cepat, tanpa popup):
   - **Tanggal**: select/date-picker **dibatasi ke bulan terpilih**; default = hari kerja berikutnya yang belum terisi (otomatis lompat weekend).
   - **Task / Ticket**: text dengan *autocomplete dari task yang pernah diisi* (ambil dari file + history), tombol "duplikat dari baris sebelumnya".
   - **Start / End**: input waktu, default `08:00` / `17:00` (bisa diubah di Settings).
   - Enter = tambah, fokus kembali ke Task.
3. **Daftar aktivitas** (tabel ringkas bisa di-edit inline, hapus, duplikat, drag untuk urut).
4. **Evidence per tanggal**: dropzone per tanggal (2 slot: kiri/kanan) — **drag & drop, pilih file, atau paste dari clipboard (Ctrl+V)**; preview thumbnail, hapus/ganti/tukar posisi.
5. **Hari khusus**: tandai tanggal sebagai `Public Holiday` / cuti → jadi baris merah.
6. **Settings (sekali isi, tersimpan di dokumen)**: vendor, consultant, role, platform, lead project/PO, tribe leader, squad, teks footer perusahaan, tanggal tanda tangan (default = hari kerja terakhir bulan itu), upload 3 gambar tanda tangan, jam default.

### 3.3 Aturan otomatis
- Weekend (Sabtu/Minggu) **selalu** dirender sebagai baris merah `Weekend`, tanpa input.
- Semua tanggal bulan itu dirender berurutan 01 → akhir bulan (28–31 hari, termasuk tahun kabisat).
- Hari kerja tanpa aktivitas: tampil sebagai baris kosong putih + **warning** di panel validasi (bukan error).
- Ganti bulan/tahun pada dokumen berisi data → konfirmasi: *pindahkan tanggal / mulai periode baru / batal*.
- Fitur **"Mulai bulan berikutnya"**: buat dokumen baru dengan profile & tanda tangan terbawa, entries & evidence kosong.

---

## 4. Penyimpanan: "seperti Word", tanpa DB

**Satu dokumen = satu file** yang berisi semuanya (data + gambar evidence + tanda tangan), jadi bisa dipindah/dibackup/dikirim.

- Format: `.json` (UTF-8) dengan `schemaVersion`. Nama default: `Timesheet-{YYYY}-{MM}-{Consultant}.json`.
- **Chromium (Chrome/Edge)**: gunakan **File System Access API** (`showOpenFilePicker`, `showSaveFilePicker`, `FileSystemFileHandle.createWritable`). `Simpan` menulis langsung ke file yang sama tanpa dialog; `Simpan Sebagai` membuka dialog.
- **Fallback (Firefox/Safari)**: `Buka` via `<input type="file">`, `Simpan` via download Blob. Deteksi fitur, jangan sniff user agent.
- **Autosave**: debounce ±1.5 dtk ke file handle bila ada izin; kalau belum pernah disimpan, simpan **draft pemulihan** ke IndexedDB (hanya buffer lokal browser, bukan database aplikasi) dan tawarkan "Pulihkan draft" saat dibuka lagi.
- Ingat file terakhir (simpan `FileSystemFileHandle` di IndexedDB) → tombol "Buka terakhir" (perlu re-grant izin, tangani dengan benar).
- `Ctrl/Cmd+S` = simpan, `Ctrl/Cmd+O` = buka, `Ctrl/Cmd+Z / Shift+Z` = undo/redo.
- Indikator *dirty state* + `beforeunload` warning bila ada perubahan belum tersimpan.
- Migrasi: `migrate(doc)` berbasis `schemaVersion`; file dari versi lama harus tetap terbuka.
- Validasi file saat dibuka (schema runtime, mis. zod): file rusak → pesan jelas, jangan crash.

### Skema dokumen (`schemaVersion: 1`)
```ts
type TimesheetDoc = {
  schemaVersion: 1;
  profile: {
    vendorName: string; platform: string;            // "Legacy Platform"
    consultantName: string; consultantRole: string;
    leadProject: string; tribeLeader: string; squad: string;
    footerCompany: string; footerGroup: string;      // cover evidence
    signDate: string;                                // ISO date
    signatures: { preparedBy: string|null; leadProject: string|null; tribeLeader: string|null }; // dataURL
    defaults: { start: string; end: string };        // "08:00" / "17:00"
  };
  period: { year: number; month: number };          // 1–12
  entries: {
    id: string; date: string; task: string; start: string; end: string; remarkOverride: string|null;
    source: "manual" | "git" | "vscode" | "claude-code" | "import";   // Bagian 12
    reviewed: boolean;                                               // entri otomatis = false sampai user terima
    refs?: { repo?: string; branch?: string; ticket?: string };      // jejak asal, tidak dirender
  }[];
  dayOverrides: Record<string, { type: "holiday" | "leave"; label: string }>;
  evidence: Record<string, {
    id: string; name: string; mime: string; dataUrl: string; w: number; h: number;
    sensitivity: "plain" | "code"; blurred: boolean;                 // Bagian 5.1 — dataUrl SELALU versi final
  }[]>; // key = ISO date, max 2 per date
  automation: {                                                      // Bagian 12
    repos: { path: string; label: string }[];
    ticketMap: Record<string, string>;                               // "BIT-123" → "Fixing flow case admin case transfer"
    evidenceFolder: string | null;
    ticketPattern: string;                                           // regex, default "(BIT|ASUM)-\\d+"
  };
};
```
Contoh data nyata (Oktober 2026, tanpa gambar): `fixtures/timesheet-2026-10.sample.json`.

---

## 5. Evidence: penanganan gambar

- Terima `png/jpg/webp`; **kompres di client** (canvas): sisi terpanjang maks ~1600px, JPEG quality ~0.8 (PNG transparan untuk tanda tangan tetap PNG). Target ukuran dokumen tetap wajar (< ~15 MB untuk satu bulan).
- Simpan `w`/`h` untuk layout; tampilkan ukuran total dokumen + peringatan jika terlalu besar.
- Batas 2 gambar per tanggal (sesuai format). Pesan jelas bila lebih.
- Paste dari clipboard (screenshot) mengisi slot kosong pertama pada tanggal yang sedang aktif.

### 5.1 Privasi: evidence berupa screenshot kode **wajib di-blur**
Evidence boleh berupa screenshot editor/kode kerjaan, tetapi isi kode adalah milik klien → harus diburamkan sebelum masuk dokumen (lihat contoh: screenshot kanan di evidence pages selalu blur).

- Setiap gambar evidence punya flag `sensitivity: "plain" | "code"`. Default **`"code"`** untuk gambar yang masuk lewat automation (Bagian 12) dan untuk paste dari clipboard; user bisa ubah per gambar.
- Gambar `code` **wajib** melewati **editor blur in-app** sebelum dianggap valid:
  - Mode **Blur penuh** (default, satu klik): Gaussian blur kuat (radius ≈ 12–16px pada sisi panjang 1600px) ke seluruh gambar — teks tidak terbaca, tapi bentuk editor/warna syntax masih terlihat seperti contoh.
  - Mode **Blur area**: user menggambar kotak → hanya area itu yang diblur/dipixelate; sisanya (judul tab, nama ticket, tanggal) tetap terbaca. Boleh banyak kotak, bisa undo.
  - Mode **Pixelate** sebagai alternatif blur (blok ≈ 10–14px).
- **Simpan hanya hasil blur** ke dokumen; versi asli **tidak pernah** ditulis ke file `.json` (hanya ada di memori saat editing). Ini aturan keras, karena file dokumen bisa dikirim ke orang lain.
- Blur dilakukan di canvas **sebelum** kompresi, lalu kompres ulang; pastikan hasil akhir tidak bisa di-"un-blur" secara trivial (gunakan blur berlapis/pixelate, bukan CSS filter yang hanya visual).
- Validasi (Bagian 7): ❌ error bila ada gambar `code` yang belum diblur saat export; ⚠️ warning bila gambar `plain` terdeteksi mirip editor kode (heuristik sederhana: dominan background gelap + banyak garis teks pendek berwarna — cukup sebagai pengingat, bukan blokir).
- Gambar `plain` (mis. screenshot board/kalender/meeting seperti contoh kiri) tetap boleh diblur sebagian untuk menutup nama/kata sensitif.

---

## 6. Export PDF

- **Sumber kebenaran tunggal**: komponen React halaman A4 (`<Page>`) yang dipakai untuk preview *dan* export — dilarang ada dua implementasi layout.
- Export: CSS print (`@page { size: A4; margin: 0 }`, tiap halaman `width: 210mm; height: 297mm; break-after: page`) + `window.print()` (PDF vektor, teks bisa di-select). Siapkan `print-color-adjust: exact` agar warna merah/kuning ikut tercetak.
- Nama file PDF default: `BHN II - Timesheet {MonthName}.pdf` *(prefix dapat diubah di Settings)*.
- Urutan halaman PDF: Timesheet (1–2) → Signature → Evidence cover → Evidence pages.
- Jika print CSS tidak cukup presisi, boleh evaluasi `@react-pdf/renderer`, tapi **catat alasannya di `docs/DECISIONS.md`** dan tetap jaga preview = output.

---

## 7. Validasi & penguat alur (jangan dilewatkan)

Panel **"Cek sebelum export"** (non-blocking kecuali error):
- ❌ Error: End ≤ Start; format jam salah; task kosong; tanggal di luar bulan; signature/nama approver kosong saat export; **entri otomatis belum direview**; **gambar `code` belum diblur**.
- ⚠️ Warning: hari kerja tanpa entri; tanggal ber-entri tanpa evidence; evidence di tanggal tanpa entri; total jam harian < 8 atau > 12; task identik > N hari berturut (opsional info); file > batas ukuran.
- 💡 Info: total hari kerja, total jam, jumlah halaman evidence.
- Klik item validasi → scroll/fokus ke tanggal terkait.

Penguat lain:
- **Ringkasan bulan** (hari kerja terisi / total, total jam).
- **Duplikat dari hari sebelumnya** + **isi massal**: pilih rentang tanggal kerja → isi task & jam sama.
- **Template task** (daftar favorit) disimpan di profile dokumen.
- **Import dari bulan lalu**: buka file bulan sebelumnya → ambil profile + tanda tangan + daftar task.
- Pratinjau PDF akurat sebelum export + tombol "Buka di tab baru".
- Dark/light untuk **UI aplikasi** saja; halaman A4 selalu putih (format baku).
- Aksesibilitas dasar: label form, fokus keyboard, kontras.

---

## 8. Acceptance criteria & test

**Golden test (wajib):** muat `fixtures/timesheet-2026-10.sample.json`, render, dan pastikan:
1. 31 baris tanggal (01–31 Oktober 2026); tanggal 03, 04, 10, 11, 17, 18, 24, 25, 31 = baris merah `Weekend`.
2. 07/10/2026 muncul **2 baris**.
3. Nilai kolom Date/Task/Start/End persis seperti fixture; Remark = `Foto / Screenshot` + `Evidence Page N` dengan N sesuai aturan kapasitas (3 lalu 4 per halaman) *saat evidence diisi*.
4. Header tabel, warna `#C00000`, lebar kolom 66/246/42/43/120pt, dan urutan halaman sesuai Bagian 2.
5. Visual regression (Playwright screenshot) terhadap render PDF contoh — toleransi kecil (anti-aliasing).

**Unit test:** generator tanggal (28/29/30/31 hari, kabisat), penanda weekend, pembagian evidence page (3/4/4/…), numbering remark, validasi, migrasi schema, serialisasi/deserialisasi dokumen, kompresi gambar (mock canvas).

**Manual check:** buka file di Chrome (File System Access) dan Firefox (fallback); export PDF → bandingkan dengan `BHN II - Timesheet October.pdf`.

---

## 9. Fase kerja

| Fase | Output |
|---|---|
| **0 — Setup** | Baca template, bersihkan bagian tak terpakai, tambah dependency minimal, `docs/DECISIONS.md`, tipe dokumen + zod schema |
| **1 — Engine** | Generator tanggal, weekend, paginasi, numbering evidence (murni, ter-test) |
| **2 — Render** | Komponen `<Page>` untuk 4 bagian, **golden test Oktober lolos** |
| **3 — Input** | Panel input, daftar edit, settings, live preview |
| **4 — File** | New/Open/Save/Save As, autosave, draft recovery, fallback |
| **5 — Evidence** | Dropzone, paste, kompresi, layout evidence pages |
| **6 — Export & polish** | Print PDF, validasi, ringkasan, shortcut, undo/redo, a11y |
| **7 — Blur & Import** | Editor blur evidence (5.1); CLI `snapshot`/`import`; panel Import & Review (Bagian 12) |
| **8 — Collectors** | Scheduler snapshot harian, VS Code task/extension, hook Claude Code, skill `/timesheet`, auto-evidence |

> Fase 0–6 harus selesai dan dipakai dulu untuk minimal satu bulan nyata sebelum Fase 7–8 — automation menambah nilai hanya kalau dokumen dasarnya sudah benar.

---

## 10. Teknis & batasan

- Mengikuti stack/convention template (TypeScript ketat bila template memakainya). State lokal ringan (mis. reducer/store yang sudah ada di template); **tidak perlu RTK Query / fetch layer**.
- Dependency baru harus minimal dan dijustifikasi (kandidat: `zod`, `date-fns`, `idb-keyval`, `vitest/jest` sesuai template, `playwright`).
- Semua pemrosesan di browser; **jangan kirim data/gambar ke server mana pun**.
- Bahasa UI: **Indonesia**. Bahasa dokumen output: **Inggris** (sesuai format baku, termasuk nama bulan).
- Jangan ubah teks/label baku dokumen (termasuk typo asli `Consultan Role`) kecuali saya minta.

---

## 11. Aset yang tersedia

- `assets/ifg-logo.png` — logo IFG transparan (diekstrak dari contoh).
- `fixtures/timesheet-2026-10.sample.json` — data Oktober 2026 untuk seed & golden test.
- `BHN II - Timesheet October.pdf` — referensi visual (halaman 1–2 timesheet, 3 tanda tangan, 4 cover evidence, 5–10 evidence).
- **Belum ada (saya upload nanti lewat Settings):** gambar tanda tangan 3 orang.

---

## 12. Automation — mengurangi input manual (Fase 7–8)

### 12.1 Prinsip (aturan keras)
1. **Nol sentuhan ke GitLab kantor**: tidak ada webhook, CI, token API, push, atau perubahan apa pun di remote. Semua pembacaan hanya dari **repo lokal** dan **working tree** di laptop.
2. **Read-only terhadap git**: collector hanya menjalankan perintah baca (`status`, `diff --stat`, `log`, `reflog`, `branch`). Tidak pernah `add`, `commit`, `stash`, `checkout`, atau menulis ke `.git/`. Tidak menaruh file apa pun di dalam repo (tidak ada `.vscode/tasks.json` atau hook di repo — semua di level user/home).
3. **Tanpa commit pun terbaca**: user tidak commit tiap hari, jadi sumber utama adalah **snapshot harian working tree** (staged + unstaged + untracked), bukan `git log`.
4. **Tidak menyimpan isi kode**: worklog hanya berisi path file, branch, jumlah baris berubah, dan nama ticket. Tidak pernah diff content, tidak pernah prompt Claude Code secara utuh (hanya ringkasan ≤ 120 karakter yang sudah difilter).
5. **Human-in-the-loop**: semua hasil automation masuk sebagai entri `reviewed: false`. Export diblokir sampai direview. Automation membuat *draft*, user yang memutuskan.

### 12.2 Arsitektur: satu worklog, banyak collector
```
collectors ──append──▶ ~/.timesheet/worklog.jsonl ──import──▶ dokumen .json ──▶ app (Import & Review)
 • git snapshot (cron sore)
 • VS Code (task folderOpen / extension onDidSave)
 • Claude Code hooks
 • evidence folder scanner
```
Semua collector dan importer adalah **satu CLI** di repo yang sama (`packages/cli`, Node, dipanggil `timesheet <cmd>`), karena browser tidak bisa membaca git/folder lokal. App hanya membaca hasil import dari file dokumen (reload / tombol "Muat ulang dari disk").

**Format `worklog.jsonl`** (satu objek per baris, append-only, aman jika proses mati di tengah):
```jsonc
{"ts":"2026-11-14T09:12:40+07:00","kind":"git-snapshot","repo":"/Users/me/work/bantuit-fe","label":"BANTUIT FE","branch":"BIT-231-case-transfer","ticket":"BIT-231","changed":[{"path":"src/pages/CaseTransfer.tsx","status":"M","add":42,"del":7}],"commitsToday":0}
{"ts":"2026-11-14T09:15:02+07:00","kind":"vscode-save","repo":"/Users/me/work/bantuit-fe","branch":"BIT-231-case-transfer","path":"src/pages/CaseTransfer.tsx"}
{"ts":"2026-11-14T10:03:11+07:00","kind":"claude-code","event":"SessionStart","cwd":"/Users/me/work/bantuit-fe","summary":"refactor case transfer form validation"}
{"ts":"2026-11-14T16:45:00+07:00","kind":"evidence","date":"2026-11-14","path":"~/Timesheet/evidence/2026-11-14/vscode-1645.png","sensitivity":"code"}
```

### 12.3 CLI
- `timesheet snapshot` — untuk tiap repo di `automation.repos`: baca branch aktif, `git status --porcelain=v2`, `git diff --numstat` + `--cached --numstat`, mtime file untracked, `git log --since=midnight --author=<email>`. Tulis satu baris `git-snapshot`. Idempotent per (tanggal, repo): snapshot kedua di hari yang sama menimpa yang pertama secara logis (importer ambil yang terakhir).
- `timesheet import --doc <file.json> [--month YYYY-MM]` — baca worklog, kelompokkan per **tanggal × ticket** (fallback: per tanggal × repo), hasilkan entri:
  - `task` = `ticketMap[ticket]` jika ada; jika tidak, `"{ticket} – {branch tanpa prefix ticket, dash→spasi}"` dan tandai perlu dinamai.
  - `start`/`end` = default profile (format atasan tidak butuh jam nyata); jam nyata dari `vscode-save`/`claude-code` pertama & terakhir disimpan di `refs` sebagai hint yang tampil di panel review.
  - **Dedupe**: tidak membuat entri jika sudah ada entri (manual atau reviewed) dengan tanggal + ticket sama. Tidak pernah menimpa teks yang sudah diedit user.
  - Hari kerja tanpa aktivitas di worklog → tidak dibuat entri; muncul sebagai gap di validasi.
  - Evidence: baris `evidence` → masukkan ke slot kosong tanggal tsb (maks 2), `sensitivity` sesuai sumber (`code` untuk screenshot editor), `blurred: false` → app memaksa blur sebelum export.
- `timesheet doctor` — cek repo valid, email git cocok, scheduler terpasang, folder evidence ada.
- Semua CLI menulis ke dokumen dengan **write atomik** (tulis ke temp → rename) dan menolak jalan jika app sedang punya lock (file `.lock` sederhana di samping dokumen, kadaluarsa 10 menit).

### 12.4 Collector
- **Scheduler**: `timesheet install-scheduler` memasang cron (macOS/Linux: launchd/cron) atau Task Scheduler (Windows) untuk `snapshot` setiap hari kerja **16:45** dan saat login. Semua di home user, tidak menyentuh repo.
- **VS Code — opsi ringan**: task di **user-level** `tasks.json` dengan `"runOptions": {"runOn": "folderOpen"}` → `timesheet snapshot --event open`. Beri catatan di README cara memasangnya.
- **VS Code — opsi presisi (opsional)**: extension privat (`packages/vscode-ext`, install via `.vsix`, tidak dipublish): `workspace.onDidSaveTextDocument` → append `vscode-save` (debounce 60 dtk per file). Status bar kecil: "Timesheet: tercatat 14:03". Tidak membaca isi dokumen, hanya path + branch.
- **Claude Code hooks**: di `~/.claude/settings.json` (user-level), hook `SessionStart` dan `Stop` menjalankan `timesheet log-claude --event $EVENT`. Ringkasan sesi diambil dari prompt pertama, dipotong 120 karakter, dan **difilter**: hapus baris berisi token/secret pattern, path absolut, dan isi kode (blok ```). Sertakan contoh konfigurasi hook di README.
- **Skill Claude Code `/timesheet`** (`.claude/skills/timesheet/SKILL.md` di repo app ini, bukan di repo kantor): `/timesheet today|week|month` → jalankan `snapshot` + `import`, lalu Claude merapikan **nama task** untuk entri yang belum ada di `ticketMap` menjadi kalimat pendek layak dibaca atasan (gaya seperti contoh: "Tech debt work basket list", "Integrate api notes in case admin"), tulis usulan ke `ticketMap`, tetap `reviewed: false`.
- **Auto-evidence** (opsional, Fase 8 akhir): scheduler 16:45 mengambil screenshot layar aktif ke `~/Timesheet/evidence/YYYY-MM-DD/` dengan `sensitivity: "code"`. Karena kemungkinan besar berisi kode, importer **langsung menerapkan blur penuh** saat import (Bagian 5.1) dan hanya menyimpan versi blur; file asli di folder dibiarkan dan tidak pernah disalin ke dokumen. Alternatif: screenshot board/kalender (`plain`) via URL yang dikonfigurasi dengan Playwright headless memakai profil browser user.

### 12.5 UI: panel "Import & Review"
- Tab baru di panel input: tombol **Impor dari worklog** (menjalankan `import` lewat instruksi/command yang disalin, atau membaca hasil karena app tidak bisa exec) → badge "N entri otomatis belum direview".
- Daftar review per tanggal: entri usulan dengan sumber (ikon git / VS Code / Claude Code), branch, ticket, hint jam nyata, file tersentuh (collapsed). Aksi: **Terima**, **Ubah lalu terima**, **Gabung dengan baris lain**, **Tolak**. Terima semua untuk satu minggu sekaligus.
- Editor **ticketMap** (tabel ticket → nama task) dan daftar repo, tersimpan di dokumen; "Mulai bulan berikutnya" membawa keduanya.
- Pengaturan automation ikut di dokumen (tanpa DB), kecuali path yang khusus mesin → simpan juga salinan di `~/.timesheet/config.json` agar dokumen tetap portabel.

### 12.6 Test
- Unit: parser `git status --porcelain=v2`, pengelompokan tanggal×ticket, dedupe terhadap entri manual, ekstraksi ticket dari branch (`feature/BIT-12-x`, `BIT-12`, `bit-12-x` → `BIT-12`), filter ringkasan Claude Code, write atomik + lock.
- Integrasi: repo git sementara (fixture) dengan file staged/unstaged/untracked tanpa commit → `snapshot` → `import` → entri muncul di tanggal yang benar.
- Keamanan: test memastikan worklog & dokumen **tidak pernah** berisi diff content atau isi file.
