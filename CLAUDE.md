# CLAUDE.md

Timesheet Builder: a 100% client-side app (plus a local Node CLI in `packages/cli` for automation) that builds the monthly consultant timesheet + evidence PDF in a
fixed format (reference: `src/assets/BHN II - Timesheet October.pdf`). No backend, no database: one document =
one `.json` file (Word-like New / Open / Save / Save As). Built on the former QuoteFlow template.

- Product spec: `docs/PROMPT.md` (source of truth for features and document layout)
- Phase plan & status: `docs/PLAN.md`
- Architecture decisions: `docs/DECISIONS.md` (record every new non-obvious decision here)

## Stack

React 19 + TypeScript 6 + Vite 8, Redux Toolkit, Ant Design 6, Tailwind 4, react-hook-form, Zod 4,
Jest 30 + Testing Library, Playwright. No router, no HTTP layer.

## Commands

```bash
npm run dev            # Vite on 127.0.0.1:5173
npm run build
npm run lint           # ESLint (must be 0 errors)
npx tsc -p tsconfig.app.json --noEmit
npm test               # jest --runInBand; coverage threshold 70% global
npx jest path/to/file.test.tsx            # single test
npx jest -u path/to/X.component.snap.tsx  # update a snapshot
npx playwright test    # e2e (e2e/tests)
npm run build:cli      # bundle the `timesheet` CLI → packages/cli/dist/timesheet.mjs
npx tsc -p tsconfig.cli.json --noEmit     # type-check the CLI
```

## Code convention (mandatory)

Before writing, changing, reviewing or testing code, use the `code-convention` skill
(`.claude/skills/code-convention/SKILL.md`). The source of truth is `FE_Code_Convention_React.md`; if the
script cannot find it, pass `--doc` or set `CODE_CONVENTION_DOC`:

```bash
python3 .claude/skills/code-convention/scripts/convention_rag.py query "<topic>"
python3 .claude/skills/code-convention/scripts/convention_rag.py section 4.3
```

Project-specific decision: no lodash; fallbacks use Zod `.default()` / `.prefault()` once upstream.

## Layout

| Path | Role |
|---|---|
| `src/main.tsx` | Root: Redux `Provider` → `ThemeProvider` → `App` |
| `src/App.tsx` | Renders `modules/timesheet-builder` (single screen) |
| `src/modules/<feature>/` | Feature logic using the module file pattern (below) |
| `src/modules/timesheet-builder/` | Page shell: top bar, split view (input 2fr / preview 3fr), tabs Aktivitas · Evidence · Hari khusus · Pengaturan · Cek export; navigation from a check item to its tab/element (`getNavigationPlan`) |
| `src/modules/{period-panel,entry-form,entry-list,day-overrides,profile-settings,document-preview}/` | Input panel sections and the fit-width live preview; each binds to the store through its `.hook.ts` |
| `src/modules/evidence-panel/` | Evidence tab: per-date left/right slots, upload / drag & drop / paste (auto-blur), replace, swap, blur, remove, document size warning |
| `src/modules/export-check/` | "Cek export" tab: month summary + clickable errors/warnings from `selectValidationReport` |
| `src/modules/export-pdf/` | Export PDF button (+ Ctrl/Cmd+P), blocked-by-errors dialog, print-only `.print-root` portal of the same `<TimesheetDocument>`; print CSS in `src/index.css` |
| `src/modules/blur-editor/` | Blur editor modal: whole image or drawn areas, blur or pixelate; original only in memory |
| `src/modules/import-review/` | "Review" tab: automatic `reviewed: false` entries per week/date — accept, edit, merge, reject, accept week; import command to copy |
| `src/modules/automation-settings/` | Ticket → task name map and watched repositories (stored in `doc.automation`) |
| `packages/cli/src/` | `timesheet snapshot / import / doctor` (Node). Read-only git allow-list, worklog `~/.timesheet/worklog.jsonl`, atomic doc write + `.lock`; reuses `src/` parser via `@/` |
| `src/modules/edit-history/` | Undo/redo buttons + Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y |
| `src/modules/file-menu/` | Word-like New / Open / Open last / Reload from disk / Save / Save As (refuses to overwrite a file changed on disk), status indicator, autosave (file or IndexedDB draft), draft recovery, Ctrl/Cmd+S/O shortcuts, beforeunload |
| `src/modules/timesheet-document/` | The A4 output (timesheet, signature, evidence cover, evidence pages). One tree for preview and PDF; geometry in pt in `TimesheetDocument.config.ts`, measured from the reference PDF |
| `src/components/<Name>/` | Shared UI primitives (Button, Input, Select, Modal, ConfirmModal, Tabs, …) |
| `src/constants/timesheet.constant.ts` | Fixed document labels, English month names, evidence capacities |
| `src/types/timesheet.type.ts` | Zod schemas + `z.infer` types for the document file (`schemaVersion`) |
| `src/libs/utils/date.util.ts`, `timesheet-engine.util.ts` | Pure engine: month dates, weekend, formatters, table rows, evidence pagination (3 then 4) and `Evidence Page N` numbering |
| `src/libs/utils/timesheet-document.util.ts` | `parseTimesheetDoc` (the single upstream fallback), `migrateDoc`, `serializeTimesheetDoc`, `createEmptyDoc`, `getDefaultDocFileName` |
| `src/libs/unit-test.ts` | The only allowed test import: re-exports RTL (+ `within`), `renderWithStore`, `createStoreWrapper`, `test.assertSnapshots(Component, configs, { wrapper })` |
| `src/store/` | `makeStore()` (theme + `timesheet` + `file` slices), typed hooks, `ThemeProvider`. `timesheet.slice.ts` holds the whole document, `savedDoc` (dirty = `doc !== savedDoc`), every edit action, undo/redo history (`timesheet.history.ts`, edits recorded by the wrapped default-export reducer) and `selectValidationReport`; `file.slice.ts` holds file name/handle status |
| `src/libs/utils/` | Shared logic: `date`, `date-option`, `timesheet-engine`, `timesheet-mutation`, `timesheet-document`, `entry-validation`, `file`, `file-system` (FS Access + download fallback), `draft-storage` (idb-keyval), `file-handle.registry` (current handle, outside Redux), `image` (resize, full blur, JPEG), `document-size`, `timesheet-validation` (export check + month summary), `anchor` (DOM ids the check navigates to) |
| `src/hooks/` | `useElementWidth` (preview zoom), `useKeyboardShortcuts`, `useBeforeUnload`, `usePrintTitle` (PDF file name) |
| `src/fixture/timesheet-2026-10.sample.json` | October 2026 real data for seed & golden test |
| `src/fixture/canvas.fixture.ts` | `installFakeCanvas()` — fake 2D canvas + `createImageBitmap` for jsdom |
| `src/fixture/file-handle.fixture.ts` | `makeFileHandle()` fake `DocumentFileHandle` |
| `src/fixture/timesheet.fixture.ts` | `loadOctoberDoc()`, `loadOctoberDocWithEvidence()`, `makeDocStore()`, `makeEmptyOctoberStore()`, `SAMPLE_IMAGE` for tests |
| `src/assets/` | `ifg-logo.png`, reference PDF |
| `docs/design-system/` | UI foundations for the app chrome (not the A4 pages) |

Path alias: `@/*` → `src/*` (Vite, tsconfig, Jest).

## Module file pattern

```
X.container.tsx   # calls hooks, single upstream fallback, maps props
X.component.tsx   # pure UI, props only, no hooks
X.hook.ts         # useState/useEffect/useMemo/useCallback
X.wrapper.tsx     # Suspense/boundaries/providers only (optional)
X.type.ts         # Zod schemas + z.infer types (optional)
X.config.ts       # static constants (optional)
X.util.ts / X.helper.ts(x)  # pure / view helpers (+ test)
*.test.ts(x), *.snap.tsx    # unit + snapshot tests (__snapshots__/)
index.ts          # exports the entry (wrapper or container)
```

## Gotchas

- Hard rules from the spec: A4 output text/labels are fixed (keep the typo `Consultan Role`); UI language is
  Indonesian, document language English; never send data or images to any server; original (unblurred)
  `code` evidence must never be written to the `.json` file — `code` images are blurred on canvas pixels in
  `processEvidenceImage` before they reach the store.
- One `<Page>` implementation serves both preview and PDF export; never fork the layout. The print copy is a
  second mount of the same component, so whole-page tests find two `timesheet-document`s — scope queries with
  `within(region "Pratinjau dokumen")` or `within(getByTestId("print-root"))`.
- New edit actions in `timesheet.slice.ts` must be added to `isUndoableAction`, or they bypass undo history.
- CLI tests start with `/** @jest-environment node */`; Node core errors fail `instanceof Error` inside Jest, so
  check `error.code` by duck typing. The CLI must never run a git write command or read file contents.
- Do not run plain `eslint --fix` on strict files: `jsdoc/require-jsdoc` auto-inserts empty JSDoc stubs. Use
  `npx eslint --fix --rule '{"jsdoc/require-jsdoc":"off"}' <path>` to sort imports, then `npx eslint <path>`.
- Per-row handlers read `data-*` attributes (`data-entry-id`, `data-field`, …) instead of inline arrows (§4.4).
- ESLint strict rules apply to `src/App.tsx`, `src/modules/**`, `src/libs/utils/**`, `src/types/**`, `src/constants/**`, `src/hooks/**`, `src/store/timesheet.*`, `src/store/file.*`. Ambient `*.d.ts` files may use `interface` (declaration merging).
- Jest setup mocks `idb-keyval` with an in-memory map cleared before each test (jsdom has no IndexedDB).
  Await async file work in tests before they end, or remembered handles leak into the next test.
- Jest matches `*.test.ts(x)` / `*.snap.ts(x)` under `src/` and `*.test.ts` under `packages/*/src`. Coverage excludes `*.type`,
  `*.config`, `index`, `*.wrapper`, `*.style` and `src/types`. JSON imports work in Jest (`resolveJsonModule`).
- Git: work on a feature branch; PRs target `development`. Commit format
  `<type>(<scope>): [BIT-<n>] <summary>` (see convention Section 10).
