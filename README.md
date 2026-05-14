# Floating Lighthouse — WC26

A mobile-first interactive web app for the **FIFA World Cup 2026** (USA · Canada · Mexico · 11 June – 19 July 2026 · 48 teams · 104 matches).

Not another scoreboard — a focused, single-tournament app. Pick a team and the entire UI repaints in that team's jersey colors via CSS custom properties and a WebGL fbm-smoke shader that tints the whole canvas.

**Live:** [world-cup-2026-rouge.vercel.app](https://world-cup-2026-rouge.vercel.app)

## Features

- **48-team picker** with full jersey re-theming on the fly (primary / secondary / accent / WCAG-aware ink)
- **Today hero** — countdown to opener (Mexico vs South Africa, Estadio Azteca, 22:00 IL on 11 June)
- **Matches** — grouped by Israel-local matchday (a Mexico City evening match is an Israel pre-dawn match the next day)
- **Teams** — 48 tiles, tap to select + navigate
- **Bracket** — 32 knockout matches, round-jumper, predictions persist to `localStorage`
- **Match detail** — lineups, isometric pitch view, news strip
- **Me** — your selected team, your bracket predictions
- **WebGL2 fbm smoke** background, tinted by team primary, paused under `prefers-reduced-motion`
- **PWA** — installable, service-worker cached, works offline after first load

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript** strict
- **Tailwind CSS v4** (tokens via `@theme inline`, no `tailwind.config.ts`)
- **framer-motion** (page transitions, countdown digit-roll — under `LazyMotion strict`)
- **WebGL2** — vanilla, no library
- Deployed on **Vercel** (edge functions for the data layer)

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Smoke-test the data layer:

```bash
curl http://localhost:3000/api/fixtures?date=2026-06-11
```

Should return the **Mexico vs South Africa** opener at Estadio Azteca.

## Data sources

- **[openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)** — full 104-match schedule (base layer)
- **[TheSportsDB](https://www.thesportsdb.com)** — enrichment: confirmed venues, kickoff ISOs, team badges, player photos
- **Google News RSS** — per-team news (no API key)

No paid APIs, no auth, no DB, no user accounts. Everything is `localStorage`.

## Project docs

- [CLAUDE.md](./CLAUDE.md) — full architecture notes, conventions, gotchas
- [AGENTS.md](./AGENTS.md) — agent guidance

## License

Personal project. Not affiliated with FIFA.
