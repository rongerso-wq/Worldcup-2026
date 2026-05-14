@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Floating Lighthouse** — a mobile-first interactive web app for FIFA World Cup 2026 (June 11 – July 19, 2026 · USA/Canada/Mexico · 48 teams · 104 matches). Built for Roni Gershonovitch. Goal isn't another scoreboard — it's a focused, jersey-themed single-tournament app. Each user picks a team and the entire UI repaints in that team's colors via CSS custom properties + a WebGL fbm-smoke shader that tints the whole canvas.

**Phased build plan** (source of truth for what to build next): `C:\Users\litbe\.claude\plans\i-want-to-built-floating-lighthouse.md`. Phases 1–9.5 shipped (Phase 9 = motion + haptics + service worker + a11y/perf polish; Phase 9.5 layered in the Smith/Gourges audit fixes — CSP, fetch byte caps, focus trap, theme-bootstrap script, contrast tokens, bracket round-jumper). **Phase 10 (Vercel deploy) shipped.**

**Phase 11 (Triad-debate audit pass) shipped.** A 3-agent audit (Security · UX/a11y · Product) was run against the deployed app and the strict 2/3 + loose 2/3 consensus items + selected 1/3 outliers were implemented:
- Per-IP rate limit on every `/api/*` route ([lib/ratelimit.ts](lib/ratelimit.ts)) — 30 req/min/IP, in-memory token bucket
- CSP nonce migration ([middleware.ts](middleware.ts)) — removed `'unsafe-inline'` from script-src, replaced with per-request `'nonce-XXX' 'strict-dynamic'`
- a11y polish: `prefers-reduced-motion` on the countdown digit-roll, `aria-current="step"` on bracket round-jumper, `--team-ink-hi` focus rings (visible on pale kits), MatchCard secondary text 10px→12px + line-clamp-2, NewsStrip retry/CTA on error+empty
- UX: scroll-snap + edge-fade on TeamPickerStrip, first-time `FirstTimeHero` on `/` with sessionStorage skip
- Product: ICS calendar export on `/me` for your team's group fixtures ([lib/ics.ts](lib/ics.ts) + [components/MyFixturesCard.tsx](components/MyFixturesCard.tsx))

**Live deployment:**
- Production: <https://world-cup-2026-rouge.vercel.app>
- GitHub: <https://github.com/rongerso-wq/Worldcup-2026> (auto-deploys to Vercel on push to `main`)
- Vercel project: `world-cup-2026` under `rongerso-wqs-projects` scope
- Deployment Protection is **on** by default (personal-scope project). If you need a publicly shareable URL without login, disable it in Project Settings → Deployment Protection.

**Manual deploy** (without going through GitHub) — from the project folder: `vercel deploy` (preview) or `vercel deploy --prod` (promote).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start Turbopack dev server. Port floats: prefers :3000, falls back. Check the `- Local: http://localhost:XXXX` boot line. If multiple stale `node` processes are holding ports, kill them before starting fresh — HMR on a stale server is a silent-bug factory. |
| `npm run build` | Production build via Next 16. TS strict; build will fail on any type error. |
| `npm start` | Run prod build locally (serves with the per-request CSP from `middleware.ts` + static security headers from `next.config.ts`). |
| `npm run lint` | ESLint flat config. |

No test runner. Smoke-test the data layer: `curl http://localhost:XXXX/api/fixtures?date=2026-06-11` should return the **Mexico vs South Africa opener at Estadio Azteca**, `kickoffISO: "2026-06-11T19:00:00"` (= **19:00 UTC = 22:00 IL** — see Israel-time section).

## Stack

- **Next.js 16.2.6** (App Router) on Turbopack. Route handler params are `ctx.params: Promise<...>` and must be awaited; client page params use `use(params)` from React.
- **React 19** + **TypeScript** strict.
- **Tailwind CSS v4** — design tokens live in `app/globals.css` via `@theme inline { ... }`, *not* a JS config. There is no `tailwind.config.ts`.
- **next/font** for Inter (body — currently nearly vestigial; most labels use display), Bebas Neue (display, FIFA-scoreboard look), JetBrains Mono.
- **framer-motion** — wired for page transitions ([components/PageTransition.tsx](components/PageTransition.tsx)) and the countdown digit-roll, **wrapped in `<LazyMotion features={domAnimation} strict>`** via [components/MotionProvider.tsx](components/MotionProvider.tsx). Use `m.div` / `m.span` from `"framer-motion"`, not `motion.x` — strict mode throws on the heavier bundle. Saves ~30 KB gz on initial JS.
- **WebGL2** (no library) — custom fbm fragment shader for the smoke background.
- **Service worker** ([public/sw.js](public/sw.js)) — registered in production only via [components/ServiceWorkerRegister.tsx](components/ServiceWorkerRegister.tsx).
- Deployment target: **Vercel**.

## Architecture

### Data layer — merge, don't fall back

Three providers; openfootball is the schedule of record, TheSportsDB enriches:

```
openfootball/worldcup.json (BASE — full 104-match schedule, knockout placeholders)
        ⊕ overlay
TheSportsDB (ENRICHMENT — confirmed venues, kickoff ISOs, badges, player photos)
        ⊕ separate channel
Google News RSS (per-team news, no key)
```

- [lib/data.ts](lib/data.ts) — single entry point. Two distinct patterns coexist:
  - **Merge** (`getAllFixtures`, `getMatch`, `getTeamFixtures`): start from openfootball (OF) as the base, overlay TheSportsDB (SDB) fields keyed on `date|home|away`. SDB enriches `kickoffISO`, `venue`, badges, scores; OF keeps the stable id. Use this anywhere you need the full 104-match list or a specific match by id.
  - **Fallback** (`getFixturesByDate`): try SDB live first, fall back to OF on failure or empty result. **No merge.** This means a successful SDB fetch won't pick up OF-only fields (knockout placeholders) and vice versa. If you need a merged single-date view, pull from `getAllFixtures` and filter — don't add merge logic to `getFixturesByDate`.
- [lib/cache.ts](lib/cache.ts) — module-level `Map`, 5-min TTL for fixtures, 30-sec for live, 24-hr for players. News has its own 30-min cache in the route handler.
- [lib/providers/thesportsdb.ts](lib/providers/thesportsdb.ts) — league ID `4429`, season `2026`. **All fetches now go through `lib/fetch-limited.ts`** — streamed with a 2 MB byte cap and 8 s timeout via AbortController. Throws on cap-exceed.
- [lib/providers/openfootball.ts](lib/providers/openfootball.ts) — reads [data/worldcup-2026.json](data/worldcup-2026.json) at build time. No network.
- TheSportsDB national-team rosters are NOT reliable — `lookup_all_players.php` returns just the manager. Player lookups go through `searchplayers.php` by individual name, which is why [lib/stars.ts](lib/stars.ts) carries a curated star list per team.

### Israel timezone — single source of truth

The user lives in Israel. **All kickoff times and matchday grouping happen in Asia/Jerusalem.**

- [lib/datetime.ts](lib/datetime.ts) — `parseKickoffMs(input)` handles SDB bare ISO (appends `Z`) and openfootball offset strings; returns UTC ms epoch. `formatIsraelTime` / `formatIsraelDate` / `israelIsoDate` use `Intl.DateTimeFormat` with `timeZone: "Asia/Jerusalem"`.
- **A Mexico City evening match can be an Israel pre-dawn match on the next calendar day.** That's why `MatchCard` and the matches page key off `m.ilDate` (Israel-local) for grouping — not `m.date` (source-of-truth schedule date). Failing to use `ilDate` is a silent UX bug.

### Edge API routes (hardened)

All routes under `app/api/` are `runtime = "edge"`:

- [/api/fixtures](app/api/fixtures/route.ts) — `?date=YYYY-MM-DD` (regex-validated). 400 on bad date, 502 on upstream fail.
- [/api/live](app/api/live/route.ts), [/api/match/[id]](app/api/match/[id]/route.ts), [/api/team/[code]](app/api/team/[code]/route.ts), [/api/player](app/api/player/route.ts) — all length-cap their query/path params and return generic `fetch_failed` / `bad_request` strings on error. **Never echo upstream `Error.message`** — that's how internal URLs and statuses leak.
- [/api/news/[code]](app/api/news/[code]/route.ts) — Google News RSS proxy. **Hardened against ReDoS**: 1 MB upstream cap, per-item 20 KB regex bound, per-field 600-char capture, iteration cap (200 items), entity-decode capped at 100 KB with codepoint guard. 30-min in-memory cache.

The cache is module-level `Map`-based, so cold Edge invocations get a fresh cache — acceptable because all backing services are CORS-clean and free.

**Per-IP rate limit** ([lib/ratelimit.ts](lib/ratelimit.ts)): every route calls `checkRateLimit(req)` as its first statement. Default: 30 requests / 60 s, keyed on `x-forwarded-for` (left-most). On exhaustion returns 429 with `Retry-After`. The bucket map is module-level + LRU-capped at 2000 entries; resets per cold Edge instance, so N warm instances effectively multiply the budget. Acceptable trade-off vs. Upstash/KV at current traffic — swap when traffic justifies it without touching route code.

### Jersey theming — runtime CSS-var swap + WebGL canvas

The visual system pivots on a single React context plus a blocking inline bootstrap script:

- **Theme bootstrap in [app/layout.tsx](app/layout.tsx):** a tiny inline `<script>` in `<head>` reads `wc26.myTeam` from `localStorage` and applies `--team-primary`, `--team-secondary`, `--team-accent`, `--team-ink`, `--team-ink-hi` to `documentElement` **before React hydrates**. Eliminates the neutral→team flash. The team color table is computed server-side at build from `TEAMS` (in `lib/teams.ts`) and stringified into the script body.
- [components/JerseyThemeProvider.tsx](components/JerseyThemeProvider.tsx) — client provider: `{ team, hasTeam, setTeamCode, clearTeam }`. `setTeamCode` triggers `haptics.select()`. Persists to `localStorage` as `wc26.myTeam`. **Validates the stored code on read** (regex `^[A-Z—-]+$`, max 8 chars, must resolve via `getTeam`) — purges bad blobs.
- `applyTheme(team)` also sets `--team-ink-hi`, a guaranteed-contrast foreground (black or white) picked via WCAG luminance in [lib/contrast.ts](lib/contrast.ts) `pickInkHi(hex)`. Use this on surfaces that fill with team gradient (active filter chips, gradient pills) — `team.ink` alone can drop below 3:1 on pale kits.
- [components/ThemedSmokeBackground.tsx](components/ThemedSmokeBackground.tsx) wraps the WebGL canvas. Passes `team.primary` × 3 to the shader. Smoke uses primary not secondary/accent — white/black-kit teams (ENG, GER) intentionally use red as primary so the smoke isn't washed.
- [components/ui/spooky-smoke-animation.tsx](components/ui/spooky-smoke-animation.tsx) — custom WebGL2 fbm shader, vanilla `gl.useProgram`. The rAF loop **pauses when the tab is hidden or `prefers-reduced-motion: reduce` matches**. On color-update the component force-renders one frame so paused-state team-switches still repaint the canvas (else the old jersey color sticks).
- [lib/teams.ts](lib/teams.ts) — 48 teams + `NEUTRAL_TEAM`. `findTeamByName(name)` is strict (returns `undefined` for placeholders); `getTeam(code)` falls back to `NEUTRAL_TEAM`.

**`hasTeam: false` is "neutral mode"** — silver-blue palette, no "Following" badges. Components must guard with `hasTeam` before reading `team.code` for filtering/highlighting; the neutral placeholder has code `"—"`.

The `card-dim`, `clip-fifa`, `clip-fifa-l`, `chip-glow`, `score-num` utilities in `globals.css` are the design-system primitives.

### Bracket logic

- [lib/bracket.ts](lib/bracket.ts) extracts the 32 knockout matches from openfootball at module load.
- `resolveSlot(slot, preds)` recursively walks `W##` / `L##` references back to the source match. Group placeholders (`1A`, `3A/B/C/D/F`) stop the recursion.
- `/bracket` page renders 6 columns (R32 · R16 · QF · SF · 3rd · F) at fixed 252 px width with a horizontal-scroll strip. **A round-jumper pill row sits above the strip** — tapping a round smooth-scrolls the strip to that column; on-scroll detection updates the active pill.
- Predictions persist to `localStorage` as `wc26.bracket`. **Read path validates shape**: must be an object, keys must be ints 1–200, values must be `"slot1"|"slot2"`. Bad blobs self-purge.

### Routes & layout

5-tab bottom-nav: Today (`/`) · Matches (`/matches`) · Teams (`/teams`) · Bracket (`/bracket`) · Me (`/me`). Detail routes: `/team/[code]`, `/match/[id]`.

The nav uses `bottom: max(1rem, env(safe-area-inset-bottom))` so it clears the iOS home indicator. `main` matches with `paddingBottom: calc(6rem + env(safe-area-inset-bottom))`.

[PageTransition](components/PageTransition.tsx) wraps `{children}` in the root layout — `framer-motion` `AnimatePresence mode="wait"` keyed on `pathname`, 220 ms fade + slide. The smoke canvas + tab nav sit **outside** the transitioned `main` so they don't re-render on route change.

### Components — important rules

- [components/MatchCard.tsx](components/MatchCard.tsx) is the canonical match-row component. **Grid layout** (`gridTemplateColumns: minmax(0,1fr) auto minmax(0,1fr)`), not flex — country names get the room they need on tight screens. Props: `m: MatchView`, `highlight?: boolean`, `showDate?: boolean` (pass `showDate={false}` on the matches page since its own date rail already says which day). Exports `toView(m)` (strict — drops placeholders) and **`toViewLoose(m)`** (returns TBD stand-ins for unknown slot names like `W73`, `1A` — use this in rails where silent drops would lie about the count).
- [components/PlayerCard.tsx](components/PlayerCard.tsx) is the FUT-style chemistry card. Fetches via `/api/player`. Images: `referrerPolicy="no-referrer"`, forced to `https://`. **No `crossOrigin` attribute** — TheSportsDB doesn't return CORS headers and adding it makes the browser refuse to render.
- [components/PlayerSheet.tsx](components/PlayerSheet.tsx) — bottom-sheet modal with **focus trap** (Tab cycles within the sheet), initial focus on the Close button, restore focus to the trigger on close. `Escape` is preventDefault'd. Same image rules as PlayerCard.
- [components/TodayHero.tsx](components/TodayHero.tsx) — countdown to opener. Digits are framer-motion animated (`AnimatePresence mode="popLayout"`), vertical roll on every tick. Font size is `clamp()`-based so 3-digit "days" doesn't overflow a 360 px viewport.
- [components/NewsStrip.tsx](components/NewsStrip.tsx) — horizontal-scroll news strip. Headlines tap-out to `target="_blank" rel="noopener noreferrer"` Google News URLs. Strips trailing ` - Source` suffix when `<source>` field is also present. Error + empty states offer a Retry button and a "See fixtures →" deep-link fallback so the strip is never a dead-end.
- [components/FirstTimeHero.tsx](components/FirstTimeHero.tsx) — compact card rendered on `/` only when `!hasTeam`. Six "popular" team chips (BRA/ARG/ENG/FRA/ESP/GER) + a "see all 48" deep-link to `/teams`. Dismiss persists for the session via `sessionStorage` key `wc26.heroDismissed` (the only `sessionStorage` key in the app). Picking a team also hides it via the parent `!hasTeam` gate.
- [components/MyFixturesCard.tsx](components/MyFixturesCard.tsx) — on `/me`, fetches `/api/team/[code]` and filters to group-stage matches (`!!m.group`). "Add to calendar" button calls `buildIcs` + `downloadIcs` from [lib/ics.ts](lib/ics.ts) to drop a single `.ics` (RFC 5545: CRLF, 75-octet folding, escape, UTC). 2-hour event window per match covers 90 min + halftime + extra-time buffer.
- Tapping a team tile on `/teams` **both selects the team and navigates** to `/team/[code]`. The `+` button (44×44 hit area with 28 px visual nub, `aria-pressed`) selects without navigating. Don't separate these flows again.

`main` is constrained to `max-w-md` — mobile-only by design.

## Conventions

- **Israel time everywhere user-visible**. Use the helpers in `lib/datetime.ts`. Never `new Date().toLocaleTimeString()` raw.
- **Group matches by `m.ilDate`, not `m.date`** anywhere a matchday rail is shown.
- **CSS custom properties beat Tailwind for theming**: `style={{ color: "var(--team-primary)" }}` not hardcoded hex.
- **Guard with `hasTeam`** before reading `team.code` / `team.flag` for filtering or highlighting.
- **Edge route params are async** (Next 16): `ctx: { params: Promise<{ id: string }> }`; `const { id } = await ctx.params`.
- **Match IDs are namespaced**: `sdb-{idEvent}`, `of-{date}-{team1}-{team2}-{index}`. Don't strip the prefix.
- **All upstream fetches must go through [lib/fetch-limited.ts](lib/fetch-limited.ts)** (`fetchText` / `fetchJson`). Raw `fetch().text()` will buffer arbitrary bytes into Edge memory.
- **API error responses are generic strings** (`fetch_failed`, `bad_request`, `not_found`). Never echo `(err as Error).message`.
- **Image tags pointing at TheSportsDB**: `referrerPolicy="no-referrer"` + force `https://`. Don't add `crossOrigin` unless reading pixels into canvas.
- **Haptics**: any "decisive" user action goes through [lib/haptics.ts](lib/haptics.ts) (`tap` / `pick` / `select` / `goal`). Respects `prefers-reduced-motion`, silently no-ops on iOS Safari.
- **Phased workflow**: ship one phase per turn, each phase ends with a verifiable artifact you can demo. Audit-fix batches (🔴 + 🟠) can be larger, but still verify a build.

## Security posture

- **CSP is per-request, set in [middleware.ts](middleware.ts)** — every response gets a fresh 16-byte base64 nonce. `script-src 'self' 'nonce-XXX' 'strict-dynamic'` (+ `'unsafe-eval'` in dev for Turbopack HMR). `'strict-dynamic'` lets Next's nonced bootstrap script transitively load its chunk URLs without each needing a nonce. `app/layout.tsx` is `async` and reads the nonce via `headers().get("x-nonce")` to apply it to the inline `THEME_BOOTSTRAP` `<script>`. **Side-effect: every page is now `ƒ Dynamic` (no static prerender)** — the nonce changes per request. Edge cache still kicks in for hot paths.
- Other directives in the same CSP: `default-src 'self'`, `connect-src 'self'`, `frame-ancestors 'none'`, `img-src 'self' data: blob: https://*.thesportsdb.com`, `worker-src 'self' blob:` for the SW, `style-src 'self' 'unsafe-inline'` (Tailwind v4 atomic classes inject inline runtime styles), `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`.
- Other security headers stay in [next.config.ts](next.config.ts) as static headers: `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy` (locks down sensors), HSTS in prod. Don't move CSP back into `next.config.ts` headers — that would re-collide with the middleware-set header.
- **No auth, no DB, no user accounts** — everything is localStorage. Both keys validate shape on read.
- **No persistence to a server.** No analytics. No outbound network beyond same-origin `/api/*` (which proxies to TheSportsDB / Google News).
- **Per-IP rate limit on every route** — see Edge API routes section.
- If you add a new image source, also extend `img-src` in the middleware CSP — otherwise it'll silently fail in prod.

## Service worker

[public/sw.js](public/sw.js) — versioned (`wc26-v1`). **Bump `CACHE_VERSION` to invalidate** all caches. Strategies:
- **App shell** (`/`, `/matches`, `/teams`, `/bracket`, `/me`, manifest): pre-cached at install, network-first on navigations with cache fallback.
- **Static assets** (`/_next/static/*`, fonts, images): stale-while-revalidate.
- **`/api/*`**: stale-while-revalidate (no TTL bound yet — flagged in audit).
- Only same-origin requests are handled (`url.origin !== self.location.origin` guard).

Registered **only in production** ([components/ServiceWorkerRegister.tsx](components/ServiceWorkerRegister.tsx)) — dev mode skips it so HMR isn't shadowed by stale cache.

## Known gotchas

- **The opener time was wrong in early commits** — `new Date("2026-06-11T19:00:00-05:00")` parses as Eastern time, giving 03:00 IL the next day. The correct constant uses `Z` (UTC): 13:00 Mexico City = 19:00 UTC = **22:00 IL on June 11**.
- **TheSportsDB `kickoffISO` is bare ISO without a `Z` suffix** — JavaScript treats bare datetime as local time. `parseKickoffMs()` appends `Z` explicitly. Don't `new Date(m.kickoffISO)` raw.
- **`lookup_all_players.php` is useless for national teams** — only returns coaches. Always use `searchplayers.php?p=Name`.
- **Stale dev servers** — `npm run dev` will silently choose another port if 3000 is held. Multiple Node processes can end up running different commits, and HMR on a stale server looks identical to "my fix didn't work." Kill all `node` processes before retrying a tricky fix.
- **Google News RSS occasionally returns 5xx** — `NewsStrip` shows a soft "Couldn't load news" state.
- **Smoke shader and prefers-reduced-motion** — the rAF loop is paused under reduced-motion. If you add new state that the smoke reads (uniform colors, etc.), call `renderer.render(performance.now())` manually after the update so paused users still see the change.

## localStorage keys

| Key | Owner | Shape (validated on read) |
|---|---|---|
| `wc26.myTeam` | `JerseyThemeProvider` | `string` matching `^[A-Z—-]+$`, max 8 chars, must resolve via `getTeam`. Absence = neutral mode. |
| `wc26.bracket` | `/bracket` page | `Record<number, "slot1" \| "slot2">` — match num 1–200 → predicted side. Bad blobs self-purge. |

## What's deferred (post Phase 11)

Carrying forward — and items the triad audit surfaced but Tier 3 didn't claim yet:

- **API-Football integration** (lineups, live stats) — future, gated on a paid key.
- **Service worker TTL on `/api/*` responses** — currently unbounded SWR; cap entry count when traffic grows. Re-flagged by triad Agent A.
- **Opt-in matchday push reminders** — triad Tier 3 #16 (Agent C). Web Push + permission UX + scheduling worker. Defer until ≤1 week pre-kickoff; reminders matter less 4+ weeks out.
- **Bracket "% predicted" social proof** — triad Tier 3 #18. Needs a KV store (Upstash KV via `@vercel/kv` or Redis) — first infra cost in the app.
- **"Since you were here" return-visit card on /** — triad Tier 3 #19. Persist `wc26.lastVisitMs`; show "2 matches finished, your bracket is 3/3" delta card.
- **Real Lighthouse run** (target ≥90 perf / ≥95 a11y) — possible now that the URL is live; not yet run.
- 🟡/⚪ items from the original Gourges audit (font role rebalance, smoke veil luminance-aware, `IsometricPitch` actually isometric).
- **CSP further-hardening** — triad Agent A 1/3 outliers: COOP / CORP / COEP headers, hex validation in `THEME_BOOTSTRAP` before `setProperty`, URL-scheme allowlist on news `link` field, SAX-style RSS parser to replace bounded-regex.
