# Skit Trainer (D2D)

Vite + React 19 + TypeScript memorization platform for performers. 15 learning tools, service layer architecture, multi-skit support.

## Quick Start

```bash
npm run dev    # Vite dev server on :5173
npm run build  # Production build (tsc + vite)
```

## Architecture

```
src/
├── types/          # Skit, Progress, User, Tools type definitions
├── design/         # tokens.ts, tokens.css, theme.tsx (dark mode)
├── services/       # Service layer (ISkitService, IProgressService, IUserService)
│   ├── types.ts    # Service interfaces
│   ├── local/      # localStorage implementations
│   ├── creativeHub.ts   # Creative Hub API client (localhost:8420)
│   └── ServiceProvider.tsx
├── data/           # Seed skits, methods config, skit-parser
├── lib/            # helpers (splitIntoSubChunks, getLinesForSection)
├── context/        # React contexts (App, Skit, Progress, User)
├── hooks/          # useKeyboardShortcuts, useCreativeHub
├── components/
│   ├── atoms/      # Button, Badge, ProgressBar, Modal
│   ├── molecules/  # SciencePanel, TabBar, SkitSwitcher, SectionSelect, SkitImporter
│   ├── tools/      # 15 tool components + StudyPlan
│   └── layout/     # AppShell
├── App.tsx         # Provider stack
├── main.tsx        # Entry point
└── index.css       # Tailwind v4 + design tokens
```

## Service Layer Pattern

Components never call localStorage or APIs directly. They use:
- `useServices()` → `{ skitService, progressService, userService }`
- `useCreativeHub()` → `{ available, speak, generateImage, generateAudio, askLLM, feedback }`

To swap from localStorage to a REST backend: change one file (`ServiceProvider.tsx`).

## Creative Hub Backend (localhost:8420)

The Creative Hub is a local AI production backend at `~/Projects/creative-hub/`.
Full spec: `/Users/patrickbpieper/Projects/creative-hub/CLAUDE.md`

**Start backend:** `~/Projects/creative-hub/scripts/start_services.sh all`

**API client:** `src/services/creativeHub.ts` — typed functions for all endpoints.
**Hook:** `src/hooks/useCreativeHub.ts` — React hook with availability detection and job polling.

### Available Generation Tools

| Endpoint | Engine | Speed | Use in Skit Trainer |
|---|---|---|---|
| `POST /generate/speech` | Coqui TTS (tacotron2) | ~3-4s/sentence | Read-aloud, Cue Lines audio |
| `POST /generate/image` | SDXL via ComfyUI | ~15-30s | Palace stop images, scene visualization |
| `POST /generate/audio` | MusicGen | ~70s/5s clip | Perform mode ambient, study music |
| `POST /generate/video` | Wan2.1 | ~2-4min | Future: animated scene walkthroughs |
| `POST /generate/text` | Ollama (llama3.2:3b) | ~2-4s | Auto-generate anchors/visuals, chunk labels, hints |

### Async Pattern

```ts
const { job_id } = await hub.generateSpeech({ text: "Hello" })
const job = await hub.pollJob(job_id)       // polls every 2s
const url = hub.getJobOutputUrl(job.id)     // serve the file
```

Or use the hook:
```ts
const { speak, available } = useCreativeHub()
if (available) {
  const audioUrl = await speak("Line of dialogue")
  // play it
}
```

### Feedback Loop

```ts
await hub.submitFeedback({ job_id: 7, rating: 4, comment: "good" })
const summary = await hub.getFeedbackSummary("speech")
```

## Adding a New Tool

1. Create `src/components/tools/NewTool.tsx`
2. Add entry to `METHODS` array in `src/data/methods.ts`
3. Add ToolId to the union type in `src/types/tools.ts`
4. Add case in `ToolContent` switch in `src/components/layout/AppShell.tsx`

## Key Data Structures

```ts
interface Skit { id, title, subtitle, speakers, chunks: Chunk[], palaceImages, macroSections }
interface Chunk { id: number, label: string, lines: Line[] }
interface Line { speaker: string, text: string, anchor?: string, visual?: string }
```

## Keyboard Shortcuts

- `1`-`9` — switch tools
- `[` / `]` — cycle skits
- `Space` — toggle RSVP playback (when not in input)

## Content Ingestion

`parseSkitFromText(raw, options?)` in `src/data/skit-parser.ts` handles:
- Speaker detection (`SPEAKER: text` pattern)
- Chunk splitting (blank line delimited)
- Auto-generated macro sections and labels

For AI-powered ingestion: use `POST /generate/text` with Ollama to preprocess raw text, then feed to `parseSkitFromText()`.

## Zazu project card (added 6/5) — env
Entry = this file (auto-loaded). Rendition/Memoria app (3-day escalating retrieval).
Run: cd here, `npm run dev` (Vite, typically http://localhost:5173). Backend = own Supabase.
Today: just start USING it, imperfect ok. Today's deliverable: Zazu/TODAY.md.

## Channel rules — READ BEFORE WRITING
This file is the communication channel for this project. Success = NO loose files created at every turn.
- Read this file first. Work IN the existing canonical files (one evolving file each).
- Loose/half-formed thoughts -> Zazu/INBOX.md (or a STATUS needs-processing block). Never a new loose file, never dated copies (_YYYY-MM-DD).
- New artifact truly needed? Give it a canonical name and note it here the same turn.
- Full STATUS + MAP added in the Sunday rollout; the nightly plumbing pass consolidates any strays.

## STATUS — 2026-06-10 PM (cross-device sync LIVE; verified end states)
**6/10 PM: sync enabled on prod.** Supabase Shuji (pdcrvpggskryptsdvnpe) restored from pause → ACTIVE_HEALTHY. Both migrations applied + verified via list_tables: `ladder_progress` + `challenge_attempts` live with RLS (the ladder migration file had invalid `CREATE POLICY/TRIGGER IF NOT EXISTS` syntax — fixed in repo + applied corrected). `skits.deleted_at` + `set_updated_at()` already existed. Profile auto-create trigger on signup confirmed (`on_auth_user_created`).
- **Env vars re-added** to Vercel prod from `.env.production.backup` — values cleaned (old ones had a trailing `\n` baked in). Main @ 7892939 auto-deployed; **memoria-woad.vercel.app verified live**: 200, bundle initializes Supabase (URL + anon key baked in), auth API healthy.
- **No auth wall.** New commit 7892939 adds the missing skip path: AuthScreen now has "Continue without account" (persists via `skit-trainer:auth-skipped`), skipped mode renders the full app on local services + a "Sign in to sync" pill (bottom-left) to come back. Headless-render verified: auth screen → skip → Library/Practice renders, no page errors.
- **Local→cloud on first login = SAFE.** `src/services/dataMigration.ts` runs once after first sign-in (AuthGuard effect): upserts local skits/stars/goals/tasks/streaks/progress into the account (`ignoreDuplicates`), flag `skit-trainer:migrated-to-cloud`. Phone-local progress is NOT lost on sign-in. ⚠ Unverified inline: actual signup→sync round-trip not exercised with a real account yet — first login on the phone is the live test. Note: migration is one-way device→cloud at first login; after login the device uses cloud services directly.
- **Per-device flow:** open memoria-woad.vercel.app → sign up once (email confirm may be required) → same login on Mac + phone = synced. Or "Continue without account" = old local-first behavior.
- ⚠ SSH key still broken on this Mac; remote = HTTPS (`gh auth git-credential`) — pushes work. dev + main both @ 7892939.
- Uncommitted (benign): `docs/` consolidation files + `_archive/` — route per channel rules later.
- **Legacy** skit-trainer-one.vercel.app (+ Vercel project `skit-trainer`) = old v1 — retire candidate, Patrick's call.
- **Migrate-to-own-Supabase-project** stays a later option (Shuji is shared with other apps' tables: decks/cards/articles etc.).
- **Minimal path (skit due Sat 6/13):** open memoria-woad.vercel.app on the phone → sign up (so Mac work syncs too) → Library → Import/Paste skit text (`SPEAKER: line`, blank lines = chunks) → Day 1 Familiarize. **Arabic RTL display untested** — paste one stanza first before committing the poem to this tool.
