# Valory initial audit

## What is in the upload

- 42 `.tsx` files
- 65 `.ts` files
- 24 test files
- 84 markdown/product-spec files
- 1 static `index.html` presentation page
- 1 preview image (`webdev-preview-1773172991.png`)

## Strong signals

- The product concept is differentiated: seller-first valuation, live momentum, buyer follow/save behavior, and agent matching all feel more distinctive than a normal property portal.
- The brand direction is memorable.
- The docs are unusually detailed for an early product and show clear thinking about marketplace mechanics.
- The homepage and discovery concepts are stronger than generic “search portal” patterns.

## Main issue

The upload does **not** look like a clean, runnable repo yet. It looks more like a flattened export of generated/appended files from multiple iterations.

## Why it likely will not run as-is

- `tsconfig.json` expects code in:
  - `client/src/**/*`
  - `shared/**/*`
  - `server/**/*`
- But the uploaded files are mostly flattened into one folder.
- There is no `package.json`.
- There is no `vite.config.*`.
- There is no obvious app entry file such as `main.tsx`.
- `App.tsx` imports from `./pages/...` and `@/components/...`, but those directories are not present in the upload.
- A quick scan found **222 unresolved imports** under the current folder structure.
- Several React files use hooks without importing them from `react`.
- `index.html` is a presentation/landing page for the project, not the actual React app entrypoint.

## Examples of structural mismatch

- `App.tsx` imports `./pages/Home`, `./pages/PropertyDetail`, etc.
- The matching files (`Home.tsx`, `PropertyDetail.tsx`, etc.) are at the root of the zip, not in a `pages/` directory.
- Many components import `@/components/ui/button`, `@/lib/trpc`, `@/hooks/useAuth`, but there is no matching `client/src/components`, `client/src/lib`, or `client/src/hooks` tree in this export.

## Product/design observation

There are at least **two competing visual directions** in the material:

1. Bright pink/purple/orange, light and playful
2. Dark cinematic copper/bronze, more premium and immersive

The concept is good, but the product will feel sharper once one visual system is chosen and applied consistently.

## Recommended next order of work

1. Rebuild this into a proper repo structure
2. Restore missing folders and shared utilities
3. Add missing project files (`package.json`, Vite config, entrypoint, etc.)
4. Reduce the MVP to a few critical routes:
   - Home
   - Discover
   - Seller valuation flow
   - Property detail
   - Saved/followed properties
5. Unify the design language
6. Replace remaining mock/fallback data with one consistent source of truth

## Best immediate next step

Turn this export into a clean React/Vite repo that compiles. Until that is done, it will be hard to judge the real product quality because the current upload is part concept pack, part code dump, part presentation page.
