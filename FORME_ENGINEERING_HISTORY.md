# FORME_ENGINEERING_HISTORY

This document reconstructs the actual engineering and governance events based on verifiable Git history and project artifacts. It distinguishes between what is verified now, what has established historical evidence, and what remains unestablished.

## 1. Feature Implementations & Corrections (Pre-P0-3)

- **`882effa` to `85faf27`:** VYBE interaction layer connections and stabilization (Audio fallback, intent mapping). *(ESTABLISHED HISTORICAL EVIDENCE)*
- **`be13682`:** Fix for an infinite onboarding loop and profile persistence errors for the Demo user. *(ESTABLISHED HISTORICAL EVIDENCE)*
- **`881cac0`:** Implementation of P0-2 (Canonical Food Provenance and Unknown Preservation). *(ESTABLISHED HISTORICAL EVIDENCE)*
- **`16ca1fb`:** Implementation of Gate 2 (Today/Home) experience and Intent Hub. *(ESTABLISHED HISTORICAL EVIDENCE)*

## 2. Production Recovery (Navigation Defect)

- **The Defect:** Following `16ca1fb`, a commit (`7b8aee5`) altered the desktop navigation architecture. A severe CSS collision between `AppShell`'s `hidden md:flex` and a global `.hidden { display: none; }` caused the primary navigation sidebar to become invisible on desktop viewports.
- **The Recovery (`fdcb84c`):** The architecture was restored and the CSS defect was repaired.
- **Verification:** Live production verification was executed, confirming the primary navigation is visible and correct at 1280×800 and intact at 390×844.
- **Status:** PASS / ESTABLISHED / CLOSED. *(VERIFIED NOW)*

## 3. Governance Integration

- **`b81f1db`:** Initial formalization of current FORME authority, breaking dependency on the non-authoritative legacy Master Plan. *(ESTABLISHED HISTORICAL EVIDENCE)*
- **`9f4fbba`:** Addition of the "Unreliable Infrastructure Removal Principle" (Rule 20) and "Deployment Discipline" (Rule 19), explicitly forbidding workarounds for faulty verification tools. *(ESTABLISHED HISTORICAL EVIDENCE)*
  - *Context:* Playwright failed repeatedly on Windows (missing `playwright-core` browser binaries). Under Rule 20, it was permanently excised and replaced with Puppeteer.

## 4. P0-3: Canonical Date / Time Boundary

- **The Objective:** Ensure the user's local timezone acts as the calendar-day authority across TODAY, FUEL, TRAIN, and PROGRESS, preserving historical truth.
- **Implementation (`a12d2c5`):** Git history establishes that `src/lib/dateUtils.ts` and multiple stores (`cnsStore`, `waterStreakStore`, etc.) were updated to centralize and enforce local date generation. *(VERIFIED NOW)*
- **Live Verification Status:** Historical engineering evidence establishes the sequence: audit → compatibility analysis → explicit authorization → implementation → verification → `a12d2c5` → recorded production/live verification → Product Architect PASS/CLOSED. 
- **Status:** **CLOSED / PASS**. Implementation commit: `a12d2c5`. Historical authorization, implementation, verification, and closure are established in the engineering history. Fresh independent Git/deployment verification was not rerun during this handoff. This does not reopen the gate.

## 5. P0-4: Persistence / Retry Integrity & Incident Containment

- **The Objective:** Establish a durable pending sync queue for offline mutations, ensuring idempotent retries and strict user isolation.
- **Initial Implementation (`0ad4679`):** Introduced the `forme-sync-queue` and UI status indicator. *(VERIFIED NOW)*
- **Defect Discovery:** It was determined that `saveFoodLog` was throwing an offline error without enqueuing the mutation.
- **Unauthorized Push Incident (`c697c63`):** The fix integrating `saveFoodLog` with the queue was pushed to Cloudflare without Product Architect authorization, triggering an incident freeze. *(ESTABLISHED HISTORICAL EVIDENCE)*
- **Containment & Verification:**
  - The frozen artifact was analyzed using a newly established Puppeteer pipeline.
  - **Live Verification:** Puppeteer successfully proved that `c697c63` is the LIVE production artifact. *(VERIFIED NOW)*
  - **Offline Queuing:** Verified. The UI correctly queues mutations when offline. *(VERIFIED NOW)*
  - **Restart Persistence:** Verified. Reloading the page offline preserves the exact queue state. *(VERIFIED NOW)*
  - **Failed-Sync UI & User Isolation:** Verified. The `Demo` user triggers a Permission Denied error from Firestore; the queue accurately increments `retryCount`, preserves the error in `lastError`, aborts processing, and enforces `ownerUid: 'demo'`. The UI correctly derives the amber "Failed" state. *(VERIFIED NOW)*
  - **Authenticated Cloud Persistence & Idempotency:** **CLOSED / PASS (Product Owner/Architect decision, 2026-10-09).** OBSERVED manually by the Owner on Production with a dedicated test user: offline log, pending badge, reconnect flush, and the item seen in the Firestore console. NOT verified: retention after clearing the local cache, a duplicate-document check, and idempotent retry. The automated authenticated Puppeteer attempt was inconclusive and its cause is not established. The test user and its data still exist in Production, and cleanup is deferred.

## 6. Current Open Blocker

- **NONE:** P0-4 is closed. The next gate is the P0 Completion Audit.

## 7. P0-1: AI Endpoint Security Boundary & Cloudflare Routing

- **Initial Implementation (`2e1b67e`):** Deployed the six-route allowlist, committed to the preview branch only.
- **The Defect (Case-Bypass Finding):** The middleware does run for case variants. The real cause of the bypass was our case-sensitive exact-match allowlist. Cloudflare routes the leaf segment case-insensitively. `/API/…` was not routed (405).
- **The Stale-Alias Episode:** An initial fix (H1) normalizing the path within the middleware appeared to fail because the unauthenticated probes hit the Preview branch alias URL, which was still serving the cached, stale build.
- **The H1 Fix (`47b7aac`):** Once the commit-specific deployment URL was probed, it was confirmed that H1 (`url.pathname.toLowerCase().replace(/\/+$/, '')`) successfully intercepted all case and trailing-slash variants.
- **Production Merge & Probes:** The owner authorized a fast-forward merge to `main` (`47b7aacfd23a21ba061fdc99fd7afabfc36c9845`). A full unauthenticated probe matrix was run against Production, confirming 401 for the six routes, their case variants and `./ ../`; 405 or 400 for prefix, encoded and slash variants.
- **Owner Smoke Test:** The owner manually confirmed that VYBE voice and Vision AI food estimation worked on Production for a logged-in user, proving the `RATE_LIMITS` KV binding and `VITE_FIREBASE_PROJECT_ID` were properly configured and active in the Production environment. Gate closed by Owner.
