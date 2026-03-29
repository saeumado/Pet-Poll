# Hot Dog Poll

A simple Next.js web app for collecting dachshund household submissions and reviewing them in a private admin dashboard.

## What it does

- Public form with optional household name, dachshund count, and one dog name/photo per dachshund
- Clean success state with a live overall dachshund count
- Private admin dashboard protected by a shared password
- Running totals for households, dachshunds, and saved photos
- CSV export of all submissions
- Individual photo download links for each dog
- Supabase Postgres for records and Supabase Storage for images

## Stack

- Next.js App Router
- React + TypeScript
- Supabase Postgres
- Supabase Storage
- Vercel-ready environment configuration

## Local setup

1. Install dependencies:

```powershell
npm.cmd install
```

2. Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

3. In Supabase SQL Editor, run [`supabase/schema.sql`](/C:/Users/steve/Desktop/ai%20project/13%20pet%20poll%20pic/supabase/schema.sql).

4. Confirm your storage bucket name matches `SUPABASE_BUCKET`.

5. Start the app:

```powershell
npm.cmd run dev
```

6. Open:

- `/` for the public submission form
- `/admin/login` for the admin dashboard login

## Supabase notes

- The app uses the service role key on the server for inserts, reads, export generation, and photo downloads.
- Uploaded dog photos are stored in the configured storage bucket under household-specific folders.
- The included SQL enables row level security and grants access to the service role.

## Deployment on Vercel

1. Create a new Vercel project from this folder or repository.
2. Add the same environment variables from `.env.local` in Vercel Project Settings.
3. Deploy the app.
4. Keep the service role key server-only. Do not expose it as a `NEXT_PUBLIC_` variable.

## Verification checklist

- Submit one-dog and multi-dog households
- Confirm uploaded photos appear in the configured Supabase bucket
- Confirm the success state shows the updated global dachshund count
- Confirm the admin password gate blocks unauthenticated access
- Confirm totals match the submitted entries
- Confirm CSV export downloads correctly
- Confirm photo downloads work from the admin view
