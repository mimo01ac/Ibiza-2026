# Ibiza 2026

Trip planning app for a group villa holiday in Ibiza, June 2026.

**Live:** https://ibiza-2026.vercel.app
**Repo:** https://github.com/mimo01ac/Ibiza-2026

## Tech Stack

- **Framework:** Next.js 16 (Turbopack), React 19, TypeScript
- **Auth:** Auth.js v5 (next-auth) — Facebook OAuth + guest login (shared password + name)
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Storage:** Supabase Storage (3 public buckets)
- **Styling:** Tailwind CSS v4, dark mode only
- **Deployment:** Vercel (auto-deploys from `master`)

## Features

| Section | Description |
|---------|-------------|
| **Confirmed Participants** | Avatar grid on hero page. Users click "I'm in!" to confirm attendance. |
| **Club Schedule** | Day tabs with event cards, voting, and comments. Admin can create/delete events. |
| **Wildcards** | Trip ideas submitted by any user. Voting + comments. |
| **Villa DJ** | Lars Vinter / Dicosis artist bio, Spotify embed, photo gallery, audio player. |
| **Flight Tracker** | Table + timeline views. One entry per user (upsert). |
| **Room Allocation** | 6 pre-seeded rooms. Admin assigns users via dropdown. |
| **Gallery** | Category tabs (Past Trips / Ibiza 2026). Upload, lightbox. |
| **Villa Info** | Address, Wi-Fi, taxi table, Google Maps embed, villa photos. |

## Authentication

Two login methods available:

1. **Facebook OAuth** — full profile picture + name from Facebook
2. **Guest login** — shared site password + name. Same name = same user across sessions. Guest users get a synthetic email (`guest_<name>@ibiza-2026.app`) that flows through the same profile system as Facebook users.

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Facebook OAuth app (developers.facebook.com)

### Environment Variables

Create `.env.local` with:

```env
AUTH_SECRET=           # openssl rand -base64 32
AUTH_FACEBOOK_ID=      # Facebook App ID
AUTH_FACEBOOK_SECRET=  # Facebook App Secret
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GUEST_PASSWORD=        # Shared password for guest login
```

### Database Setup

1. Run `supabase-migration.sql` in the Supabase SQL Editor (creates 10 tables, indexes, RLS policies, triggers, and room seed data)
2. Add the `is_confirmed` column:
   ```sql
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_confirmed boolean DEFAULT false;
   ```
3. Create 3 **public** storage buckets: `dj-media`, `gallery`, `villa-photos`
4. Set yourself as admin:
   ```sql
   UPDATE profiles SET is_admin = true WHERE auth_user_email = 'your-email@example.com';
   ```

### Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Architecture

- **Single-page scroll** — all sections on `app/page.tsx`, nav uses anchor links
- **Server -> Client pattern:** `page.tsx` (server) fetches `isAdmin` -> `AllSections` (client) renders sections
- **Mutations:** API routes verify Auth.js session, then use Supabase service role key
- **Reads:** Anon key + RLS (SELECT true) in server components
- **Profile sync:** `getProfileByEmail()` auto-upserts on first authenticated API call
- **Votes:** Optimistic UI + toggle endpoint (single POST toggles on/off)

## Key Files

| File | Purpose |
|------|---------|
| `auth.ts` | Auth.js config — Facebook + Credentials providers |
| `auth.config.ts` | Minimal auth config for middleware |
| `lib/auth-helpers.ts` | `getSessionOrThrow()`, `getProfileByEmail()`, `requireAdmin()` |
| `lib/supabase/admin.ts` | Supabase service role client |
| `lib/supabase/server.ts` | Supabase anon client (server components) |
| `lib/types/database.ts` | TypeScript interfaces for all tables |
| `app/components/sections/AllSections.tsx` | Renders all feature sections |
| `supabase-migration.sql` | Full database schema |

## Facebook Developer Setup

In your Facebook app dashboard:

- **Valid OAuth Redirect URI:** `https://ibiza-2026.vercel.app/api/auth/callback/facebook`
- **Permissions:** `public_profile`, `email`
- **App mode:** Live (not Development)
