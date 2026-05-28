# IRCOM Gemini Teacher MVP

Interactive bilingual (FR/EN) teaching app for IRCOM students, powered by Gemini.

The app maps directly to the training baseline and provides 3 lightweight modes:
- `coach`: guided prompt and copywriting support
- `exercise`: submission + critique + revision loop
- `sprint`: scenario-based agency simulation

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
| `GEMINI_MODEL` | No | Defaults to `gemini-3-flash-preview` (see `.env.example`). |

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
