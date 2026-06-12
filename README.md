# 🏆 WC 2026 — The Lads Prediction Game

A private World Cup 2026 prediction website for 6 friends. Mobile-first, football-stadium themed, with PWA support.

## Features

- 🔐 Name-based login with personal passwords
- ⚽ All 104 WC2026 fixtures pre-loaded
- 🎯 Predict scores for every match
- 🔒 Auto-lock at kickoff (Saudi Arabia time)
- 🏆 Live leaderboard with points
- 👑 Admin panel for Ammar
- 📲 PWA — installable on mobile home screen
- 🔔 Push notification reminders (10 min before kickoff)

## Scoring

| Result | Points |
|--------|--------|
| Exact score | 3 pts ⚡ |
| Correct outcome | 1 pt ✅ |
| Wrong | 0 pts ❌ |

## Setup

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com), create a new project, then run `supabase-schema.sql` in the SQL editor.

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SECRET_KEY=choose-any-secret
CRON_SECRET=choose-another-secret
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Seed Fixtures

After running the app, go to `/admin` as Ammar and click **Seed All 104 WC2026 Fixtures**. Enter your `ADMIN_SECRET_KEY` when prompted.

### 5. Deploy to Vercel

```bash
npx vercel
```

Add all env vars in Vercel dashboard. The cron job in `vercel.json` will check every 5 minutes for matches kicking off soon.

## Users

| Name | Role | Emoji |
|------|------|-------|
| Ammar | Admin 👑 | 👑 |
| Aziz | Player | 🦁 |
| Moh | Player | 🐺 |
| Faisal | Player | 🦅 |
| Abody | Player | 🔥 |
| Mloky | Player | ⚡ |

## Admin Guide

1. **Seed fixtures** — one-time setup
2. **Enter scores** — after each match finishes, go to Admin > Scores tab
3. **Points auto-calculate** when you save a score
4. **Recalculate All** button if anything goes wrong

## Push Notifications

For push notifications on iOS (Safari 16.4+) / Android:
1. Users must **Add to Home Screen** first
2. Site will prompt to allow notifications on login
3. Notifications fire 10 minutes before kickoff for users who haven't predicted

## Tech Stack

- **Next.js 15** (App Router)
- **Supabase** (Postgres + auth)
- **Tailwind CSS**
- **Vercel** (hosting + cron)
- **PWA** (service worker, manifest)
