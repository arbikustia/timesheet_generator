/** Git subcommands the collectors may run; every one is read-only (PROMPT §12.1). */
export const READ_ONLY_GIT_COMMANDS: readonly string[] = ["status", "diff", "log", "branch", "config", "rev-parse"];

/** A lock file older than this is considered stale (PROMPT §12.3: 10 minutes). */
export const LOCK_STALE_MS = 10 * 60 * 1000;

/** Paths kept per imported entry (shown collapsed in the review panel). */
export const MAX_FILES_PER_ENTRY = 50;

/** Maximum length of a Claude Code summary (PROMPT §12.1). */
export const SUMMARY_MAX_LENGTH = 120;

/** Default ticket pattern when no document is given. */
export const DEFAULT_TICKET_PATTERN = "(BIT|ASUM)-\\d+";

export const WORKLOG_FILE = "worklog.jsonl";

export const CONFIG_FILE = "config.json";

export const USAGE = `Pemakaian: timesheet <perintah> [opsi]

Perintah:
  snapshot  Catat perubahan working tree tiap repo (read-only) ke ~/.timesheet/worklog.jsonl
            --doc <file.json>   ambil daftar repo dari dokumen (disalin ke ~/.timesheet/config.json)
            --repo <path>       repo tambahan (boleh berulang)
            --event <nama>      penanda pemicu, mis. "open" dari VS Code
  import    Buat entri usulan (reviewed: false) dari worklog ke dokumen
            --doc <file.json>   dokumen tujuan (wajib)
            --month YYYY-MM     bulan yang diimpor (default: periode dokumen)
  backfill  Isi hari yang terlewat dari reflog & commit lokal (read-only)
            --from YYYY-MM-DD   default: tanggal 1 bulan ini
            --to YYYY-MM-DD     default: kemarin
            --doc <file.json>   opsional (daftar repo & pola ticket)
  install-scheduler    Pasang snapshot otomatis tiap hari kerja + saat login (cron / launchd / Task Scheduler)
            --time HH:mm        default 16:45
            --doc <file.json>   salin daftar repo ke ~/.timesheet/config.json
            --dry-run           tampilkan saja, tanpa memasang
  uninstall-scheduler  Hapus jadwal tersebut
  vscode-task          Tampilkan snippet tasks.json (level user) untuk snapshot saat folder dibuka
  doctor    Periksa repo, email git, folder worklog, pola ticket dan scheduler
            --doc <file.json>   opsional
  help      Tampilkan bantuan ini

Folder data: $TIMESHEET_HOME atau ~/.timesheet
`;

/** Default time of the daily snapshot (PROMPT §12.4). */
export const DEFAULT_SNAPSHOT_TIME = "16:45";

export const CRON_MARKER_START = "# >>> timesheet-builder snapshot >>>";

export const CRON_MARKER_END = "# <<< timesheet-builder snapshot <<<";

/** Delay after boot before the login snapshot, in seconds (repos on slow mounts). */
export const LOGIN_DELAY_SECONDS = 120;

export const LAUNCHD_LABEL = "id.timesheet-builder.snapshot";

export const SCHTASKS_DAILY = "TimesheetBuilder Snapshot";

export const SCHTASKS_LOGON = "TimesheetBuilder Snapshot (login)";

export const SCHEDULER_LOG_FILE = "scheduler.log";
