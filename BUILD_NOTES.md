# Build Notes

This file explains the main build and dev problems that happened during the project, what they likely meant, how they were handled, and what to avoid next time.

## Current baseline

At the time of this handoff:

- `npm run build` passes
- `npm run typecheck` passes

That means the project does not currently have a standing compile error. The biggest issues seen during development were local dev runtime and build-cache problems.

## Error 1: React Client Manifest / SegmentViewNode error

Example error:

```text
Could not find the module "...next-devtools...segment-explorer-node.js#SegmentViewNode" in the React Client Manifest.
```

### What this likely means

This usually points to broken or stale Next.js dev build output, not to a normal TypeScript coding mistake.

In this project, the error appeared during local dev after repeated route changes and gallery work. It is most likely that the local Next build output became inconsistent.

### Likely cause

- stale local `.next` or `.next-dev` artifacts
- dev server restarted in a bad state
- old chunk references still being used by the running server

### Fix used

- stop the dev server
- clear stale local build output
- restart the app cleanly

The project already includes a safer startup script:

```powershell
npm.cmd run dev
```

That script runs [`scripts/dev-clean.ps1`](/C:/Users/steve/Desktop/ai%20project/13%20pet%20poll%20pic/scripts/dev-clean.ps1), which:

- checks for an existing dev lock
- checks whether port `3000` is already in use
- removes stale `.next-dev` output
- starts Next.js again in a cleaner state

## Error 2: `__webpack_modules__[moduleId] is not a function`

Example error:

```text
[TypeError: __webpack_modules__[moduleId] is not a function]
```

### What this likely means

This is another sign that the local dev bundle got into a bad state. It often appears together with chunk mismatch or manifest problems.

### Likely cause

- stale compiled chunks
- dev cache corruption
- server using modules from an older build state

### Fix used

- restart local dev
- clear stale Next output first
- confirm the issue is not present in a clean production build

Because `npm run build` now passes, this issue should be treated as a local dev artifact problem first.

## Error 3: `Cannot find module './611.js'`

Example error:

```text
Error: Cannot find module './611.js'
```

### What this likely means

A chunk file expected by Next.js was missing from the generated output.

### Likely cause

- local build output was only partly refreshed
- the dev server was pointing at stale generated files
- build artifacts were reused after the internal module map changed

### Fix used

- clear local generated Next output
- restart from a clean state

## Error 4: intermittent `500` responses on `/` or `/admin`

These appeared in the dev logs while the app was being changed.

### What this likely means

A `500` in this project can come from two broad places:

1. temporary dev/build cache instability
2. real server-side failures such as missing env vars, Supabase issues, or gallery/storage problems

### How to debug it

1. Check whether `npm run build` and `npm run typecheck` still pass.
2. If they pass, restart the dev server cleanly.
3. Check server logs for route-specific messages such as:
   - `[submissions] missing_env`
   - `[submissions] upload_failed`
   - `[submissions] db_failed`
   - `[admin-gallery] request_failed`
   - `[cards-download] request_failed`
4. Verify Supabase environment variables are present.
5. Verify the bucket exists and matches `SUPABASE_BUCKET`.

## Safe recovery steps

If local dev starts behaving strangely:

1. Stop the dev server.
2. Start again with:

```powershell
npm.cmd run dev
```

3. If needed, manually remove stale local Next output before restarting.
4. Re-test the route that failed.
5. Run:

```powershell
npm.cmd run build
npm.cmd run typecheck
```

If those pass, the issue is more likely a local dev-state problem than a real compile failure.

## What to avoid next time

- Do not run multiple dev servers for the same repo at the same time.
- Do not ignore stale local build output after unusual runtime errors.
- Do not assume every `500` means the source code is broken; first separate dev-cache problems from real server/data problems.
- Do not describe AI generation as a shipped runtime feature unless the app actually performs that step.
- Do not expose the Supabase service role key to the browser.

## Practical checklist for future changes

- Use `npm run dev` instead of manually starting raw Next dev when possible.
- After major route or server changes, re-check `/`, `/admin`, and `/cards`.
- Keep uploads under the current 4 MB limit unless the upload pipeline is changed intentionally.
- When debugging storage or admin issues, inspect both the browser behavior and the server logs.
- Use `npm run build` and `npm run typecheck` as the baseline truth before assuming the repo is broken.
