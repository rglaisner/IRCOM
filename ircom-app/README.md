# Ircom — Studio IA (Management & Communication)

Consumer-grade bilingual (FR/EN) learning studio for IRCOM students. Visual identity aligned with [ircom.fr](https://www.ircom.fr/).

## Modes (4 formation blocks)

| Block | Route | Focus |
|-------|--------|--------|
| 1 | `/coach` | Agency brief & strategic copy |
| 2–3 | `/exercise` | Art direction + short-format (tabs) |
| 4 | `/sprint` | Agency rush, deliverables, Grand Oral |

## Capabilities

- **Gemini** multi-agent pipeline (brief coach, copy critic, art director, sprint facilitator, oral examiner)
- **Multi-tool studio**: recommended tools (Claude, Firefly, Gemini) with guided links + optional API keys
- Multimodal exercise (image upload for visual critique)
- Sprint timer, export kit (markdown), publish-ready quality meter
- Brand tokens: Poppins, navy `#071554`, MCS blue `#3B74F7` — see `docs/brand-alignment.md`

## Pedagogical baseline

The MVP is grounded in:
- `../context_content/Formation_GenAI_IRCOM.md`

Key educational guardrails:
- AI is an assistant, not the source of ideas
- Critique is mandatory (generic style, weak strategy, hallucination risk)
- Student output quality and strategic reasoning are prioritized

## Tech stack

- Next.js App Router
- TypeScript (strict mode)
- `@google/genai` for Gemini
- Playwright for E2E

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

Then set `GEMINI_API_KEY` in `.env.local`.

If no key is provided, the app uses a safe local fallback response so flows can still be tested.

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

### Briefing voice troubleshooting

1. **Live audio:** DevTools → `POST /api/atelier/live-token` returns 200 and `token` starts with `auth_tokens/`. WebSocket uses `BidiGenerateContentConstrained` on `v1alpha`.
2. **Model:** Use a [Live-capable model](https://ai.google.dev/gemini-api/docs/models), e.g. `GEMINI_LIVE_MODEL=gemini-live-2.5-flash-preview`.
3. **Text fallback:** If Live fails, transcript still streams from `/api/atelier/narrate`; UI shows `voice-fallback-notice` and optional `voice-live-error` with the API reason.
| `ANTHROPIC_API_KEY` | No | Optional in-app Claude copy pass (`/api/tools/claude`). |
| `ADOBE_FIREFLY_API_KEY` | No | Reserved for future Firefly integration; guided link always available. |

Apply variables to **Production** and **Preview** for consistent PR previews.

### Preflight before pushing

```bash
npm ci
npm run build
npm run lint
```

## Core routes

- `/` dashboard with per-mode progress
- `/coach` interactive coach mode
- `/exercise` iterative exercise mode
- `/sprint` agency sprint mode
- `/api/teacher` typed server endpoint that orchestrates Gemini prompts

## Validation strategy implemented

- Unit-level validation via schema checks in request/response boundaries
- 5 focused Playwright E2E tests with API mocking:
  - language switch + context continuity
  - 2 interactions in coach mode
  - 2 interactions in exercise mode
  - 2 interactions in sprint mode
  - cross-mode persistence for all 6 interactions

## Run checks

```bash
npm run lint
npm run test:e2e
```

If Playwright browser binaries are missing:

```bash
npx playwright install
```
