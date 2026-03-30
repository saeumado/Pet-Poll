# Vercel Deploy Guide

This project should be deployed from Codex using the Vercel MCP tools.

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

## What to verify after deploy

- `/` loads cleanly on mobile
- the submission form renders correctly
- `/admin/login` loads
- `/cards` loads
- server-side routes still work with Supabase-backed data
