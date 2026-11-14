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
  doctor    Periksa repo, email git, folder worklog dan pola ticket
            --doc <file.json>   opsional
  help      Tampilkan bantuan ini

Folder data: $TIMESHEET_HOME atau ~/.timesheet
`;
