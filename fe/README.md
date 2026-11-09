# GABERA Enterprise Portal

A single-page-style enterprise frontend scaffold built with Next.js (App Router) and React, exported as a fully static site.

## Stack

- **Next.js / React** — `output: "export"` produces a static site in `out/` (no Node server required at runtime).
- **Material UI (MUI)** — component library and theming (`src/theme/theme.js`).
- **React Query** (`@tanstack/react-query`) — server-state/data-fetching layer, wired up in `src/app/providers.js`.
- **Jotai** — client state atoms for auth, selected menu item, and locale (`src/store/atoms.js`), persisted to `localStorage`.
- **Axios** — HTTP client with auth-token interceptor (`src/lib/apiClient.js`).
- **Localization** — lightweight custom i18n (`src/i18n`) with English and Czech dictionaries.
- **Authentication** — client-side auth gate (`src/features/auth`) suitable for a statically exported app (no server sessions/API routes).

## Getting started

```bash
npm run dev      # start the dev server at http://localhost:3000
npm run build    # type-check, lint-safe production build, static export to ./out
npm run lint      # run ESLint
```

Sign in with the demo credentials `demo` / `demo` when no backend is configured.

## Configuring a real backend

Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_API_BASE_URL` to your API's base URL. Once set, `src/features/auth/authApi.js` will call `POST {NEXT_PUBLIC_API_BASE_URL}/auth/login` via the shared Axios instance instead of using the demo fallback.

## Structure

```
src/
  app/            # root layout, providers, and the single page
  components/     # AppShell (top menu: About us / Contact)
  features/
    auth/         # AuthGate, LoginForm, authApi
    content/      # AboutUs, Contact (placeholder content)
  i18n/           # useTranslation hook + locale dictionaries
  lib/            # axios instance, React Query client factory
  store/          # Jotai atoms
  theme/          # MUI theme
```

## Static export

`next.config.mjs` sets `output: "export"` and `images.unoptimized: true`. Running `npm run build` generates a static site under `out/`, which can be hosted on any static file server or CDN.

## Run chrome local with disable-web-security
Start-Process chrome -ArgumentList 'http://localhost:3000', '--disable-web-security', '--user-data-dir="c:\chrome-dev-data"'

<!-- 
demo
OmegaMega912 
-->

