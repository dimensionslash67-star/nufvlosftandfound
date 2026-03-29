# NUFV Lost and Found v2

## Stack
- Next.js 15 (App Router) + TypeScript
- PostgreSQL (Neon) + Prisma ORM
- Vercel Blob Storage
- JWT authentication
- Tailwind CSS

## Setup
1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in values
3. `npm run db:push` — push schema to Neon
4. `npm run db:seed` — create admin user + sample data
5. `npm run dev`

## Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Add all env vars from `.env.local`, including `CRON_SECRET`
4. Vercel auto-deploys on push

## Admin Login (after seed)
- Email: admin@nufv.edu
- Password: admin123

## Cron Jobs (auto-configured via vercel.json)
- `/api/cron/disposal` — runs daily at midnight, disposes items >30 days old
- `/api/cron/overdue` — runs daily at 1am, flags overdue items
