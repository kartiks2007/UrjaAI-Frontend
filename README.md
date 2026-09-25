# UrjaAI frontend

Backend update: the sibling `urjaai-backend` directory now contains the Express/PostgreSQL API, migrations and tests. Configure both projects to use your actual Supabase project and backend URL. The initial frontend acceptance boundary below describes the original frontend-only delivery, not the subsequent backend implementation.

React + TypeScript + Vite frontend for industrial energy monitoring and owner-controlled capacity sharing. Built from the supplied frontend specification, informed by available archived UrjaAI conversations. The newer ESP32 / PZEM-004T V3 / CT / 16×2 I²C LCD requirements supersede historical hardware ideas.

## Run

Requires Node.js 24 and pnpm. From this directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open the printed localhost URL. `/` is the public website. In development, `/preview/dashboard` provides an explicitly labeled, read-only design review of the workspace without credentials. Review pages contain no fabricated operational data and cannot save changes. They are excluded from the production build.

For environments where Vite's development dependency optimizer cannot access ancestor directories, run `pnpm review`. This builds a separate development review bundle into `review-dist` and serves it on http://127.0.0.1:5173. Re-run after source changes. Never deploy `review-dist`.

## Connect real services

Copy `.env.example` to `.env.local` and configure:

- `VITE_API_URL`: your backend API base URL, including its version prefix.
- `VITE_SUPABASE_URL`: your Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: the public browser key; never a service-role key.

Configure Supabase's site URL and allowed `/reset-password` redirect URLs for each deployment. Supabase provides authentication only; application data goes through the centralized backend client using the current access token. Configure backend CORS for the frontend origin. See `docs/API_CONTRACT.md` and `src/types/domain.ts` for the current integration contract.

## Implemented surfaces

Public landing, signup, login, password recovery; protected dashboard; searchable/filterable machines; machine telemetry, analytics, state history, calibration and device provisioning/revocation; energy, alerts and CSV reporting; Share discovery, draft publication/pausing, availability and booking requests/decisions; organization settings, profile/password/notification settings and restricted administrator views.

Machine operating state and device connectivity are separate. Stale values are identified. Invalid chart samples are excluded. Missing metrics use dashes, not synthetic zeroes. Electricity tariffs and calibration thresholds must be configured. Idle alerts never publish listings. Destructive and publication actions require confirmation.

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

Browser tests use installed Microsoft Edge, desktop and mobile viewports. The Playwright configuration starts/reuses the local review server. Screenshots are in `qa/`; these are UI review captures, not live operational results.

## Deploy to Vercel

Import [UrjaAI-Frontend](https://github.com/kartiks2007/UrjaAI-Frontend) into Vercel. This repository's root is the Vite project root. Select Vite, Node 24, install command `pnpm install --frozen-lockfile`, build command `pnpm build`, and output directory `dist`. The included `vercel.json` handles client-side route reloads and response headers.

Set these Vercel environment variables for Production (and Preview when testing previews):

| Name | Value |
| --- | --- |
| `VITE_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase publishable/anon key only |

Vite embeds these public values when it builds. Redeploy after changing them. Never enter the PostgreSQL URL, Gemini key, Twilio secrets, or a Supabase service-role key in Vercel `VITE_` variables. Add the deployed Vercel origin to the backend's `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL`. In Supabase Auth URL Configuration, set the deployed site URL and allow its `/dashboard` and `/reset-password` redirects. Verify signup, email confirmation, login, password reset, dashboard loading, and direct route reloads on the deployed URL.

## Acceptance boundary

The frontend is connected to the sibling backend and Supabase for local development. Cloud deployment, production configuration, live ESP32 telemetry, and real WhatsApp delivery are not yet accepted. Admin views provide inspection rather than destructive administration. API response shapes are typed but not comprehensively runtime-validated. Review all supplied prompt requirements against the deployed staging system before production acceptance.
