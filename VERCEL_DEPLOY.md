# Vercel Deploy Guide

This project should be deployed from Codex using the Vercel MCP tools.

## Gallery safety

The live gallery is not stored in the Vercel deployment itself.

- `public.gallery_cards` in Supabase stores gallery metadata
- `public.gallery_card_votes` in Supabase stores likes
- Supabase Storage stores uploaded dog photos and gallery assets

That means a normal Vercel deploy does not delete the existing gallery. The real risks are:

- changing `NEXT_PUBLIC_SUPABASE_URL`
- changing `SUPABASE_BUCKET`
- pointing production at a different Supabase project
- running destructive SQL such as `drop table`, `truncate`, or bucket replacement
- changing how `image_path` is interpreted without migrating old rows

## Default rule

- Use preview deployments by default
- Only deploy to production when you explicitly want the live site updated

## Why this repo uses MCP deploys

- The local `vercel` CLI is not installed in this workspace
- This repo may not have a local `.vercel` link yet
- Using the Vercel MCP from chat is the fastest repeatable workflow here

## What to say in chat

Use one of these prompts from this project folder:

- `Deploy this project to Vercel`
- `Create a preview deploy for this repo`
- `Deploy this to production on Vercel`
- `Deploy C:\Users\steve\Desktop\ai project\13 pet poll pic to Vercel as a preview`
- `Deploy C:\Users\steve\Desktop\ai project\13 pet poll pic to Vercel production`
- `Check whether this repo is ready for Vercel, then deploy a preview`

## First-time setup

1. Create a Vercel project for this repo.
2. Add the required environment variables in Vercel.
3. On the first deploy, expect one-time project selection or linkage.

## Required environment variables

These values match [`.env.example`](/C:/Users/steve/Desktop/ai%20project/13%20pet%20poll%20pic/.env.example):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_BUCKET`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Important:

- `SUPABASE_SERVICE_ROLE_KEY` must remain server-only
- keep production pointing at the same Supabase project and bucket unless you intentionally want a fresh empty gallery

## Safe rollout checklist

For any new feature that must keep the current gallery:

1. Build the change on a branch.
2. Keep the current production Vercel env vars unchanged:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_BUCKET`
3. If the feature needs database changes, use additive SQL only:
   - `alter table ... add column ...`
   - `create table if not exists ...`
   - `create index if not exists ...`
4. Preserve compatibility with existing gallery rows:
   - keep reading from `gallery_cards`
   - keep signed URL generation working for existing `image_path` values
   - make new fields optional or defaulted so old rows still render
5. Deploy a Vercel preview first.
6. Verify the preview against the existing Supabase data.
7. Merge to `main` and let Vercel deploy production.

Avoid these rollout mistakes unless you are also doing a deliberate data migration:

- do not create a new Vercel project for production
- do not point production at a new Supabase project
- do not rename or remove columns that current routes still read
- do not replace the storage bucket or rewrite `image_path` semantics in place

## What to verify after deploy

- `/` loads cleanly on mobile
- the submission form renders correctly
- `/admin/login` loads
- `/cards` loads
- server-side routes still work with Supabase-backed data
- existing gallery cards still render with images and downloads
- if you upload a new gallery card from admin, both old and new cards appear together
