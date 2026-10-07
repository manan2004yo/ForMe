HISTORICAL / NON-AUTHORITATIVE

This document is preserved for historical/audit reference only.

It has been superseded by the current FORME governance authority in GOVERNANCE.md.

It must NOT be used to define:
- current roadmap
- current architecture
- current gates
- acceptance criteria
- implementation authorization
- Product Architect decisions

============================================================
# FORME MASTER PLAN v2 — SINGLE SOURCE OF TRUTH

Last updated: 2026-10-01
Product name: FORME (temporary internal name, never rename). "Vybe" is the intelligence layer inside FORME.

This file merges the original master plan (2026-09-30), the Visual Audit addendum, the Final Technical/AI/Barcode Directive, the old planning chat's plan, and all work through 2026-10-01. It is the ONE plan. There are no competing plans.

---

## 0. Authority and deviation protocol

1. The roadmap order in section 6 is FROZEN. Audit requirements are carried INSIDE the steps, never as separate side-projects.
2. Any prompt from any chat that conflicts with this file is a DEVIATION. The agent stops and reports (see AGENTS.md rules 13 to 15). Only the user can approve a deviation, in writing. Every approved deviation is recorded in section 11.
3. If AGENTS.md rules 5 and 6 (older git/tsc wording) differ from the footer in section 2, the footer in section 2 applies.
4. Agents never edit this file on their own initiative. They edit it only when the user pastes an exact update instruction.

---

## 1. Roles

- Planner (browser Claude): plans, writes exact-code prompts, diagnoses failures. Has no file access.
- GEMINI AG: small exact-code edits (one to two files).
- CLAUDE AG: multi-file or security-critical work (data model, account deletion, rules, auth).
- User: pastes prompts into AG, tests on a real phone, pastes results back.
- Every prompt is labeled GEMINI AG or CLAUDE AG.
- Cost rule: the chat is re-read on every message. Short replies, one prompt per turn, start a new chat when it grows large and paste this file first.

## 2. How prompts are written (mandatory)

1. One small step per prompt. Never bundle a feature across many files.
2. The planner asks the user for the specific file first. Never write code blindly.
3. Write EXACT code (FIND / REPLACE blocks or full files). AG does not interpret or decide.
4. Every FIND must match exactly once. If it does not, AG stops and reports; it never improvises.
5. Footer on every code prompt: run `npm run lint`, `npx tsc -b --noEmit`, `npm run build`. If any errors, paste them and STOP. If clean, run `git add <files>`, `git commit -m "..."`, `git push origin main` as three separate standalone commands (never chained). Report files changed, results, commit hash. No file dumps.
6. AG never fixes its own errors. It reports them; the planner diagnoses.
7. AG never touches git config, credentials, .env or secrets, and creates no temp files in the project root.
8. NOTHING is done until the user has seen it work on a phone. A clean build is not proof.
9. If a step is ambiguous, AG stops and asks.
10. Secrets are never pasted anywhere. Only src/ and functions/ code is shared.

## 3. Product principles

- One connected system, not isolated tools. Core loop: Workout + Nutrition + Recovery + Profile/Goals, then Current State, then Readiness, then Vybe, then TODAY, then Action, then New Data, then Updated State.
- Mobile first: 375 to 430px, 44px touch targets, no hover-only actions, no horizontal scroll, safe areas.
- Never fabricate data, nutrition, user context, readiness or prices. Unknown stays unknown.
- AI is for vision, interpretation, estimates and reasoning only. Deterministic work (calculations, barcode decoding, lookups, totals, budgets, PR detection, simple voice commands) is local code.
- Every value on every food screen is tap-to-edit.
- No dead buttons, no "coming soon" fakes, no placeholder screens, no mock integrations.
- Free where sensible, paid where necessary. Never promise unlimited free quota.
- Preserve what works: dark identity, accent, typography, card architecture, Food Log macro architecture, Diet Plan foundation, Recovery Map, Mom's Kitchen concept, Hostel and Budget Engine concept, Progress structure, Profile structure, privacy controls, Google auth where sound, food database, exercise database.

## 4. Locked architecture (do not modify without explicit written unlock)

- Stack: React 19, Vite, Zustand, Firebase (Auth + Firestore), Cloudflare Pages + Functions, TypeScript.
- AI model: gemini-3.1-flash-lite (live-verified for text, JSON, image). Gemini 3.6 is retired.
- AI Orchestrator (functions/lib/aiOrchestrator.ts): generateText, generateStructuredOutput, analyzeImage. Provider-neutral. All AI calls go through it. LOCKED.
- Product Resolution Engine (functions/lib/productResolutionEngine.ts): Vybe KV cache (VERIFIED_PRODUCTS) -> Open Food Facts -> UPCitemdb -> GS1 (stub, identity only, always skipped). Consistency check calories vs 4p+4c+9f (band max(40, 25%)). Barcode validation 8 to 14 digits. 6s timeouts. Full outage returns 'error', never 'not_found'. LOCKED.
- Nutrition Estimator (functions/lib/nutritionEstimator.ts): name to nullable nutrient profile, packaged (per 100g) or meal (per portion), Atwater check. LOCKED.
- Endpoints: /api/resolve-barcode/[barcode], /api/estimate-nutrition, /api/read-nutrition-label, /api/snap-log, /api/ai-coach, /api/parse-voice. Old /api/barcode/[barcode] and fetchProductByBarcode remain as unused fallback.
- Firestore rules: only users/{uid} and its subcollections, owner only. Collections include foodLogs, weightHistory, waistHistory, workoutLogs, savedMeals, familyRecipes, cns, productLibrary, plus singleton docs. Firebase Storage is not enabled (needs Blaze).
- Decision A (cache): user-supplied or user-confirmed nutrition is saved ONLY to the user's personal library (users/{uid}/productLibrary), checked before the engine. It is NEVER written to the shared KV cache (poisoning risk). The shared KV cache holds externally verified database hits only. Only label and manual products are saved to the library (rename-only of database products is not saved, for now).
- Dark mode only for now.
- Provider changes (a future paid AI or product provider) must only touch the provider/adapter layer, never Snap AI, Coach, Voice, Vybe, Food Log, Today or user context.
- AI fallback order: preferred provider, alternate configured provider, self-hosted if actually configured, then an honest "AI unavailable" state. No quota evasion, key rotation, scraping or fake fallback.

## 5. Data rules

- Unknown is null or "—", never 0. Zero means a true zero.
- Required fields on every food entry: calories, protein, carbs, fat, fiber, sugar, sodium. Pillar 2 adds, when available: potassium, magnesium, iron, calcium, zinc, vitamin A, C, D.
- Trust tiers: Verified from Label (green), Database (green), Entered by you (green), AI Estimate (amber), AI Estimate Low Confidence (amber).
- A confirmed correction (label scan or manual edit) saves to the personal library and is never silently overwritten by a lower-trust source.
- AI estimates are never written to the shared cache as verified. Photo and AI nutrition is always labeled an estimate and editable.
- Unresolved products are never guessed (see open decision O1 for how this meets the current estimator).
- One canonical Food Record shape is the target (step 4d). No duplicate sources of truth.
- Two Pillars: Pillar 1 packaged (barcode chain); Pillar 2 cooked/fresh (text and plate photo, deep micros, always an estimate). The public barcode database is never used for Pillar 2.

## 6. Roadmap (FROZEN ORDER)

Status markers: [DONE], [IN PROGRESS], [NEXT], [LATER].

1. [DONE] Phone-test the barcode sheet. (Missing-nutrition path not individually verified.)
2. Not-found Manual Add.
   - [DONE] Scanner passes barcode and name (687c276). Manual-add mode in the sheet (7ce96f0). EatDashboard wiring and relabel "Add Product Manually" (728c646). Tap-to-edit product name (55b7061). Phone-tested.
   - [LATER, small] "Snap Photo Instead" on the not-found screen: behavior to be defined when reached (see O5).
3. [DONE in code, phone-untested] Dead "Enter Nutrition Manually" button fixed (687c276, 728c646).
4. Personal library.
   - [DONE] 4a data layer + deleteUserData (3eedde8). 4b scanner checks library before engine (c3ce850).
   - [DONE] 4c save label/manual products on log. Label/manual products are persisted to the user's personal product library and are not written to shared KV cache.
   - [DONE] 4d Essentials + canonical Food Record: extended nutrition support, editable fiber/sugar/sodium, unknown nutrition preserved as null/undefined rather than fabricated zero values, fixed label-read fiber handling, and established the canonical Food Record layer with migration-safe compatibility for existing logs.
5. [DONE] Snap AI rebuild.
   - Packaged photo: barcode detection, then Product Resolution, with AI nutrition/label handling only through the approved fallback paths.
   - Meal photo: vision, food identification, portion estimate, macro estimate, confirmation. AI estimates are editable and unknown nutrition remains unknown.
   - Converges on the SAME confirmation/edit workflow as barcode and search. AI calls use the orchestrator and deterministic portion math remains local.
6. [DONE] Pillar 2 text entry. Local INDIAN_FOODS/custom foods are the instant first pass; AI meal estimation is used only when the local search returns no matches. Text results converge on the SAME confirmation/edit screen as barcode and Snap.
7. [DONE] Food Log completion. Repeat Meal, Repeat Yesterday's Dinner, Saved Meals next to Recent Foods. Every input (Barcode, Search, Snap, Voice) converges on one confirm/edit screen and one Food Record. Micronutrient sheet reads real logged values.
8. [DONE] Workout rebuild. Four separate concepts: Exercise, Workout Plan, Weekly Program, Active Session. Plan-first and train-first entry. Train home: Today's Workout, Weekly Program, Saved Plans, Exercise Library, History, Recovery. Dedicated mobile-first Active Session (large targets, rest timer, undo, no empty canvas; fixes the black "Active Workout" screen). Finish summary (duration, sets, volume, PRs, muscles, recovery impact). Full exercise database with GIFs (ExerciseDB).
9. [DONE] Recovery + Readiness (CNS rebuild). The muscle map remains a visual recovery layer. Readiness is a separate qualitative state with a "why" and a "what to do". Real signals only (sleep, fatigue, soreness, training, nutrition, hydration). Because the roadmap required an overall readiness score while also forbidding invented numbers or formulas, the approved implementation uses "Evidence Complete" and "Insufficient Evidence" rather than a fabricated numeric score or formula. The readiness evidence contract now defines six core signals, with Hydration to be implemented through Step 12 Fuel Integration. Achievements are wired to real user events.
10. [LATER] Vybe rebuild. States: Idle, Listening, Transcribing, Thinking, Response, Suggested action, Confirmation, Completed. Local-first voice parser (simple commands run locally, AI only for ambiguous or contextual requests). Cross-system context from real data via the orchestrator. Confirm before action; never claim an action that did not execute. Currently returns UNKNOWN for most speech (see O4 for the orchestrator unlock).
11. [LATER] AI Coach. UI entry point (none today), real user context (profile, targets, today's food and workout, program, recovery, readiness, budget, hostel), controlled tools only, never invents unavailable information.
12. [LATER] Fuel integration. Diet Plan (intended) vs Food Log (actual) with remaining targets. Hydration / Water Tracking with real logged intake and daily hydration state. Meal swap respecting calories, protein, diet type, budget, cooking ability, hostel availability, time of day. Hostel mode (mess menu, eat/skip, gap detection, affordable add-ons, logs to Food Log). Budget Kitchen as a decision engine (no invented prices). Mom's Kitchen as part of Fuel (recipe, cost, portion, plan, log). Micronutrient gaps lead to Vybe suggestions. Hydration is also exposed as the sixth core readiness evidence signal once implemented.
13. [LATER] Progress intelligence. Interpret trends, show insufficient-data states honestly. Cinematic Morph must work, be labeled upcoming, or be removed. Progress photos private, biometric option, never sent to AI without consent (see O3).
14. [LATER] Cross-system integration. Training, nutrition, recovery, readiness, budget, hostel, progress, Vybe and TODAY feed each other (the core loop in section 3).
15. [LATER] Design overhaul. TODAY-first, state-first home (readiness, one dominant recommendation, quick actions). Navigation TODAY / TRAIN / FUEL / PROGRESS / PROFILE (Vybe is a layer, not a tab). Premium six-step onboarding that initializes targets and context (resume, returning users, no partial profiles). Auth flow polish (seamless Google to onboarding, loading and error states, reliable sign-out and account switch). Profile as a management area; settings only with working options. One responsive layout system (no narrow column with huge empty space). Intentional empty, loading, error states. Motion and haptics. Light mode deferred here. See O6.
16. [LATER] Production hardening. Custom domain and OAuth redirects, monitoring, cost review, auth on the public AI endpoints (currently open), remove temporary endpoints (test-resolve-product, GET handler on estimate-nutrition), rate limiting, account deletion re-test including clearing local device data, Razorpay and verify functions review, Open Food Facts and GS1 usage limits, verify the product provider layer is replaceable, run the validation checklists in section 10.
17. [LATER] Privacy Policy and Terms (lawyer review).
18. [LATER] PWA and mobile polish. Manifest, icons, offline, bundle under 500KB gzipped, tested at 375/390/430.
19. [LATER] Private beta (5 to 10 users), cost and performance review, launch, then monetization (Razorpay was a stub).

## 7. Feature completion gate (every feature)

Entry, purpose, primary workflow, secondary workflow, persistence, loading state, empty state, error state, mobile layout, desktop layout, data connection, completion state, integration with related systems, and an end-to-end workflow test (not only the screen). Then seen working on a phone.

## 8. Open decisions (PARKED, decide only when reached; agents never decide these)

- O1. Packaged-food name-based AI estimates. Directive says never estimate packaged nutrition from a similar-sounding name; the locked estimator does it with an amber badge. Decide at step 5. Candidate (frontend-only, no locked file): treat 'ai_estimate' results as missing nutrition with the name prefilled for Manual Add + Snap Label.
- O2. Pillar 2 text search: keep local INDIAN_FOODS as the instant first pass (planner recommendation) or drop it. Decide before step 6.
- O3. Progress photos storage (Firebase Storage needs the Blaze plan). Decide before step 13.
- O4. Orchestrator unlock: add processAudio() and verify the fallback chain and capability check. Decide at step 10.
- O5. "Snap Photo Instead" on the not-found screen: Add Product Manually + Snap Nutrition Label already covers label photos, so define a distinct behavior or drop it.
- O6. Glassmorphism: AGENTS.md rule 8 requires it; the Visual Audit says avoid excessive glassmorphism. Decide at step 15.
- O7. Final product name is decided by the user later; no renames until then.

## 9. Known gaps and cleanup

- Sheet logs unknown values as 0 (fixed in 4d).
- Rename of a database product applies to that log entry only.
- Sheet exit animation lost after the key fix (cosmetic).
- Missing-nutrition button path not phone-verified.
- AI estimates are not cached, so the same product can show different numbers.
- Open Food Facts hits are cached before user confirmation (mitigated by the consistency check on cache reads).
- Provider conflict cross-checking is deferred (the engine returns the first good hit; the confirmation sheet is the safeguard).
- Kilojoule read as kcal in the old, unused scanner path.
- Instant-coffee style estimates can be confidently wrong without the removed low-trust pattern; Snap Label is the remedy.
- tsconfig.tsbuildinfo is tracked by git (add to .gitignore). Lint warnings (466 reported) deferred; source to be confirmed. Add generated testSession.cjs to .oxlintignore if it is the source.
- Razorpay and verify functions unreviewed.
- Second AI provider and GS1 membership deferred.
- Health integrations (Google Fit, Apple Health) deferred; Spotify removed.

## 10. Validation checklists (before launch)

- AI: text reasoning, structured JSON, image understanding, packaged label photo, real meal photo, ambiguous voice command, context-heavy Coach request, error and provider-failure handling, real free-tier limits. Connectivity alone is not proof.
- Product resolution: common products, products sold in India, EAN/UPC/GTIN formats, single-provider hits, conflicting providers, unknown barcodes, missing nutrition, repeat scans, cached resolution without external calls. Never claim 100 percent coverage.

## 11. Change log

- 2026-10-01: v2 created. Merged the original master plan, the Visual Audit addendum, the Final Technical Directive, the old chat's plan and the work through commit c3ce850. Added step 4d (essentials + canonical Food Record). Parked O1 to O7.
- 2026-10-03: Roadmap reconciliation. Marked 4c Personal Library save, 4d Essentials + canonical Food Record, Step 5 Snap AI rebuild, and Step 6 Pillar 2 text entry as [DONE] to reflect the implementation already present in main. Step 6 uses the locked O2 decision: local INDIAN_FOODS/custom foods first, AI only for unmatched text. The six-input UX consolidation remains assigned to Step 15, and meal splitting/remaining-target integration remains assigned to Step 12.
- 2026-10-03: Completed Step 7 (Food Log completion). Implemented quick repeats and saved meals in AddFoodSheet.tsx, and updated MicronutrientSheet.tsx to read actual logged nutrition instead of legacy aggregate totals.
- 2026-10-03: Completed Step 9 (Recovery + Readiness CNS rebuild). Recovery evidence now uses real sleep, fatigue, soreness, training, and nutrition signals; readiness is represented by the approved qualitative "Evidence Complete" / "Insufficient Evidence" state with grounded "why" and "what to do" guidance; the muscle map remains a separate visual recovery layer; and achievements are wired to real user events. No fabricated numeric readiness score or formula was introduced.
- 2026-10-03: Roadmap update approved for Hydration. Hydration / Water Tracking was added to Step 12 Fuel Integration as a real-data feature to build, and Hydration was added as the sixth core readiness evidence signal. Step 12 owns implementation of hydration data and its readiness integration; no hydration value or readiness interpretation is fabricated before that implementation exists.
- 2026-10-03: Approved Step 9 architectural deviation. Because the roadmap requires an overall Readiness score while also explicitly forbidding invented numbers or formulas, the product owner approved replacing the undefined numeric score with an evidence-qualified qualitative Readiness state. The state must be grounded in real recovery evidence, explain why it was reached, provide what to do next, and return Insufficient Evidence when the available evidence does not justify a conclusion. No fabricated numeric score or formula will be introduced.
- 2026-10-03: Completed Step 8 (Workout rebuild). Completed the Train home hub, mobile Active Workout flow, persisted session state, one-level undo, workout finish summary with real history/recovery data, and exercise-library GIF integration with graceful fallback when the external exercise service is unavailable. Manual phone testing for undo, finish summary, and GIF integration was intentionally skipped by explicit product-owner approval; clean lint, TypeScript, and production builds were treated as the completion gate.

