## Reality check first

The brief describes a platform the size of Coursera + Google Classroom + Discord + Moodle combined — 10+ ecosystem modules, 7 admin roles, AI features, payments, realtime, certificates, analytics. That is realistically **6–18 months of work for a full team**, not a single build.

What I can deliver in this first build is a **production-quality v1 foundation** the rest can layer onto, instead of 50 broken stub pages. I will be honest about what is real vs. scaffolded so you know exactly where we are.

Design direction: **v3 Immersive Gradient** (locked palette + Montserrat/Poppins/Lato verbatim, heartbeat → book motion motif).

## What ships in v1 (real, working)

### 1. Brand & design system
- Tokens in `src/styles.css`: `--primary #0A3D91`, `--secondary #00A86B`, `--accent #FFB000`, `--highlight #FF5A36`, `--bg #F8FAFC`, `--dark #0F172A`, plus success/error/warning, all in oklch. Light + dark mode + auto.
- Fonts via `<link>` in `__root.tsx` head: Montserrat (800/900), Poppins (500/600), Lato (400/700). Mapped to `--font-display`, `--font-ui`, `--font-sans`.
- Reusable motion primitives: heartbeat pulse, slide-up, line-draw, float, glass card, gradient hero. Framer Motion installed for page transitions and scroll reveals.

### 2. Public marketing site (fully built, separate routes — not hash anchors)
Each route gets its own `head()` with unique title/description/og tags for SEO.

```
/                    Home (hero, stats, ecosystem grid, journey, testimonials, partners, news, FAQ, CTA)
/about               Mission, vision, values, impact, team
/courses             Catalog overview across all 8 academies
/cbt                 CBT exam practice landing (WAEC/JAMB/NECO/Post-UTME)
/counseling          Counseling categories + booking entry point
/it-academy          IT Skills Academy programs
/islamic-academy     Islamic Learning Center (respectful, modern geometric treatment)
/community           Community/forum landing
/scholarships        News & opportunities hub landing
/sponsors            Sponsorship/partnership info + "Become a Partner"
/news                News feed
/faq                 Full FAQ accordion
/contact             Contact form + map placeholder
/auth                Login / signup (email + Google)
```

### 3. Lovable Cloud backend (enabled)
- Auth: email/password + Google sign-in (defaults per Lovable Cloud).
- Database tables with RLS + GRANTs:
  - `profiles` (id, full_name, avatar_url, school, level, created_at)
  - `user_roles` + `app_role` enum (`student`, `tutor`, `admin`, `super_admin`, `cbt_admin`, `content_admin`, `finance_admin`, `islamic_admin`) + `has_role()` security-definer function
  - `courses`, `lessons`, `enrollments`, `lesson_progress`
  - `cbt_subjects`, `cbt_questions`, `cbt_attempts`, `cbt_answers`
  - `counseling_sessions` (booking)
  - `community_posts`, `post_comments`, `post_likes`
  - `news_items`, `scholarships`
  - `certificates`
- Trigger auto-creates a profile + assigns `student` role on signup.
- Seed migration with a handful of demo courses, CBT subjects + sample questions, news items, scholarships so the UI isn't empty.

### 4. Authenticated student area (`/_authenticated/*`)
Uses the integration-managed `_authenticated` route gate.

```
/dashboard           Overview: progress, streak, upcoming, recommended courses
/dashboard/courses   My enrolled courses + browse
/dashboard/cbt       Take a CBT exam (real, end-to-end: pick subject → timed test → auto-mark → result)
/dashboard/counseling Book a counseling slot
/dashboard/community Feed (post, like, comment)
/dashboard/certificates  List + download placeholder
/dashboard/profile   Edit profile
/dashboard/wallet    Subscriptions/payments placeholder
/dashboard/leaderboard Global leaderboard from real CBT scores
```

**One module is fully end-to-end real: CBT.** Pick subject → randomized timed questions → auto-marking → score saved → analytics on dashboard → contributes to leaderboard. That's the most-used feature in the Nigerian student market, so it earns the depth.

### 5. Admin area (`/_authenticated/admin/*`, gated by `has_role('admin')`)
```
/admin               Overview metrics
/admin/users         Manage users + assign roles
/admin/courses       CRUD courses + lessons
/admin/cbt           CRUD questions + bulk CSV upload
/admin/news          CRUD news/scholarships
```
Role-based menu: a `cbt_admin` only sees CBT; `content_admin` only sees courses/news; `super_admin` sees all. Other granular roles (finance, media, islamic_affairs) exist in the enum and gate their respective sections once those sections are built.

## What is explicitly scaffolded, not fully built (and why)

These get a beautiful landing page, navigation entry, and (where relevant) a single working flow, but the deep functionality is intentionally deferred. I'll mark them clearly with a "Coming soon — early access" banner so users aren't confused.

- **One-on-one private tutor booking with payments** — needs Paystack/Flutterwave integration, calendar sync, video provider (Daily/Jitsi), recording storage. Booking UI lands; payment + video integration is a separate task.
- **Islamic Academy deep content** (Quran player, Tajweed audio, Hifz tracker) — landing page + course list works; audio player + memorization tracker is its own build.
- **AI features** (study assistant, career advisor, CBT generator, resume builder, interview coach) — none in v1. Each is its own integration via Lovable AI Gateway and deserves dedicated scope.
- **Realtime chat / DMs / group chat** — needs Supabase Realtime channels + presence; community feed (posts/comments/likes) ships, live chat is later.
- **Certificate PDF generation + QR verification** — list + download UI ships; the actual PDF renderer + verification route is later.
- **Sponsorship dashboards + donation portal** — public "Become a Partner" page ships; sponsor-side dashboards are later.
- **Analytics dashboards** beyond basic student stats — student-facing progress is real; tutor/financial/sponsor analytics are later.
- **Algolia search, AWS S3, Socket.IO, Clerk, NestJS** from the original tech stack — replaced by the Lovable Cloud equivalents (Supabase Postgres + Auth + Storage + Realtime). I'll note this clearly; if you specifically need any of those, they're follow-up integrations.

## Technical notes (for the technical reviewer)

- Stack stays as-is: TanStack Start + React 19 + Vite + Tailwind v4 + shadcn/ui. Original spec called for Next.js 15 / NestJS / Clerk; switching frameworks is not in scope. Lovable Cloud (Postgres + Auth + Storage + Edge functions) replaces the separate NestJS/Clerk/AWS stack. Same capabilities, simpler.
- All server-side data access via `createServerFn` with `requireSupabaseAuth` for protected routes; public reads via publishable-key client with narrow `TO anon` SELECT policies.
- File-based routes: separate route per public page (no hash anchors).
- Single `<main>` per route, semantic HTML, alt text on all imagery, WCAG-AA contrast against the locked palette, focus-visible rings.
- Mobile-first; sticky nav with mobile drawer.
- SEO: per-route title/description/og:title/og:description; og:image at leaf routes only; canonical tags; sitemap.xml + robots.txt; JSON-LD on home (Organization).
- Images: hero + module imagery generated via the image-generation tool (diverse Nigerian/African students, modern academic settings). No stock-purple-gradient AI slop.

## Build order

1. Brand tokens, fonts, motion primitives, layout shell, nav, footer
2. Home (full v3 direction, real copy, generated imagery)
3. Other public routes (about, courses, cbt, counseling, it-academy, islamic-academy, community, scholarships, sponsors, news, faq, contact)
4. Enable Lovable Cloud, run schema migration with all tables + RLS + GRANTs + seed data
5. Auth page (email + Google) + `_authenticated` shell
6. Student dashboard + CBT end-to-end (the real, deep module)
7. Other dashboard pages as scaffolds reading real data where it exists
8. Admin shell + role-gated sections + CBT question CRUD

## Confirmation before I start

This is a lot of code in one go. Confirm by approving the plan and I'll start at step 1. If you'd rather narrow scope (e.g. ship only the public site + auth + CBT first, then iterate), say which sections to drop and I'll revise.
