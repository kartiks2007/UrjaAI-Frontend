# Frontend audit and implementation record

No existing UrjaAI application was found in the workspace or saved projects. Ponytail is a separate downloaded repository and is not application code. The old UrjaAI conversations establish the monitoring-to-owner-decision-to-sharing loop; newer user specifications override historical SCT-013, TFT and speculative TinyML claims. Current hardware is ESP32, PZEM-004T V3, CT and 16×2 I²C LCD.

## Selected tooling

| Tool                                     | Purpose and reason                                               | Where                    |
| ---------------------------------------- | ---------------------------------------------------------------- | ------------------------ |
| React + TypeScript + Vite                | Typed component application with a small build pipeline          | Frontend                 |
| Tailwind 4 + CSS tokens                  | Consistent industrial product design                             | Styles                   |
| Owned shadcn-style button + Radix Dialog | Small component foundation and accessible modal focus management | UI primitives            |
| Lucide                                   | One coherent icon family                                         | Navigation and status    |
| Zod + native forms                       | Validate forms without a second form-state abstraction           | Forms and API boundaries |
| TanStack Query                           | Cancellation, caching, mutations and invalidation                | Central API hooks        |
| Recharts                                 | One chart package for operational time series                    | Lazy-loaded charts       |
| Supabase JS                              | Real auth/session/password recovery only                         | Auth provider            |
| Vitest + Testing Library + Playwright    | Domain, component and route/browser verification                 | Tests                    |
| Official docs + shell + browser          | Source verification, build and visual QA                         | Development only         |

No shadcn MCP/skill is exposed in this session. Official documentation is the fallback. MCP is not a runtime dependency. No backend, database migrations, firmware, cloud accounts or secrets are fabricated as part of this frontend task.

## Architecture and order

1. Tokens, small UI primitives and typed domain/API contract.
2. Routes, responsive shell, public landing page.
3. Supabase auth and protected routes, server-verified organization context.
4. Overview, machines, device/calibration management, energy, alerts.
5. Share discovery/publication, availability and booking actions.
6. Reports, organization, profile and administrator views.
7. Tests, responsive visual inspection, build and Vercel instructions.

Production reads only configured APIs. The development-only `/preview/*` routes are explicit read-only design review, with empty datasets and no session impersonation. They are unavailable in production. Missing backend configuration is an error/setup state, never a fabricated success. The backend must implement the documented contract before end-to-end operational acceptance can pass.
