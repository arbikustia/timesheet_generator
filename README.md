# Timesheet Builder

Aplikasi web 100% client-side untuk menyusun timesheet bulanan + evidence konsultan dalam format PDF baku.
Tanpa backend dan tanpa database: satu dokumen = satu file `.json` (Baru / Buka / Simpan / Simpan Sebagai).

- Spesifikasi: [docs/PROMPT.md](docs/PROMPT.md)
- Rencana & status fase: [docs/PLAN.md](docs/PLAN.md)
- Keputusan arsitektur: [docs/DECISIONS.md](docs/DECISIONS.md)

## Menjalankan

```bash
npm install
npm run dev     # http://127.0.0.1:5173
npm run lint
npm test
npm run build
```

## CLI `timesheet` (automation, Fase 7)

Browser tidak bisa membaca git, jadi pengumpul data adalah CLI Node di `packages/cli`. Semua pembacaan git
**read-only** (tanpa `add`/`commit`/`stash`/`checkout`, tanpa file di dalam repo kantor) dan hanya mencatat
path + jumlah baris, **tidak pernah isi kode**. Data CLI ada di `~/.timesheet/` (atau `$TIMESHEET_HOME`).

```bash
npm run build:cli && npm link          # sekali: memasang perintah `timesheet`

timesheet snapshot --doc Timesheet-2026-11-Nama.json   # catat working tree tiap repo (staged/unstaged/untracked)
timesheet import   --doc Timesheet-2026-11-Nama.json   # buat entri usulan (reviewed: false) dari worklog
timesheet doctor   --doc Timesheet-2026-11-Nama.json   # cek repo, email git, folder worklog, pola ticket
```

- Daftar repo diisi di aplikasi (tab **Review** → *Repo yang dipantau*); `snapshot --doc` menyalinnya ke
  `~/.timesheet/config.json`, sehingga `timesheet snapshot` tanpa `--doc` juga bisa dipakai (mis. dari cron).
- Setelah `import`, klik **Muat ulang** di aplikasi lalu review usulan di tab **Review**. Export PDF diblokir
  sampai semua usulan diterima, digabung atau ditolak.
- `import` menulis dokumen secara atomik (file sementara → rename) dengan kunci `<dokumen>.lock` (kedaluwarsa
  10 menit). Aplikasi menolak menimpa file yang berubah di disk dan menawarkan **Muat ulang**.
