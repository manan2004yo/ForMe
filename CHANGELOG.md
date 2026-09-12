# CHANGELOG.md

All notable changes are documented here. Follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

---

## [Unreleased] — Production Deployment Preparation

**Date:** 2026-09-12

### Added

- `public/_redirects` — Cloudflare Pages SPA routing fallback. Routes all paths to `index.html` so React Router handles client-side navigation correctly on direct URL access and page refresh (e.g. `/landing`, `/login`).
- `.env.example` — Template listing all required environment variables with blank values. Committed to Git; actual `.env` is never committed.
- `PRODUCT_ARCHITECTURE.md` — Comprehensive documentation of frontend architecture, routing, Firebase backend, AI engines, deployment pipeline, and environment variables.
- `DEPLOYMENT.md` — Step-by-step guide for local development, production build, Git setup, Cloudflare Pages deployment, Firebase configuration, and troubleshooting.
- `CHANGELOG.md` — This file.
- `AGENTS.md` — Agent/AI assistant instructions for working with this codebase.

### Changed

- `vite.config.ts` — Fixed Vite 8 deprecation: replaced `__dirname` with `import.meta.dirname` for native config loader compatibility. Added `build.chunkSizeWarningLimit: 1600` to suppress expected large bundle warning (Firebase + Recharts are large but necessary dependencies).
- `.gitignore` — Added explicit `.env`, `.env.local`, `.env.production`, `.env.production.local` entries to ensure Firebase credentials are never committed to Git.

### Fixed

- Production build now runs cleanly (`npm run build` exits 0) with only informational warnings.
- SPA routing now works correctly on Cloudflare Pages — `/landing` and all other routes survive page refresh and direct navigation.

### Production Build Status

- ✅ `tsc -b` passes (no TypeScript errors)
- ✅ Vite production bundle generated successfully
- ✅ Output: `dist/index.html` + `dist/assets/` + `dist/_redirects`

### Not Changed

- No application code (components, features, stores, engines) was modified
- No UI/UX changes
- No branding changes
- No product logic changes
- Firebase configuration preserved as-is (reads from env vars, falls back to demo mode)

---

## Previous History

> No changelog existed before this deployment task. Previous development history is captured in Git commits (once Git is initialized).
