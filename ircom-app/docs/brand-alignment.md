# IRCOM brand alignment (learning app)

Reference portal: [ircom.fr](https://www.ircom.fr/) — e.g. [Licence Humanités & Science politique](https://www.ircom.fr/formations/licence-science-politique-humanites/).

Target program: **Management et Communication Stratégique** (MCS, Bac+5 alternance).

## Layout pattern (from portal)

| Zone | Background | Text |
|------|------------|------|
| Header / nav band | `#071554` (navy) | White `#ffffff` |
| Page content | `#ffffff` | Body `#212529`, headings `#071554` |
| Subtle panels | `#f8f9fa` | Body `#212529`, secondary `#495057` |

Do **not** use navy body text on navy panels, or light grey text on light grey panels. The app stays **light mode only** (`color-scheme: light`).

## Color tokens

| Token | Hex | Usage |
|-------|-----|--------|
| `--ircom-navy` | `#071554` | Header background, headings on white |
| `--ircom-blue` | `#3B74F7` | Primary CTA, active nav on header |
| `--ircom-text` | `#212529` | Body copy on white (portal default) |
| `--ircom-text-secondary` | `#495057` | Supporting copy, checklist items |
| `--ircom-page` / `--ircom-surface` | `#FFFFFF` | Main and card backgrounds |
| `--ircom-panel-subtle` | `#F8F9FA` | Inset panels (brief preview, tool router) |
| `--ircom-border` | `#DEE2E6` | Card and input borders |
| Accent colors | red / orange / green | Block accents only — not for small text on white |

## Typography

- **Family:** Poppins (300–700) via `next/font/google`
- **Headings on content:** 600–700, `--ircom-text-heading`
- **Body:** 400, `--ircom-text`, line-height ~1.6

## Voice

- Tagline context: *Humanités et Management*
- Professional, human, alternance-ready — not startup hype

## Implementation

CSS variables: `ircom-app/styles/tokens.css`, imported from `app/globals.css`.

Semantic classes: `.ircom-heading`, `.ircom-body`, `.ircom-secondary`, `.ircom-panel-subtle`, `.ircom-input`.
