# PRODUCT_ARCHITECTURE.md

> **Note:** "ForMe" is the temporary internal product name. The final product name has not been decided. This document will be renamed when the brand is finalized.

---

## Overview

A mobile-first Indian fitness and nutrition Progressive Web App (PWA-ready). The app provides personalized meal tracking, workout planning, and body recomposition analytics built specifically for Indian food, budgets, and schedules.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 (with Strict Mode) |
| Build tool | Vite 8 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 + custom CSS design system |
| Routing | React Router v7 (BrowserRouter / client-side SPA) |
| State management | Zustand v5 (with `persist` middleware) |
| Backend / Auth | Firebase (Auth + Firestore + Storage) |
| Charts | Recharts v3 |
| Icons | Lucide React |
| Date utilities | date-fns v4 |
| Linter | Oxlint |

---

## Frontend Architecture

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Root component: BrowserRouter + Auth guard + routing
├── index.css                 # Global design system (CSS custom properties, utilities)
│
├── features/                 # Feature-sliced architecture
│   ├── auth/                 # Landing, Login, Signup pages
│   ├── home/                 # Home dashboard
│   ├── eat/                  # Food tracking dashboard
│   ├── plan/                 # Meal plan dashboard
│   ├── train/                # Training dashboard
│   ├── progress/             # Progress tracking dashboard
│   ├── profile/              # User profile page
│   └── onboarding/           # Onboarding flow (post-signup)
│
├── components/
│   ├── layout/               # AppShell (bottom nav, layout wrapper)
│   └── ui/                   # Reusable UI components
│
├── store/                    # Zustand stores
│   ├── authStore.ts          # Firebase auth state + demo user mode
│   ├── userStore.ts          # User profile data (Firestore)
│   ├── foodLogStore.ts       # Food logging state
│   ├── progressStore.ts      # Progress tracking state
│   ├── toastStore.ts         # Global toast notifications
│   └── waterStreakStore.ts   # Water intake streak tracking
│
├── lib/
│   ├── firebase/
│   │   ├── config.ts         # Firebase SDK initialization (reads VITE_* env vars)
│   │   ├── authService.ts    # Auth operations (signup, login, Google, logout)
│   │   └── dataService.ts    # Firestore CRUD operations
│   ├── engines/
│   │   ├── dietEngine.ts     # BMR/TDEE/macro calculation logic
│   │   ├── workoutEngine.ts  # Workout plan generation logic
│   │   └── nlpParser.ts      # Natural language food log parsing
│   ├── calculations/         # Body measurement calculations
│   └── data/                 # Static data (Indian food database, exercises)
│
└── types/                    # TypeScript type definitions
```

---

## Routing

This is a **client-side SPA** using React Router's `BrowserRouter`. There is NO server-side rendering.

| Route | Component | Auth required |
|---|---|---|
| `/landing` | `LandingPage` | No |
| `/login` | `LoginPage` | No (redirects to `/` if logged in) |
| `/signup` | `SignupPage` | No (redirects to `/` if logged in) |
| `/` | `HomeDashboard` | Yes |
| `/eat` | `EatDashboard` | Yes |
| `/plan` | `PlanDashboard` | Yes |
| `/train` | `TrainDashboard` | Yes |
| `/progress` | `ProgressDashboard` | Yes |
| `/profile` | `ProfilePage` | Yes |
| `/*` (unauthenticated) | `LandingPage` | — |
| `/*` (authenticated) | Redirects to `/` | — |

**SPA routing note:** The `public/_redirects` file routes all paths to `index.html` on Cloudflare Pages, enabling client-side routing to work correctly on refresh and direct URL access.

---

## Backend Architecture

There is **no custom backend server**. All backend functionality is provided by Firebase:

### Firebase Authentication
- Email/Password login and signup
- Google OAuth (sign-in with popup)
- Password reset via email
- Email verification on signup

### Firestore Database
- `users/{uid}` — user profile, onboarding data, preferences
- Food logs, progress entries, and other user data are stored per-user

### Firebase Storage
- Currently initialized but not actively used for media uploads (reserved for future profile photos)

### Unconfigured / Demo Mode
If `VITE_FIREBASE_API_KEY` is not set or contains the placeholder value `YOUR_API_KEY`, the app gracefully skips Firebase initialization and marks auth as initialized with no user. This allows the **Demo Mode** (`Explore with Demo Profile`) to work without Firebase credentials.

---

## AI / Intelligence Integrations

There are **no external AI API calls** (no OpenAI, Gemini, etc.). All intelligence is client-side:

| Engine | Description |
|---|---|
| `dietEngine.ts` | Calculates BMR (Mifflin-St Jeor), TDEE, and macro targets |
| `workoutEngine.ts` | Generates progressive overload workout plans |
| `nlpParser.ts` | Parses natural language food inputs (e.g. "2 roti + dal") |

---

## Authentication Flow

```
App loads
  → AuthStore.initialize()
      → If Firebase configured: subscribe to onAuthStateChanged
      → If not configured: set isInitialized=true, no user
  → isInitialized=false → Show loading spinner
  → isInitialized=true, no user → Show LandingPage (or /landing / /login / /signup)
  → isInitialized=true, user exists, onboardingComplete=false → OnboardingFlow
  → isInitialized=true, user exists, onboardingComplete=true → AppShell + authenticated routes
```

---

## Deployment Architecture

```
Local development (Vite dev server, port 5173)
         ↓  npm run build
    dist/ (static files: index.html + assets/)
         ↓  Git push to GitHub
    GitHub repository
         ↓  Cloudflare Pages auto-deploy
    Cloudflare Pages (global CDN, HTTPS)
         ↓
    Public HTTPS URL (*.pages.dev or custom domain)
```

**Hosting:** Cloudflare Pages  
**Type:** Static site (pure SPA — no server functions required)  
**Build command:** `npm run build`  
**Output directory:** `dist`  
**Node version:** 20+ (set in Cloudflare Pages environment settings)  

---

## Environment Variables

All environment variables are Vite `VITE_*` prefixed (they get inlined into the client bundle at build time).

| Variable | Required | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Yes (for auth) | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes (for auth) | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes (for auth) | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes (for auth) | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes (for auth) | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes (for auth) | Firebase app ID |

**Security note:** Firebase Web SDK config values (apiKey, etc.) are designed to be public-facing — they are not secret in the traditional sense. Security is enforced by Firebase Security Rules in the Firebase Console. Do NOT store server-side secrets (database admin keys, service account credentials) in these variables.

---

## Security Considerations

- All Firebase config is client-side (this is normal for Firebase Web SDK)
- Firebase Security Rules must be configured in the Firebase Console before production launch
- Firestore should be switched from test mode to production rules
- No server-side secrets exist in this architecture
- HTTPS is provided automatically by Cloudflare Pages

---

## Future Expansion Points

- **Custom domain:** Can be connected in Cloudflare Pages → Custom domains at any time
- **Push notifications:** Firebase Cloud Messaging (FCM) is available in the Firebase project
- **Backend functions:** Cloudflare Workers or Firebase Cloud Functions can be added for server-side logic
- **Native app:** React Native + shared logic layer (engines are pure TypeScript, easily portable)
- **Offline support:** Service worker / PWA manifest can be added via `vite-plugin-pwa`
- **Analytics:** `VITE_FIREBASE_MEASUREMENT_ID` can be added for Firebase Analytics
