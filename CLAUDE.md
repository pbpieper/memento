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

## STATUS — 2026-06-10 consolidation audit (verified end states)
**VERDICT: memoria-woad.vercel.app is LIVE and USABLE TODAY for the 3-day cycle.** Verified by headless render of the prod bundle: app mounts, Library + "Day 1: Familiarize" study plan + RSVP/First Letter/Fill-Blank/Free Write tools + Import/Paste all present in production.
- **Prod deploy** = `main` @ 24ba743 (Apr 8). Local-first: all data in **localStorage on the device used** — no sync, no auth in prod. Use ONE device for a whole 3-day cycle.
- **Supabase Shuji (prod DB, pdcrvpggskryptsdvnpe) is PAUSED/INACTIVE.** Prod app tolerates it (verified: renders with all network calls failing). Shuji-Staging active. Not blocking; decision pending (restore vs migrate to own `memoria` project — MEMORIA.md §2).
- **`dev` branch** (892658a, Apr 16: ladder infra, fill-gap retry, auth UI, crash fixes) was **never promoted to production** — exists only as a 401-protected preview. Local tree = origin/dev per local refs.
- ⚠ **SSH key broken on this Mac** (`git fetch` → Permission denied publickey). Blocks pushing any future work. Fix before next code change.
- Uncommitted (benign): this file's Zazu card + `docs/` consolidation files + `_archive/` — commit when SSH fixed.
- **Legacy** skit-trainer-one.vercel.app (+ Vercel project `skit-trainer`) = old v1, also points at paused Shuji. DUPLICATE — retire candidate, Patrick's call.
- **Minimal path TODAY (English skit, due Sat 6/13):** open memoria-woad.vercel.app on the device he'll use all 3 days → Library → Import/Paste skit text (`SPEAKER: line` format, blank lines = chunks) → Day 1 Familiarize. Plain lines (song lyrics / poem) import fine too (parser defaults speaker to PERFORMER). **Arabic RTL display untested** — paste one stanza first to verify before committing the poem to this tool.
- Do NOT promote dev→main mid-cycle; ship after Sunday.
