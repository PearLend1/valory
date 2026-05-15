# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Express + Vite HMR) — no DB needed, uses demo mode
npm run build      # Vite builds client → dist/public; esbuild bundles server → dist/
npm start          # Run production build

npx drizzle-kit push      # Push schema changes to MySQL (requires DATABASE_URL)
npx drizzle-kit generate  # Generate migration SQL files from schema.ts

npx vitest                # Run tests (vitest must be installed: npm i -D vitest)
npx vitest run <file>     # Run a single test file
```

Demo mode is automatic when `DATABASE_URL` is absent — the app starts fully functional with mock data.

## Project Structure

This is a single-package Express + React app. All server code lives at the repository root; all client code lives in `src/`.

```
valory/
├── _core/              # Server infrastructure (Express setup, tRPC init, OAuth, RBAC, Vite middleware)
├── routers/            # tRPC sub-routers: agent, follow, timeline, valuation, vendorAcceptance, postcode
├── routers.ts          # Root appRouter — assembles all sub-routers, defines auth + properties endpoints
├── services/           # Business-logic services: comparableSelection.ts, epcClient.ts, osmOverpass.ts
├── schema.ts           # Drizzle MySQL schema (single source of truth for all tables)
├── db.ts               # Lazily-initialised Drizzle connection + all DB query functions
├── src/                # React client
│   ├── pages/          # One file per route (Home, BuyerDiscovery, PropertyDetail, AgentDashboard, …)
│   ├── components/     # Shared UI: ImmersiveDiscoverCards (swipe feed), SwipePropertyCard, Header, …
│   ├── components/ui/  # shadcn/ui primitives (do not edit directly)
│   ├── lib/trpc.ts     # tRPC React client (typed against AppRouter)
│   ├── lib/propertyImages.ts   # Deterministic Unsplash image URLs by property ID + type
│   ├── lib/momentumCalculator.ts # Client-side momentum score calculation
│   └── main.tsx        # App entry: QueryClient + tRPC provider + wouter Router
├── App.tsx             # All client routes (wouter Switch) + ThemeProvider
├── coverage-config.ts  # Active postcode sectors: TA19 0, TA20 1, TA20 2, TA20 4, TA18 8, TA16 5, TA17 8, TA19 9, TA10 0, TA13 5
├── external-data-provider.ts  # Pluggable provider registry (Street Data API adapter)
├── valuation-engine.ts        # Four-layer valuation engine
├── fair-agent-ranking.ts      # Quality-first agent ranking (no pay-to-win)
├── feed-ranking-engine.ts     # Momentum × relevance feed ranking
├── demo-mode.ts               # Mock data mode when DATABASE_URL is unset
├── mock-data.ts               # Demo users + properties
├── rbac.ts                    # Role-based tRPC procedure wrappers
├── const.ts                   # Shared constants (COOKIE_NAME, error messages)
└── drizzle/                   # Migration SQL files + snapshots
```

> **Note:** `vite.config.ts` sets `root: "client"` but React source actually lives in `src/`. The `@` alias resolves to `src/`. This mismatch is known — do not move files to match the config without updating both `vite.config.ts` and `tsconfig.json`.

## Architecture

### Request flow
Browser → Express (`_core/index.ts`) → `/api/trpc/*` → tRPC middleware → `routers.ts` (appRouter) → sub-routers/procedures → `db.ts` query functions → MySQL.

Static/SPA requests are served by Vite in dev (via `_core/vite.ts`) and from `dist/public` in production.

### tRPC router tree
```
system            — health, version
auth.me           — current session user
auth.logout
properties.list   — public property listing with filters
properties.getById
valuation         — seller valuation request + retrieval
follow            — buyer saves/follows
timeline          — property activity feed
agent             — agent dashboard, metrics, lead management
vendorAcceptance  — seller accepting/rejecting agent bids
postcode          — postcode lookup and coverage check
```

All procedures are typed end-to-end. The client imports `AppRouter` from `routers.ts` via the `trpc` client in `src/lib/trpc.ts`.

### Auth & roles
Session cookie (`app_session_id`) contains a JWT. `_core/context.ts` decodes it and attaches `ctx.user`. RBAC wrappers in `rbac.ts` gate endpoints by role:

| Procedure | Allowed roles |
|---|---|
| `publicProcedure` | anyone |
| `protectedProcedure` | any authenticated user |
| `buyerProcedure` | public, admin |
| `vendorProcedure` | vendor, admin |
| `agentProcedure` | agent, admin |
| `tier1AgentProcedure` / `tier2AgentProcedure` | tiered agents, admin |
| `adminProcedure` | admin only |

In demo mode, `getDemoUser(req)` reads `?role=vendor|agent|buyer|admin` from the query string and bypasses JWT checks.

### Four-layer valuation engine (`valuation-engine.ts`)
1. **Layer 1 — Public data:** Land Registry comparables via Street Data API (`externalDataRegistry.getComparables`)
2. **Layer 2 — API AVM:** Street Data `estimated_values` + `market_statistics`
3. **Layer 3 — Agent intelligence:** agent-submitted pricing adjustments
4. **Layer 4 — Platform-native:** Valory engagement/momentum signals

The `ExternalDataProviderRegistry` in `external-data-provider.ts` is pluggable — providers are registered at startup in `_core/index.ts`. The `StreetDataProvider` is active when `STREET_DATA_API_KEY` is set; otherwise the engine falls back to heuristics.

Comparable selection lives in `services/comparableSelection.ts`. Step 4 of `buildCandidateSet()` falls back to the Street Data API when the DB has fewer than 10 comparables, iterating through `COVERAGE_SECTORS` from `coverage-config.ts`.

### Fair agent ranking (`fair-agent-ranking.ts`)
Agents are ranked by a weighted quality score — pricing accuracy (25%), marketing quality (25%), engagement quality (20%), local expertise (20%), responsiveness (10%). Response speed is deliberately a minor signal to prevent pay-to-win placement.

### Momentum & feed ranking
`feed-ranking-engine.ts` combines `momentumScore` (views, saves, days-on-market, price-per-sqft signal) with a `relevanceScore` (user preferences) into a `combinedScore` for the discover feed. The client-side equivalent is `src/lib/momentumCalculator.ts`.

### Client routing
wouter `Switch` in `App.tsx`. Key routes:

| Path | Page |
|---|---|
| `/` | Home — landing + recent listings |
| `/discover` | BuyerDiscovery — TikTok/Tinder swipe feed (`ImmersiveDiscoverCards`) |
| `/property/:id` | PropertyDetail |
| `/sell` | SellerValuation — seller valuation request flow |
| `/saved` | SavedProperties |
| `/agent-dashboard` | AgentDashboard |
| `/vendor/dashboard` | VendorDashboard |
| `/agents` | AgentLanding |
| `/agents/register` | AgentRegistration |

### Property images
`src/lib/propertyImages.ts` maps `(propertyId, propertyType)` to deterministic Unsplash photo URLs. The mapping uses `propertyId % pool.length` so the same property always gets the same image. Use `getPropertyImageUrl()` for full-size and `getPropertyThumbnailUrl()` for card thumbnails.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | No (demo mode without it) | MySQL connection string |
| `JWT_SECRET` | Production | Session token signing |
| `OAUTH_SERVER_URL` | Production | OAuth provider |
| `OWNER_OPEN_ID` | Production | Admin bootstrap user |
| `STREET_DATA_API_KEY` | No (heuristics without it) | Street Data API for valuations and comparables |
| `VITE_APP_ID` | No | Analytics/tracking identifier |

Copy `.env.example` to `.env` to get started.

## Database

Schema is in `schema.ts` (single file, Drizzle MySQL). Migrations are generated into the repo root as numbered `.sql` files. The `drizzle.config.ts` points to `./drizzle/schema.ts` — keep the schema import path consistent when adding tables.

`db.ts` exposes lazy `getDb()` and `getPool()` — both return `null` gracefully when no DB is configured so tooling and tests can run without MySQL.
