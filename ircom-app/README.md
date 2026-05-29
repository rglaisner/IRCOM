# Ircom — Studio IA (Management & Communication)

Consumer-grade bilingual (FR/EN) learning studio for IRCOM students. Visual identity aligned with [ircom.fr](https://www.ircom.fr/).

## Modes (4 formation blocks — 12 h)

| Block | Course (theory) | Atelier (practice) | Sprint |
|-------|-----------------|--------------------|--------|
| 1 | `/coach?bloc=1` | `/exercise?bloc=1` | — |
| 2 | `/coach?bloc=2` | `/exercise?bloc=2` | — |
| 3 | `/coach?bloc=3` | `/exercise?bloc=3` | — |
| 4 | — | — | `/sprint` |

Nav labels use **Course**, **Atelier** (workshop), and **Sprint**; URL paths remain `/coach` and `/exercise` for backward compatibility.

| Mode | Route | Focus |
|------|--------|--------|
| **Course** | `/coach` | Read-only curriculum — philosophy, lessons, illustrations per block |
| **Atelier** | `/exercise` | Voice-led scenarios, deliverable coaching, file attachments |
| **Sprint** | `/sprint` | Agency rush (2 h timer), crisis scenarios, Grand Oral |

## Capabilities

- **Gemini multi-agent pipeline** — role-specific prompts for brief coaching, copy critique, art direction, workshop facilitation, sprint facilitation, and oral examination
- **Voice briefing** — Gemini Live WebSocket audio with pause/resume, hand-raise Q&A, and text fallback via `/api/atelier/narrate`
- **Scenario-driven atelier** — per-block scenarios with structured briefs, deliverable checkpoints, and narration scripts (`content/atelier-scenarios.*.json`)
- **Multi-tool studio** — recommended tools (Claude, Firefly, Gemini, ChatGPT) with guided links and optional API keys
- **Multimodal exercise** — image upload for visual critique (art direction agent)
- **Sprint simulation** — scenario picker, rush timer, export kit (markdown), publish-ready quality meter
- **Session persistence** — progress tracked in localStorage; restart session from the header
- **Brand tokens** — Poppins, navy `#071554`, MCS blue `#3B74F7` — see `docs/brand-alignment.md`

## Agent roles

| Role | Triggered in |
|------|----------------|
| Brief coach | Course-adjacent coaching context |
| Copy critic | Atelier block 3 / script tab |
| Art director | Atelier block 2 / visual tab, or image upload |
| Atelier facilitator | Default atelier interactions |
| Sprint facilitator | Sprint interaction 1 |
| Oral examiner | Sprint interaction 2 (Grand Oral) |

## Pedagogical baseline

The MVP is grounded in:

- `../context_content/Formation_GenAI_IRCOM.md`
- `content/modules.{fr,en}.json` — block objectives, guardrails, evaluation criteria
- `content/course.{fr,en}.json` — course sections ingested from curriculum markdown
- `content/atelier-scenarios.{fr,en}.json` — hands-on scenarios with briefing steps
- `content/sprint-scenarios.{fr,en}.json` — crisis scenarios for block 4

Key educational guardrails:

- AI is an assistant, not the source of ideas
- Critique is mandatory (generic style, weak strategy, hallucination risk)
- Student output quality and strategic reasoning are prioritized

## Tech stack

- Next.js 16 (App Router)
- React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- `@google/genai` for Gemini (REST + Live API)
- Zod for request/response validation
- Playwright for E2E

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment — create `.env.local` in this directory:

```bash
# Required for live AI (server-only; never commit)
GEMINI_API_KEY=your_key_here

# Optional overrides
# GEMINI_MODEL=gemini-2.5-flash
# GEMINI_LIVE_MODEL=gemini-live-2.5-flash-preview
# VOICE_ENGINE=live
# ANTHROPIC_API_KEY=your_key_here
```

If no key is provided, the app uses safe local fallback responses so flows can still be tested.

3. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

Production: [https://ircom.vercel.app](https://ircom.vercel.app)

The GitHub repo root is not the Next.js app. In Vercel project settings, set **Root Directory** to `ircom-app` (required). The `ircom` project is linked to `rglaisner/IRCOM` on branch `main`; pushes to `main` trigger production deploys.

### Environment variables (Vercel dashboard)

| Variable | Required | Notes |
|----------|----------|--------|
| `GEMINI_API_KEY` | Yes (for live AI) | Server-only; never commit. Without it, `/api/teacher` returns demo fallback copy. |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash` (REST: coach, chat, narrate stream). |
| `GEMINI_LIVE_MODEL` | No | Defaults to `gemini-live-2.5-flash-preview` ([Live API](https://ai.google.dev/api) / BidiGenerateContent). |
| `GEMINI_TTS_MODEL` | No | Deprecated — not used for briefing. |
| `VOICE_ENGINE` / `NEXT_PUBLIC_VOICE_ENGINE` | No | Defaults to `live`. On Live failure, streams briefing text via `/api/atelier/narrate` only (no browser TTS). |
| `ANTHROPIC_API_KEY` | No | Optional in-app Claude copy pass (`/api/tools/claude`). |
| `ADOBE_FIREFLY_API_KEY` | No | Reserved for future Firefly integration; guided link always available. |

Apply variables to **Production** and **Preview** for consistent PR previews.

### Briefing voice troubleshooting

1. **Live audio:** DevTools → `POST /api/atelier/live-token` returns 200 and `token` starts with `auth_tokens/`. WebSocket uses `BidiGenerateContentConstrained` on `v1alpha`.
2. **Model:** Use a [Live-capable model](https://ai.google.dev/gemini-api/docs/models), e.g. `GEMINI_LIVE_MODEL=gemini-live-2.5-flash-preview`.
3. **Text fallback:** If Live fails, transcript still streams from `/api/atelier/narrate`; UI shows `voice-fallback-notice` and optional `voice-live-error` with the API reason.

### Preflight before pushing

```bash
npm ci
npm run build
npm run lint
```

## Core routes

- `/` — dashboard with per-mode progress (atelier + sprint)
- `/coach?bloc=1|2|3` — read-only course with section navigation
- `/exercise?bloc=1|2|3&scenario=<id>` — atelier with scenario picker and voice briefing
- `/sprint` — agency sprint with crisis scenarios and rush timer

## API routes

| Route | Purpose |
|-------|---------|
| `/api/teacher` | Typed server endpoint orchestrating Gemini prompts |
| `/api/teacher/stream` | Streaming variant for teacher responses |
| `/api/atelier/live-token` | Ephemeral token for Gemini Live WebSocket |
| `/api/atelier/narrate` | Text-streaming briefing fallback |
| `/api/atelier/chat` | Context-aware Q&A during voice sessions |
| `/api/atelier/speak` | TTS endpoint (deprecated in product flow) |
| `/api/tools/claude` | Optional Claude copy pass |
| `/api/tools/status` | Tool registry with API key availability |

## Content pipeline

Course sections are ingested from curriculum markdown in `../context_content/`:

```bash
npx tsx scripts/ingest-curriculum.ts --write
```

This merges extracted sections into `content/course.{fr,en}.json`.

## Validation strategy

- **Unit tests** — progress tracking, session reset, markdown parsing, curriculum content
- **7 Playwright E2E tests** with API mocking:
  - language switch + context continuity
  - course mode read-only navigation
  - atelier scenario pick, narration, and deliverable submit
  - sprint scenario, timer, chat, and two feedback interactions
  - restart session clears progress
  - cross-mode persistence (4 atelier + sprint interactions)
  - mobile viewport (360 px) without horizontal scroll

## Run checks

```bash
npm run lint
npm run test:e2e
```

If Playwright browser binaries are missing:

```bash
npx playwright install
```
