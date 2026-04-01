# Hot Dog Poll

Hot Dog Poll is a lightweight mobile-first web app for collecting dachshund photos, reviewing them in a private admin area, and publishing finished dog cards in a public gallery.

The app is designed for quick use on phones. The main user comes from WhatsApp, opens the link, fills in a short form, uploads photos, and finishes fast.

## Product in simple words

This product has four main parts:

1. A public home page where a person enters their household name, selects how many dachshunds they have, and uploads one photo for each dog.
2. A submission API that checks the form data, uploads the photos, saves the data in Supabase, and returns the latest total count.
3. A private admin page where the team can review submissions, download original photos, export CSV data, and manage gallery cards.
4. A public gallery page where finished card images can be viewed and downloaded.

## What is implemented now

- Public dog photo submission flow
- Private admin login
- Admin dashboard with totals and submission review
- Photo download for admins
- CSV export
- Public gallery for finished card images
- Gallery upload and visibility controls inside admin

## What is not implemented as a live feature

The database includes fields for cartoon or AI-related image work, such as `cartoon_storage_path` and `cartoon_content_type`.

Those fields suggest planned future expansion, but this repo does not currently show a live user-facing AI image generation pipeline running inside the app itself. The current live product is an upload, review, and gallery system.

## Who this is for

- Dachshund owners submitting dog photos
- The internal team managing entries
- Future developers who need to understand or extend the project

## User flow

1. User opens `/`.
2. User optionally enters a household name.
3. User selects how many dachshunds they have.
4. User enters each dog name and uploads each photo.
5. The form submits to `/api/submissions`.
6. The server validates the data, uploads photos, saves records, and returns the updated total.
7. The user sees a simple success screen.

## Admin flow

1. Admin opens `/admin/login`.
2. Admin enters the shared password.
3. Admin lands on `/admin`.
4. Admin reviews households, dogs, totals, and uploaded photos.
5. Admin can export CSV data.
6. Admin can download original photos.
7. Admin can upload finished gallery cards and choose whether each card is published or hidden.

## How the data moves

1. The browser sends form data and photo files to the Next.js route handler.
2. The route handler validates the payload with Zod.
3. The server uploads images to Supabase Storage.
4. The server writes household and dog rows into Supabase Postgres.
5. The admin page reads those rows back from Supabase.
6. Signed URLs are created so private images can be previewed safely.
7. The gallery page reads published gallery card records and shows the final images.

## Frontend, backend, and services

### Frontend

- Next.js App Router for pages and routing
- React for UI components
- TypeScript for safer code
- CSS in `app/globals.css` for styling

The frontend handles the form, success state, admin layout, and gallery screens.

### Backend

- Next.js route handlers in `app/api/*`

The backend handles:

- validation
- file upload
- database writes
- CSV export
- admin-only actions
- image download responses

### Database and storage

- Supabase Postgres stores households, dogs, and gallery card records
- Supabase Storage stores uploaded images and gallery assets

### Validation

- Zod checks that the form is valid before the server saves anything

This stops common bad input early, such as missing names, missing photos, wrong file types, or files larger than 4 MB.

### Admin protection

- Shared password
- Server-side admin session helpers

This keeps the admin dashboard private without adding a full user account system.

## Skills and tools used

These are the main technologies and what they do in simple terms:

- `Next.js`: runs the website pages and the backend route handlers in one project
- `React`: builds the page components and form UI
- `TypeScript`: helps catch mistakes before runtime
- `Supabase`: stores the data and image files
- `Zod`: checks that the submitted form is valid
- `PowerShell dev script`: starts the local dev server safely and avoids stale local build output

## Local setup

1. Install dependencies.

```powershell
npm.cmd install
```

2. Copy `.env.example` to `.env.local`.

3. Fill in these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

4. In Supabase SQL Editor, run [`supabase/schema.sql`](/C:/Users/steve/Desktop/ai%20project/13%20pet%20poll%20pic/supabase/schema.sql).

5. Confirm the bucket name in Supabase matches `SUPABASE_BUCKET`.

6. Start the dev server.

```powershell
npm.cmd run dev
```

7. Open:

- `/` for the public form
- `/admin/login` for the private admin area
- `/cards` for the public gallery

## Supabase notes

- The service role key is used on the server only
- Dog photos are stored in the configured storage bucket
- Gallery images are also stored in the same bucket unless a direct path or URL is used
- Row level security is enabled and the service role is allowed to manage the records

## Deployment notes

This repo is intended to be deployed with the Vercel MCP from Codex chat.

Important deployment rule:

- the live gallery is persistent Supabase data, not Vercel build output
- existing gallery cards and uploaded images are preserved across normal Vercel deploys
- the main way to accidentally lose the gallery is to change production env vars, point at a different Supabase project or bucket, or run destructive SQL

### Default deploy workflow

Use preview deployments by default. Only deploy to production when you explicitly want the live site updated.

Current workspace assumptions:

- the local `vercel` CLI is not installed
- this repo may not have a local `.vercel` link yet
- MCP-driven deploys are the preferred path

### Reusable deploy prompts

Ask Codex one of these from this project:

- `Deploy this project to Vercel`
- `Create a preview deploy for this repo`
- `Deploy this to production on Vercel`
- `Deploy C:\Users\steve\Desktop\ai project\13 pet poll pic to Vercel as a preview`
- `Deploy C:\Users\steve\Desktop\ai project\13 pet poll pic to Vercel production`
- `Check whether this repo is ready for Vercel, then deploy a preview`

### First-time Vercel setup

1. Create a Vercel project from this repo.
2. Add the same environment variables from `.env.local` in Vercel Project Settings.
3. Link or select the project the first time Codex deploys it through Vercel MCP.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

### Required Vercel environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_BUCKET`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

### After each deploy

Check these routes:

- `/`
- `/admin/login`
- `/cards`

Also confirm the server-side routes still work with Supabase-backed data.

### Safe gallery-preserving rollout

When shipping a new feature without losing the existing gallery:

1. Keep production using the same `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET`.
2. Use a preview deployment first.
3. If schema changes are needed, make them additive and backward compatible with existing `gallery_cards` rows and stored image paths.
4. Verify in preview that old gallery cards still load on `/cards`.
5. Only then promote to production.

## Build and follow-up notes

See [`BUILD_NOTES.md`](/C:/Users/steve/Desktop/ai%20project/13%20pet%20poll%20pic/BUILD_NOTES.md) for the build errors that happened during development, what caused them, how they were fixed, and what to avoid next time.

## Verification checklist

- Submit one-dog and multi-dog households
- Keep uploads under 4 MB
- Confirm uploaded photos appear in the configured Supabase bucket
- Confirm the success state shows the updated total dachshund count
- Confirm admin login blocks unauthenticated access
- Confirm the admin totals match the submitted entries
- Confirm CSV export downloads correctly
- Confirm admin photo downloads work
- Confirm published gallery cards appear on `/cards`
- Confirm gallery downloads work
