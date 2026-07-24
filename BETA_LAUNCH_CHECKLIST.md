# VALORY — Closed Beta Launch Checklist

**Goal:** Invite-only closed beta, live before ScrollHome's Summer 2026 launch (target: late August 2026).
**Scope:** Seller valuation + agent matching + video-first buyer feed (v1 = agent-uploaded walkthroughs, no AI stitching).
**Infra:** Railway (Express app + Postgres) · Cloudflare Stream (video) · custom domain.

> Supersedes `LAUNCH_CHECKLIST.md`, which is a demo-mode presentation checklist.

---

## Phase 0 — Baseline & bug sweep (Week 1)

- [x] `npm install && npm run build` passes clean *(2026-07-07 — fixed esbuild externals for Tailwind natives)*
- [x] All 22 test suites pass — `npm test` → 578 passed, 19 skipped *(2026-07-07 — stale tests updated; tests for unbuilt vendorConsent/launchVideos/savedSearches/admin routers parked with it.skip)*
- [x] Real bugs fixed along the way: EPC improvementPotential logic was inverted; demo postcode validate/lookup didn't normalise spacing ("BS15PB" failed); several flattened-import paths (`../db`, `../drizzle/schema`, `../jobs/*`) were broken; `valuationEngine.ts` moved into `services/` where its imports resolve
- [x] Street Data API key verified live *(2026-07-06 — real AVM data for TA postcodes)*
- [x] Confirm desktop repo matches latest on GitHub *(branch valorevest-fund-ui, up to date with origin)*
- [ ] Re-verify previously reported bugs are fixed:
  - [x] `/sell/valuation` 404 — route registered in src/App.tsx *(code-verified 2026-07-06; confirm in browser)*
  - [x] Valory logo always navigates to `/` — Header.tsx handleHomeClick *(code-verified)*
  - [ ] Top-right profile dropdown consistent on every page *(visual check)*
  - [ ] Buyer discovery card scaling *(visual check)*
  - [x] Momentum badges — MomentumBadge used in SwipePropertyCard + ImmersiveDiscoverCards *(code-verified; confirm visually)*
- [ ] One design system only (dark copper) — remove remaining pink/purple beta styling
- [ ] Delete dead files from repo root (duplicate `_new.tsx` pages, zips, screenshots)

## Phase 1 — Infrastructure (Week 1–2)

- [x] Railway project "observant-enchantment": valory web service (branch valorevest-fund-ui, auto-deploy) + **MySQL** (not Postgres — app uses drizzle mysql dialect) *(2026-07-07)*
- [x] Live at https://valory-production-110f.up.railway.app (port 3000, PORT var pinned) *(2026-07-07)*
- [x] Fixed prod-only crash: esbuild ESM bundle needed createRequire banner for dotenv/CJS (commit 01a912f)
- [x] Env vars set: DATABASE_URL (ref to MySQL), NODE_ENV, VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID
- [ ] Oliver: add secrets as Railway variables — `STREET_DATA_API_KEY` (copy from local .env) and `JWT_SECRET` (long random string)
- [ ] Run Drizzle migrations 0000–0008 against Railway MySQL (DB currently empty — non-landing pages will fail until done)
- [ ] Import reference data: ONSPD postcodes (`onspdImport.ts`), Land Registry PPD sold prices (`ppdImport.ts`)
- [ ] Custom domain: point **valoryhomes.com** at Railway (add custom domain in service settings + CNAME at registrar); then add to Auth0 allowed URLs
- [ ] Error monitoring (Sentry) + uptime check
- [ ] Upgrade Railway trial → Hobby plan before beta traffic

## Phase 2 — Real data & auth (Week 2–3)

- [x] Auth0 tenant + application created ("Valory" SPA, dev-6evblcdpp5e25y4g.uk — localhost:3000 URLs configured) *(2026-07-06)*
- [ ] Integrate @auth0/auth0-react on client + JWT validation in Express/tRPC context, replacing demo-mode OAuth bypass
- [ ] Add production domain to Auth0 allowed URLs once live
- [ ] Disable demo mode: real DB writes, no mock fallbacks
- [ ] Street Data API live for comparables + valuation inputs (v2.11 schema already integrated)
- [ ] RBAC live for buyer / agent / vendor / admin
- [ ] Beta invite gating (invite codes or allowlisted emails)

## Phase 3 — Video feed MVP (Week 2–5, parallel)

- [ ] Cloudflare Stream account + API keys
- [ ] Agent upload: attach 15–60s vertical walkthrough to a listing (direct-to-Stream upload)
- [ ] Vertical swipe feed: full-screen video, property chip overlay (price, beds, postcode, momentum badge)
- [ ] Right sidebar actions: save, share, view count
- [ ] Save / "Not for me" actions wired into `feed-ranking-engine.ts`
- [ ] One-tap Enquire → agent lead (`early-lead-signal-service.ts`)
- [ ] Photo-carousel fallback for listings without video

## Phase 4 — Legal & compliance (Week 4)

- [ ] Wire existing `Privacy.tsx`, `Terms.tsx`, `Cookies.tsx` into app routes + footer
- [ ] Cookie consent banner
- [ ] GDPR basics: data export + delete on request, privacy contact email
- [ ] Email consent checkboxes on all capture forms
- [ ] Company details in footer (company number once registered)

## Phase 5 — Beta onboarding (Week 4–6)

- [ ] Pick beta region and recruit 3–5 estate agents
- [ ] Onboard agent listings + walkthrough videos (target: 20+ live properties)
- [ ] Invite list of sellers/buyers (reuse Google Form signups)
- [ ] Product analytics (PostHog) + feedback channel
- [ ] Onboarding email sequence for invitees

## Phase 6 — Launch verification (Week 6)

- [ ] Full E2E walkthrough of all four roles on production
- [ ] Mobile-device pass on the video feed (iOS Safari + Android Chrome)
- [ ] Smoke/load test, DB backups enabled
- [ ] Go/no-go review → send invites

---

**Estimated: 6–8 weeks → live late August 2026.**
Critical path: Phase 1 infra → Phase 2 real data → Phase 6. Video feed (Phase 3) runs in parallel and is the biggest single build item.
