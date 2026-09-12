# DEPLOYMENT.md

> This guide explains how to run the project locally, build it for production, and deploy it to Cloudflare Pages.

---

## Local Development

### Prerequisites
- Node.js v20 or later
- npm v10 or later

### Setup

```bash
# 1. Clone or download the project
cd forme

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Open .env and fill in your Firebase credentials
# (See "Environment Variables" section below)

# 4. Start the development server
npm run dev
```

The app will open at **http://localhost:5173**

- Landing page: http://localhost:5173/landing
- Login: http://localhost:5173/login
- Signup: http://localhost:5173/signup

> **No Firebase?** If you leave the `.env` file empty or with placeholder values, the app runs in read-only Demo Mode. Click "Explore with Demo Profile" on the landing page.

---

## Production Build

```bash
npm run build
```

This runs TypeScript type checking (`tsc -b`) then Vite's production bundler.

Output goes to the `dist/` directory:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js     (~1.4 MB, includes Firebase + Recharts)
│   └── index-[hash].css    (~57 KB)
├── favicon.svg
├── icons.svg
└── _redirects              (Cloudflare Pages SPA routing)
```

To preview the production build locally:
```bash
npm run preview
# Opens at http://localhost:4173
```

---

## GitHub Setup

> **Note:** Git is not currently installed on this machine. You need to install Git first.

### Install Git
Download from: https://git-scm.com/download/win  
During install, select "Git from the command line and also from 3rd-party software".

### Initialize Repository

```bash
# In the forme/ directory:
git init
git add .
git commit -m "Initial commit: ForMe production-ready deployment"
```

### Push to GitHub

1. Create a new repository on https://github.com (name it `forme` or similar)
2. Do NOT initialize with README (you already have one)

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

> ⚠️ **NEVER commit `.env`** — it is in `.gitignore`. Only commit `.env.example`.

---

## Cloudflare Pages Deployment

### First-time Setup

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Authorize Cloudflare to access your GitHub account
4. Select your `forme` repository
5. Configure the build:

| Setting | Value |
|---|---|
| **Framework preset** | Vite |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (leave blank) |
| **Node.js version** | `20` |

6. Click **Save and Deploy**

### Environment Variables (REQUIRED)

In Cloudflare Pages → your project → **Settings** → **Environment variables** → **Production**:

| Variable name | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | e.g. `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | e.g. `your-project.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `VITE_FIREBASE_APP_ID` | Your app ID |

> **Where to find these values:** Firebase Console → Project Settings → Your apps → Web app → SDK setup and configuration → Config

After adding variables, click **Save** and then **Retry deployment** to rebuild with the new variables.

### SPA Routing (already configured)

The file `public/_redirects` ensures all routes (like `/landing`, `/login`, etc.) fall back to `index.html` for client-side routing. This file is included in the build and works automatically on Cloudflare Pages.

---

## Redeploying After Code Changes

Once Cloudflare Pages is connected to GitHub:

```bash
# Make your changes, then:
git add .
git commit -m "Your change description"
git push origin main
```

Cloudflare Pages automatically detects the push and redeploys. Deployment typically takes 1-3 minutes.

---

## Connecting a Custom Domain

1. In Cloudflare Pages → your project → **Custom domains** → **Set up a custom domain**
2. Enter your domain (e.g. `www.yourdomain.com`)
3. If the domain is already managed by Cloudflare DNS, records are added automatically
4. If not, follow Cloudflare's instructions to update your domain's nameservers

> **Note:** The final domain has not been decided yet. The Cloudflare-provided URL (`*.pages.dev`) is suitable for development and testing.

---

## Firebase Setup (Required for Auth to Work)

1. Go to https://console.firebase.google.com/
2. Create a project (or use existing)
3. Add a **Web app** (`</>` icon)
4. Copy the `firebaseConfig` values to your `.env` / Cloudflare environment variables
5. Enable **Authentication** → Sign-in methods:
   - Email/Password ✓
   - Google ✓
6. Enable **Firestore Database** → Create database
   - Start in **test mode** for development
   - Switch to **production rules** before public launch
7. Add your production domain to Firebase **Authorized domains**:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add your `*.pages.dev` URL and later your custom domain

---

## Environment Variables Reference

| Variable | Dev (`.env`) | Prod (Cloudflare dashboard) |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Your value | Your value |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your value | Your value |
| `VITE_FIREBASE_PROJECT_ID` | Your value | Your value |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your value | Your value |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your value | Your value |
| `VITE_FIREBASE_APP_ID` | Your value | Your value |

---

## Common Errors and Troubleshooting

### "Firebase: Error (auth/...)" on login

- Firebase is not configured. Add all `VITE_FIREBASE_*` variables to your `.env`
- Or your Firebase project's authorized domains don't include the current URL

### Routes return 404 on refresh in production

- The `public/_redirects` file handles this for Cloudflare Pages
- If you're hosting elsewhere (Netlify, Vercel, etc.), equivalent redirect rules are needed

### Build fails with TypeScript errors

```bash
# Run the type checker alone to see errors
npx tsc -b --noEmit
```

### "VITE_CONFIG_NATIVE_IGNORE_WARNING" message in build output

This is a harmless informational warning from Vite 8 about config loader compatibility. It does not affect the build.

### Large bundle warning (>500 kB)

Expected. Firebase SDK + Recharts + React account for the size. The `chunkSizeWarningLimit` is set to 1600 kB in `vite.config.ts`. Future optimization: code splitting with dynamic `import()`.

### Localhost vs Production

| | Development | Production |
|---|---|---|
| URL | http://localhost:5173 | https://your-project.pages.dev |
| Env vars | `.env` file | Cloudflare Pages dashboard |
| Routing | Vite dev server handles all routes | `_redirects` file handles SPA fallback |
| HTTPS | No (HTTP) | Yes (automatic) |
| Hot reload | Yes | No |
