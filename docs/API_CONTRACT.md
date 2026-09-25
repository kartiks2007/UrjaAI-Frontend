# Expected backend integration contract

Update: an implemented backend now exists in the sibling `urjaai-backend` directory. Its `docs/API.md` is authoritative. In particular, listing ownership uses server-derived `can_manage`, and internal `machine_id` is omitted for other organizations. Live service integration is still pending.

This describes the frontend's expected API, not an existing verified backend. Reconcile names and DTOs before connecting another implementation. Base URL comes from `VITE_API_URL`. Requests carry `Authorization: Bearer <Supabase access token>` and JSON content type. All paths below are relative to that base.

Successful reads return the DTO directly (no `data` wrapper). Paginated results use `{ items, total, page, page_size }`. Unknown readings must be `null`; array fields must be arrays, including when empty. Timestamps are ISO 8601. Form date-times are converted from local input to ISO. Domain fields and unions are defined in `src/types/domain.ts`; validated request bodies are in `src/lib/schemas.ts` and each form declaration.

Errors: appropriate HTTP status with `{ "error": { "code": "FORBIDDEN", "message": "Safe user-facing explanation" } }`. Use 401 for expired sessions, 403 for forbidden scope, 404 for missing resources, 409 for booking conflicts, 422 for invalid fields and 429 for rate limits. Never return internal secrets in error text. Mutations may return 204 unless the frontend consumes their result.

| Area            | Expected endpoints                                            | Read DTO / behavior                                                                               |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Identity        | `GET /auth/me`                                                | `Me`, including server-derived role and organization                                              |
| Overview        | `GET /dashboard`                                              | `Summary`; metrics must distinguish measured, calculated and estimated values                     |
| Machines        | `GET, POST /machines`; `GET /machines/:id`                    | `Page<Machine>` / `Machine`; list accepts search, state, connectivity, sort, page and page_size   |
| Telemetry       | `GET /machines/:id/latest`; `GET /machines/:id/telemetry`     | `Telemetry` or null; `Page<Telemetry>`; history accepts from, to, interval, page_size             |
| State history   | `GET /machines/:id/states`                                    | `Page<StatePeriod>`; from/to filters                                                              |
| Calibration     | `PUT /machines/:id/calibration`                               | Validated machine-specific threshold/duration fields                                              |
| Devices         | `POST /machines/:id/devices`; `POST /devices/:id/revoke`      | Provisioning returns `{ credential: string }`; display once, never persist in frontend storage    |
| Energy          | `GET /energy`                                                 | `Energy`; from/to filters                                                                         |
| Alerts          | `GET /alerts`; `GET /machines/:id/alerts`                     | `Page<Alert>`; status and page_size filters                                                       |
| Alert actions   | `POST /alerts/:id/acknowledge`; `POST /alerts/:id/resolve`    | Owner/admin authorization required                                                                |
| Reports         | `GET /reports`                                                | `Energy`; from, to and optional machine_id; browser exports returned machine rows to CSV          |
| Share           | `GET, POST /share/listings`; `GET, PATCH /share/listings/:id` | `Page<Listing>` / `Listing`; list accepts view, search, location, machine_type, date, page_size   |
| Availability    | `POST /share/listings/:id/availability`                       | Validated start/end ISO timestamps; see availability schema for exact body mapping                |
| Booking request | `POST /share/listings/:id/requests`                           | requested_start, requested_end and optional message                                               |
| Bookings        | `GET /bookings`                                               | `Page<Booking>` with server-calculated can_accept/can_reject/can_cancel flags; view and page_size |
| Decisions       | `POST /bookings/:id/accept`, `/reject`, `/cancel`             | Transactional conflict and ownership enforcement; no client-side reservation authority            |
| Admin           | `GET /admin/:resource`                                        | `Page<AdminEntry>`; users, organizations, machines, devices, listings, bookings, audit-logs       |

Organization, profile and notification form paths are declared in `src/pages/Settings.tsx`. Supabase handles signup/signin, recovery, password changes and logout directly. The browser must not query application database tables directly.

## Server requirements

- Validate the token, scope every resource to the authorized organization and check ownership independently of query parameters or hidden UI controls.
- Public listing responses must omit private machine telemetry and device credentials. Changing the URL to `owner=1` is not authority.
- Publish only after an explicit authorized PATCH; no idle-state-triggered publication. Validate listing content and availability at publication time.
- Recheck availability and conflicts atomically when accepting a booking. Decide and document lifecycle semantics before integrating payments or completion workflows.
- Classify OFF/IDLE/RUNNING using machine-specific calibration. Offline devices retain stale last-known state instead of becoming OFF.
- Compute aggregate energy/runtime consistently across resets, missing samples, time zones and reporting boundaries. Missing tariff means unknown cost, not a default tariff.
- Apply request rate limits, safe logs, audit trails and one-time credential handling. Frontend role checks improve UX but are not security controls.

No live API compatibility or server security claim has been validated by this frontend build.
