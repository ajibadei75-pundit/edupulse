## What ships in this build (real, end-to-end)

### 1. Auth upgrades
- **Multi-step signup wizard** (4 steps): name/email/phone → country/institution/level → interests/goals → role pick (student / tutor / parent). Writes to `profiles` + assigns role.
- **Phone (SMS OTP) login** via Lovable Cloud — enabled in auth config, added as a third tab on `/auth` alongside email and Google.

### 2. New roles + dashboards
- Enum already has `tutor`. Add `parent` to `app_role`.
- **Tutor dashboard** (`/dashboard/tutor`): create courses + lessons, create CBT questions, view enrolled students, schedule classes (manual link field for now — no Zoom/Meet API yet).
- **Parent dashboard** (`/dashboard/parent`): link a child by invite code (generated on student profile), view child's CBT scores, course progress, attendance.
- New table: `parent_links (parent_id, student_id, status)` with RLS.

### 3. CBT engine upgrade
- Add question types: `multi_select`, `true_false`, `fill_gap`, `numerical` (DB column already exists as `type`).
- **Bulk CSV upload** for tutors/admins (paste CSV, parse client-side, insert).
- **Anti-cheat lite**: fullscreen lock + tab-switch detection (counts switches, surfaces warning, auto-submits at 3).
- Practice vs Exam mode toggle (Practice = instant answer feedback).

### 4. AI Study Assistant
- New `/dashboard/ai-tutor` route. Streaming chat using Lovable AI Gateway (`google/gemini-3-flash-preview`, no key needed).
- Quick-actions: "Explain this topic", "Generate a 10-Q quiz on X", "Summarize my notes" (paste text).
- Server route at `src/routes/api/chat.ts`, persists conversations to `ai_conversations` + `ai_messages` tables.

### 5. Polish pass
- Install `framer-motion`. Add page transitions on dashboard routes, fade-in on cards, skeleton loaders on data-fetching pages.
- **PWA manifest only** (installable, not offline) — `public/manifest.webmanifest`, icons, theme color, head tags. Skipping service worker (offline) to avoid Lovable preview issues.

## Explicitly NOT in this build (need your input)

These need credentials or are weeks of work each — I'll scaffold landing UI only if you ask, and we ship them as separate focused builds:

- **Zoom / Google Meet / Microsoft Teams integration** — each needs you to register an OAuth app at the provider and paste client ID + secret. Tell me which one(s) and I'll do that build next.
- **Payments (Paystack / Flutterwave)** — need your live + test API keys. Subscription gating logic is a separate build.
- **2FA / webcam proctoring / AI cheating detection** — substantial features; each its own build.
- **Email/SMS/WhatsApp notification system** — Twilio (SMS/WhatsApp) needs your account SID + key; email transactional needs domain setup.
- **E-book marketplace, alumni network, internship board, research repository** — each is essentially its own product surface.

## DB changes (one migration)

- `ALTER TYPE app_role ADD VALUE 'parent'`
- `ALTER TABLE profiles` → add `country`, `institution`, `interests text[]`, `goals text`, `invite_code text unique`
- `CREATE TABLE parent_links` + RLS (parent sees own links; student sees own; admin sees all)
- `CREATE TABLE ai_conversations` + `ai_messages` + RLS (owner-only)
- Trigger: auto-generate `invite_code` on profile insert

## Tech additions
- `bun add framer-motion` (animations)
- `bun add papaparse` (CSV parsing for bulk question upload)
- `supabase--configure_auth` is not needed; phone auth toggle is in the Cloud auth UI — I'll add the UI and instruct you to flip it on if it isn't already.

## Why this scope
A focused build of these five areas gets you visible depth across auth, roles, CBT, AI, and polish in one pass. Trying to also ship Zoom/payments/2FA/notifications in the same turn would mean every one of them ends up half-built and broken. Confirm and I start, or tell me which sections to drop/swap.
