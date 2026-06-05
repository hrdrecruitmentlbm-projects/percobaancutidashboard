<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack

- Next.js 16.2.7, React 19.2.4, TypeScript 5
- Tailwind v4 (`@tailwindcss/postcss`), `oklch` color tokens, dark mode supported
- shadcn (`style: base-nova`, base `neutral`) — primitives in `src/components/ui/`
- `googleapis` 173, `recharts` 3, `lucide-react`

## Scripts

- `npm run dev`, `npm run build`, `npm run start`, `npm run lint`
- **No `test` or `typecheck` script.** Do not run `npm test` or `tsc` and assume they exist. If you need to typecheck, run `npx tsc --noEmit` directly.

## Conventions

- Path alias `@/*` → `./src/*`. Use `cn()` from `@/lib/utils` for class merging.
- All UI strings are Indonesian. Keep them Indonesian.
- Every page component is `'use client'`. Layouts (`layout.tsx`) are server components.
- `error.tsx` and `loading.tsx` exist for every route — keep them when adding new routes.

## Backend (`src/lib/google-sheets.ts`)

Read-only Google Sheets API. Three hardcoded ranges:

- `DATABASE KARYAWAN!A2:H` — employee master
- `Inputan Cuti!A7:L` — leave requests (row 7 is the first data row; A–F is metadata, G–H are the two leave days)
- `Leaders!A:B` — division leaders (skips header row)

**60-second in-memory cache.** Sheet edits won't surface for ~60s in dev. Restart `next dev` to bust it immediately. `Leaders` is not cached (intentional — leadership changes need to be live).

## Env vars (in `.env.local`)

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY` (escaped with `\\n`; `google-sheets.ts` does the replacement)
- `SPREADSHEET_ID`

Never commit `.env.local`. Never read it into client code.

## Auth model

- Email-only, no password. Three roles: `admin`, `leader`, `employee`.
- Admin emails are hardcoded in `src/app/api/auth/route.ts:4` (`ADMIN_EMAILS`). Add new admins there.
- Session = `localStorage` + `userSession` cookie. Helpers in `src/lib/auth.ts`.
- Route gating is **two-layered** and must stay in sync:
  - Server: `src/middleware.ts` checks the `userSession` cookie.
  - Client: `src/lib/auth.ts:28` `canAccessRoute(role, path)` is enforced by `src/components/dashboard-layout.tsx`.
- A leader's `division` comes from the `Leaders` sheet row that matches their email.
- An admin may not exist in the `DATABASE KARYAWAN` sheet; `/api/my-leave` returns `employee: null` for that case — handle the empty state, do not 404.

## Domain rules (`src/lib/leave-calculator.ts`)

- **Leave quota:**
  - Year 1 (haven't completed 1 year): **0 days**
  - Year 2 (exactly 1 year): `max(1, 12 - joinMonth)` — May joiner = 7, December joiner = 1
  - Year 3+ (2+ years): **12 days**
- **Leave type filter:** "Melahirkan" (maternity) is the **only** `jenisCuti` excluded from annual-leave counts. All other rows in `Inputan Cuti` count as annual leave, including empty `jenisCuti`.
- **Two-date semantics:** `tanggalCutiPertama` (col G) and `tanggalCutiKedua` (col H) are **two separate leave days**, not a range. Same day = 1, different days = 2. There is no multi-day range concept.
- All quota math is **current year only**. No historical carryover.

## Parsing helpers (use these, do not bypass)

- Dates → `parseIndonesianDate` / `formatToIndonesianDate` in `src/lib/indonesian-date.ts`. Handles ISO (`2026-01-19`), Indonesian (`25 Desember 2025`), and English (`25 December 2025`) month names.
- String normalization → `cleanField` in `src/lib/name-cleaner.ts`. Strips extra whitespace/underscores.
- Name equality → `namesMatch` in `src/lib/name-cleaner.ts`. Case-insensitive, whitespace/underscore tolerant. Do **not** use `===` on names.

## UI

- Wrap every page body in `DashboardLayout` (provides Sidebar + Header).
- Sidebar collapses to a drawer below `lg` breakpoint.
- Charts (recharts) use the project's `COLORS` / `DIVISION_COLORS` constants — keep them consistent across pages.

## Anti-patterns

- Do not add a password / OAuth / magic-link flow. Auth is email-only by design.
- Do not add a `test` or `typecheck` npm script without confirming with the user.
- Do not introduce a different date parser. Use `parseIndonesianDate` everywhere.
- Do not compare names with `===`. Use `namesMatch`.
- Do not import `@/lib/google-sheets` from a client component. It pulls in `googleapis` and will break the bundle.
- Do not write the service account JSON / private key into client code or commit it.
- Do not assume `localStorage` exists on the server. Use the `typeof window === 'undefined'` guard pattern from `src/lib/auth.ts`.

## Workflow conventions

See repo-root `AGENTS.md` for session-end reporting to `progress.md` and the subagent/skill dispatch convention.
