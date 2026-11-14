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

## Fase 3 — Input (2026-11-14)

### D-016 · State dokumen di Redux slice `timesheet`
- `src/store/timesheet.slice.ts` memegang `doc` (dokumen lengkap). Semua perubahan lewat action:
  `loadDoc`, `changePeriod` (move/reset), `startNextMonth`, `addEntry`, `updateEntry`, `removeEntry`,
  `duplicateEntry`, `moveEntry`, `setDayOverride`, `updateProfile`, `updateDefaultHours`, `setSignature`.
  Logika murni di `src/libs/utils/timesheet-mutation.util.ts` (ter-test). Undo/redo: lihat D-030.
- `makeStore(preloadedState)` untuk test; `serializableCheck` dimatikan karena dokumen berisi data URL besar.
- State awal = dokumen kosong bulan berjalan. Belum ada persistensi: refresh = data hilang sampai Fase 4
  (Simpan/Buka + draft IndexedDB).

### D-017 · Modul UI
- `timesheet-builder` (shell: top bar, split view 2fr/3fr, tabs, toggle tema UI), `period-panel`,
  `entry-form`, `entry-list`, `day-overrides`, `profile-settings`, `document-preview`. Semua mengikuti pola
  container/component/hook + test + snapshot. Tombol Baru/Buka/Simpan di top bar menyusul di Fase 4.
- Input memakai antd langsung (bukan komponen shared template yang berukuran besar h-14/text-xl) dan
  `<input type="time">` / `<select>` native agar tidak perlu dayjs.
- Tanpa react-hook-form: setiap field langsung men-dispatch perubahan sehingga live preview selalu sinkron.
- Handler per baris membaca `data-*` (`data-entry-id`, `data-field`, `data-index`, `data-date`,
  `data-signature-key`) supaya tidak ada arrow function inline di JSX (Convention §4.4).

### D-018 · Perilaku input
- Ganti bulan/tahun saat ada data → dialog: "Pindahkan tanggal" (hari yang sama; tanggal yang tidak ada di
  bulan tujuan, mis. 31, dibuang), "Mulai periode baru" (kosong), "Batal". Tanggal tanda tangan direset ke
  hari kerja terakhir periode baru.
- "Mulai {bulan berikutnya}" membawa profil, tanda tangan dan automation; aktivitas, evidence dan hari khusus kosong.
- Form cepat: tanggal default = hari kerja pertama yang belum terisi (lompat weekend/libur), jam default dari
  Settings, Enter = tambah, fokus kembali ke Task. Autocomplete Task = template favorit lalu task yang pernah
  dipakai (terbaru dulu). Entri baru disisipkan berurutan tanggal.
- Daftar aktivitas: edit inline, duplikat (tepat di bawahnya), hapus, urut ulang via drag & drop atau tombol
  naik/turun (aksesibel keyboard), Remark manual opsional (kosong = otomatis).
- Template task disimpan per baris apa adanya (baris kosong boleh saat mengetik; diabaikan saat dipakai).
- Tanda tangan dibaca lokal sebagai data URL (PNG/JPG/WebP), tidak pernah dikirim ke server.
- Preview: zoom fit-width dengan CSS `zoom` (lebar halaman A4 = 793.7px), halaman selalu putih walau UI gelap.

### D-019 · Tooling
- `eslint --fix` menyisipkan stub JSDoc kosong (rule `jsdoc/require-jsdoc` auto-fixable). Untuk merapikan import
  gunakan `npx eslint --fix --rule '{"jsdoc/require-jsdoc":"off"}' <path>`.
- Slice Redux mendapat override lint seperti services lama: reducer inline dikecualikan dari JSDoc (§4.3).
- `@/libs/unit-test` kini juga menyediakan `renderWithStore`, `createStoreWrapper`, `within`, dan opsi
  `wrapper` di `assertSnapshots` untuk container yang butuh store.

## Fase 4 — File (2026-11-14)

### D-020 · Satu dokumen = satu file `.json`
- Chromium: File System Access API. `Simpan` menulis ke handle yang sama tanpa dialog (minta izin `readwrite`
  bila perlu), `Simpan Sebagai` membuka dialog. Firefox/Safari: `Buka` lewat `<input type="file">`,
  `Simpan`/`Simpan Sebagai` = download. Deteksi fitur (`showOpenFilePicker`/`showSaveFilePicker`), tanpa UA sniffing.
- Nama default `Timesheet-{YYYY}-{MM}-{Consultant}.json`; setelah disimpan/dibuka nama file dipertahankan.
- Isi file selalu melewati `parseTimesheetDoc` (JSON → versi → migrasi → Zod). File rusak/versi lebih baru →
  pesan jelas di top bar, dokumen saat ini tidak berubah.
- `Baru` = dokumen kosong bulan berjalan (profil ikut kosong; untuk membawa profil gunakan "Mulai bulan berikutnya").
- `Baru`, `Buka`, `Buka terakhir` meminta konfirmasi bila ada perubahan belum disimpan.

### D-021 · Status kotor & autosave
- `timesheet.savedDoc` menyimpan referensi dokumen terakhir yang ditulis/dibuka; dirty = `doc !== savedDoc`
  (Immer membuat referensi baru tiap perubahan). Indikator: `Tersimpan HH:mm` / `Belum disimpan ● · draft HH:mm`.
- Autosave 1.5 dtk setelah perubahan terakhir: ke file yang terbuka **hanya** bila izin tulis sudah diberikan
  (tidak pernah memunculkan prompt), selain itu ke draft IndexedDB. Draft dihapus setelah berhasil menyimpan ke file.
- Saat aplikasi dibuka dan ada draft → dialog "Pulihkan draft?" (Pulihkan / Buang). Draft dipulihkan sebagai
  perubahan belum disimpan.
- `beforeunload` aktif selama dokumen kotor.

### D-022 · "Buka terakhir" & penyimpanan lokal
- `idb-keyval@6.3.0` (±600 B) untuk dua kunci saja: `timesheet-builder:draft` dan
  `timesheet-builder:last-file-handle`. Ini buffer browser, bukan database aplikasi. Semua akses dibungkus
  try/catch (mode privat / IndexedDB nonaktif → diabaikan, termasuk throw sinkron).
- Handle file tidak serializable sehingga tidak disimpan di Redux; handle aktif ada di
  `src/libs/utils/file-handle.registry.ts`, Redux hanya menyimpan `fileName`, `hasHandle`, `lastSavedAt`
  (slice `file`).
- `DocumentFileHandle` (name, getFile, createWritable, query/requestPermission) dipakai di seluruh kode supaya
  handle palsu di test tidak butuh type assertion. Tipe picker/izin yang belum ada di lib DOM TypeScript
  dideklarasikan di `src/types/file-system-access.d.ts`.

### D-023 · Shortcut
- `Ctrl/Cmd+S` simpan, `Ctrl/Cmd+Shift+S` simpan sebagai, `Ctrl/Cmd+O` buka (`src/hooks/useKeyboardShortcuts.ts`).
  `Ctrl/Cmd+Z / Shift+Z` sudah dikenali hook-nya; undo/redo dikerjakan di Fase 6.
- Belum diuji manual di browser sungguhan (Chrome + Firefox) — perlu dicek sesuai PROMPT §8 "Manual check".

## Fase 5 — Evidence (2026-11-14)

### D-024 · Blur penuh sudah diterapkan sejak Fase 5
- PROMPT §5.1 melarang versi asli screenshot kode tertulis ke `.json`. Karena paste default `"code"` dan editor
  blur baru ada di Fase 7, blur **penuh** dikerjakan sekarang: gambar `code` dipixelate (blok 14px) lalu diberi
  Gaussian blur 6px **pada piksel canvas** (bukan CSS), sebelum kompresi. Yang tersimpan hanya versi blur
  (`blurred: true`). Fase 7 menambah blur area/pixelate manual di atas fondasi ini.
- Paste (Ctrl/Cmd+V) selalu dianggap screenshot kode → otomatis diblur. Upload/drag & drop default `plain`; ada
  checkbox "screenshot kode (blur otomatis)" untuk upload dan tombol **Blur** per gambar `plain`.
- Gambar yang sudah diblur tidak bisa "dikembalikan" (aslinya tidak pernah disimpan); unggah ulang bila perlu.

### D-025 · Pemrosesan gambar di browser
- `src/libs/utils/image.util.ts`: decode (`createImageBitmap`, fallback `<img>`), sisi terpanjang maks 1600px
  (tanpa upscale), latar putih, JPEG kualitas 0.8. Semua evidence disimpan sebagai JPEG (PNG transparan →
  latar putih). Tanda tangan tidak lewat jalur ini (tetap PNG asli).
- Tidak ada pengiriman ke server; data URL → Blob di-decode lokal (`atob`).

### D-026 · Panel Evidence
- Tab baru **Evidence**: satu blok per tanggal yang punya aktivitas (plus tanggal yang sudah punya evidence),
  dua slot Kiri/Kanan. Slot kosong = drop zone + pilih file; slot terisi = thumbnail + Ganti / Blur / Hapus;
  tombol Tukar posisi bila dua gambar.
- "Tanggal aktif" = blok yang terakhir diklik/difokus (ditandai `aria-current`); paste mengisi slot kosong
  pertama tanggal aktif, atau tanggal pertama yang masih punya slot kosong.
- Lebih dari 2 gambar → hanya slot yang tersedia diisi + pesan "Maksimal 2 gambar per tanggal".
- Ukuran dokumen diestimasi (jumlah panjang data URL + sisa JSON kecil) agar tidak men-serialize megabyte
  gambar setiap ketikan; peringatan bila > 15 MB.

### D-027 · Test
- jsdom tidak punya canvas: `src/fixture/canvas.fixture.ts` memasang canvas 2D palsu + `createImageBitmap`
  (dengan `Object.defineProperty`, tanpa type assertion) dan mencatat filter yang aktif saat menggambar
  sehingga test bisa memastikan blur benar-benar diterapkan.

## Fase 6 — Export & polish (2026-11-14)

### D-028 · Export PDF = print CSS + `window.print()`
- Tidak memakai `@react-pdf/renderer`: print CSS sudah presisi karena halaman digambar dengan posisi absolut
  dalam `pt` di bingkai `210mm × 297mm` (D-012), dan hasilnya PDF vektor dengan teks yang bisa di-select.
- Preview berada di dalam `#root` yang di-`zoom: 0.67`, panel ber-scroll, dan pratinjau di-`zoom` fit-width.
  Supaya cetak tidak bergantung pada itu semua, `modules/export-pdf` me-mount **salinan** `<TimesheetDocument>`
  (komponen yang sama, bukan layout kedua) lewat portal ke `document.body` dalam `.print-root`. Di layar
  `.print-root { display: none }`; saat print semua anak `body` lain disembunyikan, `@page { size: A4; margin: 0 }`,
  jarak antarhalaman preview (`gap`) dinolkan dan halaman terakhir tidak memaksa page break.
- `print-color-adjust: exact` sudah ada di style halaman (Fase 2) sehingga merah/kuning ikut tercetak.
- Nama file PDF default diambil browser dari `document.title`: selama `beforeprint`…`afterprint` judul diganti
  `{pdfFilePrefix} {MonthName}` (`getPdfFileTitle`, mis. `BHN II - Timesheet October`), lalu dikembalikan
  (`src/hooks/usePrintTitle.ts`). Berlaku juga untuk print dari menu browser.
- Tombol **Export PDF** dan `Ctrl/Cmd+P` menjalankan cek dulu: ada error → dialog daftar error (maks. 5) +
  "Lihat Cek export"; tanpa error → `window.print()`. Print dari menu browser tidak bisa dicegat (tidak diblokir).
- Belum dikerjakan: tombol "Buka di tab baru" (PROMPT §7). Preview di kanan sudah = output cetak.

### D-029 · Panel "Cek export" & ringkasan bulan
- Aturan murni di `src/libs/utils/timesheet-validation.util.ts` (`validateDoc` → issues + counts + summary),
  di-memo per dokumen lewat `selectValidationReport` (`createSelector`) sehingga tab, badge dan tombol export
  memakai satu hasil.
- ❌ Error (memblokir export): tanggal di luar periode, task kosong, format jam salah, jam selesai ≤ mulai,
  entri otomatis belum direview, screenshot `code` belum diblur, nama konsultan/Lead Project/Tribe Leader kosong,
  tiga gambar tanda tangan belum diunggah. Nama konsultan ikut wajib karena tercetak di kolom "Prepared by".
- ⚠️ Warning: hari kerja tanpa aktivitas, aktivitas pada Weekend/libur/cuti (D-011), aktivitas tanpa evidence,
  evidence tanpa aktivitas, evidence di luar periode, total jam harian < 8 atau > 12, ukuran dokumen > 15 MB.
  Info "task identik > N hari" (opsional di PROMPT) tidak dibuat.
- 💡 Info = ringkasan bulan di atas daftar: hari kerja terisi / total (Senin–Jumat tanpa libur/cuti), total jam
  (durasi valid entri dalam periode), jumlah aktivitas, halaman evidence (dan jumlah tanggal).
- Klik item → pindah tab dan fokus/scroll: aktivitas (`entry-{id}`), blok evidence (`evidence-{date}`),
  input profil (`profile-{field}`), slot tanda tangan (`signature-{key}`); item tanggal juga men-scroll baris
  tabel di preview (`[data-preview] tr[data-date]`). Id dibuat di `src/libs/utils/anchor.util.ts`.
- Label tab menampilkan jumlah error (merah) atau, bila tidak ada error, jumlah peringatan.

### D-030 · Undo/redo
- Riwayat ada di slice `timesheet` (`past`, `future`, maks. 100 langkah) — reducer slice dibungkus
  `timesheetReducer` yang mencatat setiap aksi edit yang benar-benar mengubah `doc` (`isAnyOf(...)`).
  `loadDoc`/`restoreDraft` mengosongkan riwayat; `markSaved` tidak dicatat. Karena dirty = `doc !== savedDoc`,
  undo kembali ke dokumen tersimpan otomatis menjadi "Tersimpan".
- Ketikan beruntun di field yang sama (merge key `entry:{id}:{field}`, `profile:{field}`, `defaults:{field}`)
  digabung menjadi satu langkah; aksi lain (tambah/hapus/pindah/evidence/periode) selalu langkah sendiri.
- Shortcut `Ctrl/Cmd+Z` undo, `Ctrl/Cmd+Shift+Z` dan `Ctrl/Cmd+Y` redo, juga saat fokus di input teks
  (menggantikan undo bawaan input, karena tiap ketikan sudah langsung masuk ke dokumen). Tombol
  Urungkan/Ulangi di top bar (`modules/edit-history`).
- `removeEntry` dengan id tak dikenal kini no-op (tidak membuat dokumen baru → tidak tercatat di riwayat).

### D-031 · Aksesibilitas dasar
- Preview bisa di-scroll dengan keyboard (`tabIndex=0` pada region "Pratinjau dokumen"); dokumen A4 diberi
  `lang="en"` (UI tetap `lang="id"`). Salinan cetak `aria-hidden`.
- Item cek berupa `<button>` dengan prefix level untuk screen reader ("Error: …"/"Peringatan: …"); ikon
  dekoratif `aria-hidden`; tombol ikon (Urungkan/Ulangi) punya `aria-label` dan `aria-keyshortcuts`.
- Teks peringatan memakai `text-warning-strong` (kontras ≥ 4.5:1) menggantikan `text-warning` (≈3.2:1).
- jsdom tidak punya `scrollIntoView`; `src/setupTests.ts` memasang stub `jest.fn()`.

## Fase 7 — Blur & Import (2026-11-14)

Dikerjakan atas permintaan langsung meski PROMPT §9 menyarankan Fase 0–6 dipakai sebulan dulu.

### D-032 · Editor blur (PROMPT §5.1)
- `modules/blur-editor` (modal): cakupan **Seluruh gambar** (default, satu klik "Terapkan blur") atau **Area
  tertentu** (seret untuk menggambar kotak, banyak kotak, "Urungkan area" / "Hapus semua area"); efek **Blur**
  (pixelate 14px + Gaussian 6px, seperti D-024) atau **Pixelate** (blok 12px, tanpa smoothing).
- Pratinjau memakai CSS (`filter`/`backdrop-filter`) hanya untuk tampilan; hasil yang disimpan diproses pada
  piksel canvas di `image.util.ts` (`applyBlurSpec`, area dipotong → disensor → digambar kembali) sebelum
  kompresi JPEG. Koordinat kotak disimpan sebagai pecahan 0–1 sehingga tidak bergantung ukuran tampilan.
- Gambar `code` (paste, atau upload dengan centang "screenshot kode") tidak lagi diblur otomatis: masuk antrean
  editor, aslinya hanya ada di memori (Blob + object URL yang di-revoke). **Batal** pada screenshot kode baru =
  gambar dibuang dengan pesan, sehingga versi tanpa blur tetap tidak pernah masuk dokumen.
- Tombol **Blur** pada gambar `plain` membuka editor dengan gambar tersimpan (mis. menutup nama saja);
  `sensitivity` tetap `plain`, `blurred: true`.
- Area dipilih dengan pointer saja; belum ada cara keyboard untuk menggambar kotak (mode "Seluruh gambar" tetap
  bisa dipakai penuh dengan keyboard).
- jsdom tidak punya `PointerEvent`: `src/setupTests.ts` memasang polyfill berbasis `MouseEvent`.

### D-033 · File berubah di disk & "Muat ulang"
- Browser tidak bisa membuat file `.lock` di samping dokumen, jadi perlindungan dari sisi aplikasi: setiap
  baca/tulis mencatat `File.lastModified` (`file-handle.registry`). Sebelum menulis (Simpan/autosave),
  `assertUnchangedOnDisk` membandingkan; bila berbeda (mis. `timesheet import` baru menulis) penulisan ditolak
  dengan pesan, autosave jatuh ke draft IndexedDB, dan perubahan lokal tidak hilang.
- Tombol **Muat ulang** (top bar, saat ada file handle) membaca ulang file dari disk, dengan konfirmasi bila ada
  perubahan belum disimpan. Simpan Sebagai ke file baru tidak diperiksa.

### D-034 · Skema `refs` & aksi review (tetap `schemaVersion: 1`)
- `EntryRefs` ditambah field opsional: `hint {first,last}` (jam aktivitas nyata), `files` (path saja),
  `summary` (≤ 120 karakter), `needsName` (task masih nama hasil generate). File lama tetap valid.
- Aksi store baru (semua bisa di-undo): `acceptEntries`, `mergeEntry` (hanya tanggal yang sama; daftar file
  digabung, baris sumber dihapus), `setTicketName` / `removeTicketName`, `addRepo` / `updateRepo` / `removeRepo`.
- Menerima entri yang `needsName` dan namanya sudah diganti → nama otomatis disimpan ke `ticketMap[ticket]`;
  mengisi nama di editor ticketMap juga mengganti task entri usulan dengan ticket itu yang belum direview.
- Nama ticket disimpan apa adanya saat diketik (boleh kosong sementara); kunci ticket dinormalisasi huruf besar.

### D-035 · Tab "Review" (PROMPT §12.5)
- `modules/import-review`: usulan dikelompokkan per minggu (Senin–Minggu) lalu per tanggal; tiap usulan
  menampilkan sumber, ticket · branch · repo, hint jam, ringkasan Claude Code, file tersentuh (collapsed), input
  nama task (ubah lalu terima), **Terima**, **Tolak**, **Gabung dengan…** (baris lain di tanggal yang sama) dan
  **Terima semua minggu ini**. Label tab menampilkan jumlah usulan.
- Karena aplikasi tidak bisa menjalankan CLI, tab menampilkan perintah `timesheet import --doc "<nama file>"
  --month YYYY-MM` + tombol salin, lalu instruksi "Muat ulang".
- `modules/automation-settings` (di tab yang sama): editor ticketMap (validasi pola ticket) dan daftar repo.
- Item cek "Aktivitas otomatis … belum direview" kini membuka tab Review dan memfokuskan usulannya.

### D-036 · CLI `timesheet` (`packages/cli`)
- Node + TypeScript, dibundel Vite (SSR, `publicDir: false`) ke `packages/cli/dist/timesheet.mjs`; `bin`
  di `package.json` (`npm run build:cli && npm link`). Memakai ulang parser/serializer dokumen, Zod schema dan
  `insertEntrySorted` dari `src/` lewat alias `@/` — satu sumber kebenaran format file.
- Git: allow-list `status`/`diff`/`log`/`branch`/`config --get`/`rev-parse`, `execFile` tanpa shell, dan
  `GIT_OPTIONAL_LOCKS=0` agar `git status` tidak menyegarkan `.git/index` (diuji: index tidak berubah).
- `snapshot`: `status --porcelain=v2 --branch --untracked-files=all` + `diff --numstat` (+ `--cached`),
  untracked hanya yang mtime-nya hari ini, `log --since=midnight --author=<user.email>`. Repo tanpa perubahan
  dan tanpa commit tidak dicatat. Repo dari `--doc` (disalin ke `config.json`), `config.json`, atau `--repo`.
- `import`: snapshot terakhir per tanggal × repo; dikelompokkan per tanggal × ticket (fallback tanggal × repo ×
  branch); `vscode-save` dan `claude-code` (dicocokkan lewat folder repo) menambah hint jam, file dan ringkasan.
  Task = `ticketMap[ticket]` atau `"{ticket} – {kata branch}"` (`needsName: true`). Jam = default profil.
  Dedupe terhadap entri apa pun di tanggal yang sama dengan ticket yang sama (di `refs.ticket`, di teks task,
  atau sama dengan nama di ticketMap); entri yang ada tidak pernah diubah. `--month` harus sama dengan periode
  dokumen (entri di luar periode tidak dicetak).
- Baris `evidence` di worklog **hanya dihitung**, belum diimpor: CLI tidak punya canvas untuk blur, dan PROMPT
  §5.1 melarang versi tanpa blur masuk ke file. Auto-evidence (dengan blur saat impor) dikerjakan di Fase 8.
- `doctor`: folder data bisa ditulis, pola ticket valid, tiap repo adalah repo git dan punya `user.email`.
- Belum: `install-scheduler`, `log-claude`, VS Code task/extension, skill `/timesheet` (Fase 8).
- Test CLI berjalan di Jest environment `node` (docblock); integrasi membuat repo git sementara (staged,
  unstaged, untracked, tanpa commit kedua) → `snapshot` → `import`, dan memastikan worklog & dokumen tidak
  memuat isi file.

## Fase 8 — Collectors berbasis git (2026-11-14)

Atas arahan: semua fitur yang berhubungan dengan Claude Code **ditahan** (hook `SessionStart`/`Stop`,
`timesheet log-claude`, skill `/timesheet`); collector mengandalkan git saja. Ekstensi VS Code (`vscode-save`)
dan auto-evidence (screenshot) juga ditahan karena bukan sumber git. Parser `claude-code`/`vscode-save` di
importer (Fase 7) tetap ada sehingga bisa diaktifkan nanti tanpa mengubah format worklog.

### D-037 · `timesheet install-scheduler` / `uninstall-scheduler`
- Menjadwalkan `node <cli> snapshot` Senin–Jumat (default 16:45, `--time HH:mm`) dan saat login, di level user:
  crontab (blok bertanda `# >>> timesheet-builder snapshot >>>`, hanya blok itu yang diganti/dihapus; login =
  `@reboot sleep 120`), LaunchAgent `~/Library/LaunchAgents/id.timesheet-builder.snapshot.plist`
  (`StartCalendarInterval` + `RunAtLoad`), atau dua tugas Task Scheduler (WEEKLY MON–FRI + ONLOGON, lewat `cmd /c`).
- Path Node (`process.execPath`) dan skrip CLI (realpath) ditulis absolut supaya tidak bergantung PATH cron;
  `TIMESHEET_HOME` ikut bila diset; output ke `~/.timesheet/scheduler.log`.
- Jadwal menjalankan `snapshot` tanpa `--doc`, jadi daftar repo harus ada di `~/.timesheet/config.json`
  (`install-scheduler --doc` menyalinnya; tanpa repo, instalasi ditolak). `--dry-run` hanya menampilkan.
- WSL: dideteksi lewat `/proc/version`; diberi peringatan bahwa layanan cron harus aktif. Varian launchd dan
  Task Scheduler hanya diuji dengan runner palsu (belum di mesin macOS/Windows sungguhan).

### D-038 · `timesheet backfill`
- Mengisi hari yang terlewat (laptop mati/tidur saat 16:45) dari **reflog HEAD** (`git log -g HEAD
  --date=iso-strict`) — riwayat lokal clone ini, jadi hanya aktivitas di laptop sendiri — dan file commit
  (`git log -1 --numstat` per commit). Tetap read-only.
- Reflog dijalankan kronologis: `checkout: moving from A to B` menentukan branch aktif; commit / cherry-pick /
  revert dihitung sebagai commit; pull/merge/reset tidak dihitung sebagai aktivitas. Satu baris `git-snapshot`
  (`event: "backfill"`) per hari × branch; branch tanpa ticket hanya dicatat bila ada commit (menghindari
  noise checkout ke `development`).
- Hari yang sudah punya snapshot untuk repo itu dilewati, jadi aman dijalankan berulang. Importer menyimpan
  baris backfill per tanggal × repo × branch (snapshot biasa tetap "terakhir per tanggal × repo") dan
  menerimanya walau tanpa file (checkout ke branch ber-ticket sudah cukup sebagai sinyal).
- Default rentang: tanggal 1 bulan berjalan s.d. kemarin. Batas: reflog bawaan git kedaluwarsa ±90 hari.

### D-039 · VS Code (opsi ringan) & doctor
- `timesheet vscode-task` hanya **mencetak** snippet `tasks.json` level user (`runOn: folderOpen` →
  `snapshot --event open`); tidak menulis file apa pun, apalagi di repo. Catatan: snapshot pagi bisa memuat
  perubahan belum di-commit dari hari sebelumnya; snapshot 16:45 di hari yang sama menggantikannya.
- `doctor` kini memeriksa apakah scheduler terpasang (crontab berisi penanda / plist ada / `schtasks /Query`).
- Program eksternal (crontab, launchctl, schtasks) dijalankan tanpa shell lewat `runCommand` (stdin untuk
  `crontab -`); program yang tidak ada → exit 127, bukan crash.

## Fase 9 — Sisa penguat alur PROMPT §7 (2026-11-14)

Fase tambahan (tidak ada di PROMPT §9); isinya fitur §7 yang belum dibuat. "Duplikat dari hari/baris
sebelumnya" dan "template task" sudah ada sejak Fase 3 (tombol Duplikat di form cepat, D-018).

### D-040 · Isi massal
- `modules/bulk-fill` (lipatan "Isi massal" di tab Aktivitas): rentang Dari–Sampai (hanya hari kerja: Senin–Jumat
  tanpa libur/cuti), task (autocomplete sama dengan form cepat), jam (default dari Pengaturan) dan centang
  "Lewati tanggal yang sudah punya aktivitas" (default aktif). Tombol menampilkan jumlah hari yang akan diisi.
- Satu aksi `addEntries` → semua entri masuk berurutan tanggal sebagai **satu langkah undo**.
- Validasi sama dengan form cepat (task wajib, HH:mm, selesai > mulai) + rentang terbalik / tidak ada hari.

### D-041 · Impor dari bulan lalu
- `modules/previous-month-import` (tab Pengaturan): memilih file `.json` bulan lalu lewat `<input type="file">`
  (cukup baca, tidak perlu handle/izin tulis), melewati `parseTimesheetDoc` yang sama.
- `mergePreviousMonth` hanya **mengisi yang kosong**: field teks profil dan tanda tangan; `signDate`, periode,
  aktivitas, evidence dan hari khusus tidak disentuh. Daftar task = template favorit + template & task yang
  dipakai bulan lalu (unik). Automation: ticket/ repo yang belum ada ditambahkan, nilai bulan ini menang.
- Satu aksi `importPreviousMonth` (bisa di-undo) + ringkasan apa yang diambil.

### D-042 · Buka di tab baru
- Tombol ikon di samping Export PDF menyalin markup salinan cetak (`.print-root`, komponen `<Page>` yang
  sama, style inline) ke tab kosong same-origin, plus CSS kecil (latar abu-abu di layar, A4 tanpa margin saat
  print). Tab itu bisa di-print langsung; judulnya = nama file PDF. Pratinjau tidak melewati cek export.
- Pop-up diblokir → pesan "Tab baru diblokir browser…". Tab tidak ikut diperbarui saat dokumen berubah (salinan).

### D-043 · Info "task identik > N hari"
- Level baru `info` di Cek export (grup "Info", ikon biru) yang tidak memblokir dan tidak dihitung di badge
  tab. Aturan: task yang sama (trim) dipakai di lebih dari 5 hari kerja berturut-turut (`REPEATED_TASK_DAYS`);
  weekend/libur tidak memutus, hari kerja tanpa task itu memutus. Klik → baris tanggal pertama di preview.
