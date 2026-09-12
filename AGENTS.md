# AGENTS.md

## Project: ForMe (temporary internal name)

This file provides guidance for AI assistants and agents working on this codebase.

---

## Critical Rules

1. **DO NOT rename the product.** "ForMe" is a temporary internal name. The final product name will be decided later. Do not change any branding, logos, or product naming.
2. **DO NOT rebuild the UI.** The existing application is the source of truth. Only make changes that are explicitly requested.
3. **DO NOT commit `.env` files.** Environment variables must be set locally in `.env` (gitignored) and in Cloudflare Pages dashboard for production.
4. **DO NOT expose secrets.** Firebase config values in `VITE_*` variables are client-side by design (Firebase Web SDK), but no server-side secrets should ever be added to client-side code.

---

## Architecture Summary

- **Framework:** React 19 + TypeScript + Vite 8
- **Routing:** React Router v7 (client-side SPA, `BrowserRouter`)
- **State:** Zustand v5
- **Backend:** Firebase (Auth + Firestore + Storage) — no custom server
- **Styling:** Tailwind CSS v4 + custom CSS design system in `src/index.css`
- **Hosting:** Cloudflare Pages (static SPA deployment)

See `PRODUCT_ARCHITECTURE.md` for full details.

---

## Key Files

| File | Purpose |
|---|---|
| `src/App.tsx` | Root component, routing, auth guard |
| `src/features/auth/LandingPage.tsx` | Public landing page at `/landing` |
| `src/lib/firebase/config.ts` | Firebase initialization (reads `VITE_*` env vars) |
| `src/store/authStore.ts` | Auth state, demo mode logic |
| `public/_redirects` | Cloudflare Pages SPA routing fallback |
| `.env.example` | Environment variable template |
| `vite.config.ts` | Vite build config |

---

## Routes

| Route | Auth required |
|---|---|
| `/landing` | No |
| `/login` | No |
| `/signup` | No |
| `/` | Yes |
| `/eat` | Yes |
| `/plan` | Yes |
| `/train` | Yes |
| `/progress` | Yes |
| `/profile` | Yes |

---

## Environment Variables

All `VITE_FIREBASE_*` variables are required for auth to work. Without them, the app runs in Demo Mode (read-only, no Firestore). See `.env.example` for the full list.

---

## Local Development

```bash
npm install
cp .env.example .env   # fill in Firebase credentials
npm run dev            # http://localhost:5173
```

## Production Build

```bash
npm run build          # outputs to dist/
```

## Deployment

Cloudflare Pages connected to GitHub. Push to `main` triggers auto-deploy.  
See `DEPLOYMENT.md` for complete setup instructions.

---

## What to Avoid

- Do not install unnecessary dependencies
- Do not change the Tailwind/CSS design system unless explicitly asked
- Do not add server-side rendering — this is a pure static SPA
- Do not add new Firebase services without documenting them here
- Do not modify Firebase Security Rules through code — do it in the Firebase Console
