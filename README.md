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

## CLI `timesheet` (automation, Fase 7–8, sumber data: git)

Browser tidak bisa membaca git, jadi pengumpul data adalah CLI Node di `packages/cli`. Semua pembacaan git
**read-only** (tanpa `add`/`commit`/`stash`/`checkout`, tanpa file di dalam repo kantor) dan hanya mencatat
path + jumlah baris, **tidak pernah isi kode**. Data CLI ada di `~/.timesheet/` (atau `$TIMESHEET_HOME`).

```bash
npm run build:cli && npm link          # sekali: memasang perintah `timesheet`

timesheet snapshot --doc Timesheet-2026-11-Nama.json   # catat working tree tiap repo (staged/unstaged/untracked)
timesheet import   --doc Timesheet-2026-11-Nama.json   # buat entri usulan (reviewed: false) dari worklog
timesheet doctor   --doc Timesheet-2026-11-Nama.json   # cek repo, email git, folder worklog, pola ticket, scheduler

timesheet install-scheduler --doc Timesheet-2026-11-Nama.json   # snapshot otomatis Senin–Jumat 16:45 + saat login
timesheet install-scheduler --dry-run                           # lihat dulu apa yang akan dipasang
timesheet uninstall-scheduler
timesheet backfill [--from 2026-11-01] [--to 2026-11-13]         # isi hari terlewat dari reflog & commit lokal
timesheet vscode-task                                           # snippet tasks.json level user (snapshot saat folder dibuka)
```

- Scheduler dipasang di level user: crontab (Linux/WSL), LaunchAgent (macOS) atau Task Scheduler (Windows).
  Di **WSL**, cron hanya berjalan bila layanannya aktif (`sudo service cron start`, atau systemd di
  `/etc/wsl.conf`). Jalankan ulang `install-scheduler` setelah memindah/upgrade Node (path Node ditulis absolut).
  Log jadwal: `~/.timesheet/scheduler.log`.

- Daftar repo diisi di aplikasi (tab **Review** → *Repo yang dipantau*); `snapshot --doc` menyalinnya ke
  `~/.timesheet/config.json`, sehingga `timesheet snapshot` tanpa `--doc` juga bisa dipakai (mis. dari cron).
- Setelah `import`, klik **Muat ulang** di aplikasi lalu review usulan di tab **Review**. Export PDF diblokir
  sampai semua usulan diterima, digabung atau ditolak.
- `import` menulis dokumen secara atomik (file sementara → rename) dengan kunci `<dokumen>.lock` (kedaluwarsa
  10 menit). Aplikasi menolak menimpa file yang berubah di disk dan menawarkan **Muat ulang**.
