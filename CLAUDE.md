# CLAUDE.md

Timesheet Builder: a 100% client-side app that builds the monthly consultant timesheet + evidence PDF in a
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
| `src/App.tsx` | Single-screen app root |
| `src/modules/<feature>/` | Feature logic using the module file pattern (below) |
| `src/modules/timesheet-document/` | The A4 output (timesheet, signature, evidence cover, evidence pages). One tree for preview and PDF; geometry in pt in `TimesheetDocument.config.ts`, measured from the reference PDF |
| `src/components/<Name>/` | Shared UI primitives (Button, Input, Select, Modal, ConfirmModal, Tabs, …) |
| `src/constants/timesheet.constant.ts` | Fixed document labels, English month names, evidence capacities |
| `src/types/timesheet.type.ts` | Zod schemas + `z.infer` types for the document file (`schemaVersion`) |
| `src/libs/utils/date.util.ts`, `timesheet-engine.util.ts` | Pure engine: month dates, weekend, formatters, table rows, evidence pagination (3 then 4) and `Evidence Page N` numbering |
| `src/libs/utils/timesheet-document.util.ts` | `parseTimesheetDoc` (the single upstream fallback), `migrateDoc`, `serializeTimesheetDoc`, `createEmptyDoc`, `getDefaultDocFileName` |
| `src/libs/unit-test.ts` | The only allowed test import: re-exports RTL + `test.assertSnapshots` |
| `src/store/` | `configureStore` (theme slice), typed hooks, `ThemeProvider` |
| `src/fixture/timesheet-2026-10.sample.json` | October 2026 real data for seed & golden test |
| `src/fixture/timesheet.fixture.ts` | `loadOctoberDoc()`, `loadOctoberDocWithEvidence()`, `SAMPLE_IMAGE` for tests |
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
  `code` evidence must never be written to the `.json` file.
- One `<Page>` implementation serves both preview and PDF export; never fork the layout.
- ESLint strict rules apply to `src/App.tsx`, `src/modules/**`, `src/libs/utils/**`, `src/types/**`, `src/constants/**`.
- Jest only matches `*.test.ts(x)` and `*.snap.ts(x)` under `src/`. Coverage excludes `*.type`,
  `*.config`, `index`, `*.wrapper`, `*.style` and `src/types`. JSON imports work in Jest (`resolveJsonModule`).
- Git: work on a feature branch; PRs target `development`. Commit format
  `<type>(<scope>): [BIT-<n>] <summary>` (see convention Section 10).
