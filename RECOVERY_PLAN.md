# FORME RECOVERY PLAN

## 🔴 P0 — Make the existing core genuinely usable

### P0.1 — Get Firebase working locally
This is your immediate blocker.
You need:
.env
↓
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

Then Firebase Console:
Authentication
→ Email/Password enabled
→ Google enabled
→ localhost authorized

Why first? Because the audit says the current auth implementation is basically sound; it is being bypassed because configuration is missing.

Done when:
Create account → login → refresh → still logged in → logout → cannot access protected data

### P0.2 — Fix Firestore security immediately
This is arguably more important than the cosmetic bugs.
The audit says development/test-mode rules may allow authenticated users to access other users' data.
Do not put real users on this database until the rules are corrected.
Your data structure already uses: `users/{uid}/...`
So the security model should enforce that the authenticated UID matches the user path.
Done when: User A cannot read/write User B's data.

### P0.3 — Verify the actual database flow
Don't change architecture yet.
Test:
User → Firebase Auth → Firestore → Profile → Food logs → Workout logs → Weight → Waist → CNS
The audit says these are substantially real.
We need to make sure they stay real when Firebase is properly configured.

### P0.4 — Fix authentication failure/error behavior
Once Firebase works, remove the confusing behavior where failed/missing Firebase configuration effectively sends users toward Demo Mode.
The application needs to clearly distinguish: DEMO MODE from REAL ACCOUNT.
Configuration failure should not silently pretend login succeeded.

### P0.5 — Fix the profile-loading infinite spinner
If Firebase fails and profile loading returns null, the app can get stuck.
Change: loading forever
to: Loading → success → app OR failure → meaningful error + retry

---

## 🟠 P1 — Repair major real functionality
Once P0 is stable:

### P1.1 — Fix workout logging
The audit found type mismatches around LoggedSet.
Fix: TrainDashboard, WorkoutLogger, LoggedSet types, actual Firestore payload, success/error handling.
Then test: Start workout → record sets → save → Firestore → refresh → data still exists

### P1.2 — Fix logout and account deletion
Logout should clear appropriate local client state.
Account deletion should actually delete Firebase account + Firestore user data.

### P1.3 — Fix Firestore write failures
Currently: Firestore write fails → console.warn → localStorage fallback → UI continues as though successful.
The UI needs to know: SYNCED vs LOCAL ONLY / SYNC FAILED.
Otherwise the user thinks their data is safely in the cloud when it isn't.

### P1.4 — Fix missing password-reset route
Login → Forgot password → currently broken.
Implement the real Firebase password reset flow.

### P1.5 — Fix Spotify properly
Spotify is not fake. The basic PKCE flow exists.
You need: Spotify Developer App → Client ID → correct redirect URI → FORME OAuth → token → Now Playing
Then fix: duplicate callback handling, token refresh, OAuth state, deprecated audio-features/BPM implementation.
Don't rebuild Spotify from scratch.

### P1.6 — Fix fake nutrition adherence
Current: 85% +2% is hardcoded.
This should be derived from actual food-log history.

### P1.7 — Fix fake progress photos
Current: Unsplash stock photo is pretending to be progress data.
That should either become a real user-upload feature or be clearly labeled as a demo.

---

## 🟡 P2 — Make the product reliable
After core functionality works:

### P2.1 — Automated testing
Install/use something like: Vitest + Playwright.
Test the most important flows: Signup, Login, Logout, Profile, Food logging, Workout logging, Weight logging, Spotify OAuth, Firestore persistence, Protected routes.

### P2.2 — Replace alert(), confirm(), prompt()
Replace them with your own modal/toast system.

### P2.3 — Fix data/persistence inconsistencies
Decide which data should be Firestore (canonical) and which data can legitimately remain local.
Reconsider leaving things like the workout/diet plan entirely in localStorage.

### P2.4 — Firestore indexes
Create the required composite index for food-log queries.

### P2.5 — Fix smaller technical issues
Elapsed workout timer, missing CSS variables, missing error states, accessibility labels, splash asset, duplicate localStorage patterns.

---

## 🔵 P3 — Features that need substantial new work
Do not distract with these right now.

### Google Health
Currently 100% mock. Requires a proper integration architecture and current Google API strategy. Do this after the core product is stable.

### Apple Health
Current React web app cannot access HealthKit. Requires a native iOS layer (iOS app → HealthKit → backend → FORME web app) or cross-platform native architecture. Don't waste time trying to make existing `connectPlatform('apple_health')` work.

### AI Coach
Currently keyword matching → fake response. A real implementation needs a secure server-side API layer. Do not put an API key in the frontend.

### Snap & Log
Currently a 2.5s delay fake prototype. Genuine version requires: image → vision model/API → structured nutrition result → validation → database.

---

## 🚨 STRATEGY SUMMARY
Repair and harden the existing product, not rebuild FORME from zero.

## YOUR NEW MASTER ROADMAP

### PHASE 0 — ENVIRONMENT
1. Firebase credentials
2. Firebase Auth configuration
3. Firestore configuration
4. Spotify developer configuration

### PHASE 1 — P0 CORE
5. Real login/signup
6. Session persistence
7. Protected routes
8. Firestore security rules
9. Profile persistence
10. Error handling
11. Remove silent auth/demo confusion

### PHASE 2 — P1 FUNCTIONAL
12. Workout logging
13. Food logging reliability
14. Logout cleanup
15. Account deletion
16. Password reset
17. Firestore error propagation
18. Spotify
19. Nutrition adherence
20. Progress photos

### PHASE 3 — P2 HARDENING
21. Playwright
22. Vitest
23. API/data-flow tests
24. Error states
25. Firestore indexes
26. localStorage strategy
27. Mobile testing
28. Accessibility
29. Performance

### PHASE 4 — P3 NEW ARCHITECTURE
30. Real AI Coach
31. Real Snap & Log
32. Google Health
33. Apple Health/native app
34. Push notifications
35. Offline architecture

### PHASE 5 — FINAL POLISH
36. Premium animations
37. Micro-interactions
38. Advanced charts
39. Visual refinement
40. Final regression testing
