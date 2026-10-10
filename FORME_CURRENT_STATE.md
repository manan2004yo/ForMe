# FORME_CURRENT_STATE

## 1. Project Identity and Destination
- **Project Name:** FORME (temporary internal name; must not be changed in code).
- **Destination:** FORME is a trustworthy longitudinal personal fitness decision system. It focuses on the core loop: Understand → Act → Record → Learn → Decide → Act.
- **Moat:** The differentiated value is the trustworthy connection between Goals → Actions → Data → History → Next Decisions (not simply having the most features or the best AI).
- **Core Principle:** FORME must be more trustworthy than it is impressive. Unknowns must not be silently converted into zeros. The deterministic system establishes truth; AI is used for interpretation and orchestration, not as a system of record.

## 2. Architecture Summary
- **Framework:** React 19 + TypeScript + Vite 8
- **Routing:** React Router v7 (client-side SPA, `BrowserRouter`)
- **State Management:** Zustand v5 (multiple domain-specific stores like `authStore`, `syncStore`, `foodLogStore`, `cnsStore`, etc.)
- **Backend:** Firebase (Auth, Firestore, Storage). There is no custom server.
- **Styling:** Tailwind CSS v4 + custom CSS design system (`src/index.css`) emphasizing premium aesthetics, glassmorphism, and curated palettes.
- **Hosting / CI/CD:** Cloudflare Pages (static SPA deployment) connected to GitHub `main` branch.
- **Verification Infrastructure:** Puppeteer is established for end-to-end browser and live verification, replacing Playwright (which was permanently removed due to driver artifact unavailability on Windows).

## 3. Current Live Artifact
- **Commit:** `47b7aacfd23a21ba061fdc99fd7afabfc36c9845`
- **Prior Artifact:** `c697c63e3f708bb21d388860537d4ac4e9277797` (P0-4 evidence was gathered on this artifact). The 8-file P0-1 delta did not touch the queue or persistence code.
- **Status:** LIVE at `https://forme-693.pages.dev`
- **Artifact Detail:** This artifact contains the P0-1 AI Endpoint Security Boundary (H1 middleware fix) and the P0-4 implementation.
- **Required Cloudflare Settings:** The `RATE_LIMITS` KV binding and the `VITE_FIREBASE_PROJECT_ID` variable MUST exist in the Production environment for AI features to function without 503/401 errors. Preview: UNVERIFIED.

## 4. Gate Status & Blockers
- **P0-1 (AI Endpoint Security Boundary):** CLOSED — `47b7aacfd23a21ba061fdc99fd7afabfc36c9845`.
- **P0-3 (Canonical Date / Time Boundary):** CLOSED / PASS — `a12d2c5`.
- **P0-4 (Persistence / Retry Integrity):** CLOSED / PASS (Product Owner/Architect decision, 2026-10-09).
- **P0-4 Evidence:** OBSERVED manually by the Owner on Production with a dedicated test user: offline log, pending badge, reconnect flush, and the item seen in the Firestore console. NOT verified: retention after clearing the local cache, a duplicate-document check, and idempotent retry. The automated authenticated Puppeteer attempt was inconclusive and its cause is not established. The test user and its data still exist in Production, and cleanup is deferred.
- **P0 Audit:** CLOSED / PASS (Product Owner/Architect decision, 2026-10-10).

## 5. Security & Working Environment
- **Environment Variables:** All `VITE_FIREBASE_*` variables are required for normal execution. Without them, the application falls back to read-only Demo Mode.
- **Zero Errors Rule:** Strict enforcement of zero TypeScript and ESLint errors prior to pushing. A broken build corrupts the Cloudflare cache.
- **Deployment Discipline:** Automatic pushing and deployment are explicitly forbidden without Product Architect authorization.

## 6. What Claude Must Know First
- You are operating under strict **Atomic Gate Discipline**. Never redefine a gate, broaden scope, or advance to the next gate without explicit authorization.
- **Do NOT assume a code change equals completeness.** Live verification of Visual, Interaction, Data, and Truth dimensions is required.
- **Read `FORME_OPEN_PROBLEM.md` immediately.** Next step: post-P0: Owner to authorize the next stage.

## 7. What Claude Must Not Assume
- Do not assume "looks good" or "compiles successfully" constitutes a Product PASS.
- Do not assume you can create mock data, dummy Firebase users, or bypass Firestore rules to force a test to pass.
- Do not assume the legacy `MASTER_PLAN.md` has any authority. Use only the current gate status and governance constraints.
