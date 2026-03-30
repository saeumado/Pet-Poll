# Creative Cards Feature Backup

This folder preserves the gallery feature so it can be reintroduced later without rebuilding it from scratch.

## What is included

- `app/cards/page.tsx`
  Public gallery page route.
- `app/api/cards/route.ts`
  Gallery read API.
- `app/api/cards/vote/route.ts`
  One-heart-per-device vote API.
- `components/cards-gallery.tsx`
  Client gallery UI with heart button and download button.
- `lib/creative-cards.ts`
  Card seed list, display-name cleanup, vote helpers, and Supabase reads.
- `public/cards/`
  The 14 Pokemon-style dog card images.
- `snippets/app-globals.cards.css`
  Gallery and heart-badge CSS extracted from the merged app stylesheet.
- `snippets/supabase-schema.creative-cards.sql`
  SQL required for `creative_cards` and `creative_card_votes`.
- `snippets/types-database.creative-cards.ts`
  Type additions for `types/database.ts`.

## Card order

The intended manual order is:

1. Meiji1.png
2. Anya1.png
3. Blu1.png
4. Cap1.png
5. Mio1.png
6. Mayo.png
7. Jadior1.png
8. Brown1.png
9. Dean.png
10. Pep.png
11. Meatball.png
12. Noodle1.png
13. Mousses1.png
14. Haru1.png

## Naming rule

Display names are derived from filenames and strip trailing version numbers.
Examples:
- `Meiji1.png` -> `Meiji`
- `Anya1.png` -> `Anya`
- `Mayo.png` -> `Mayo`

## Required database step

Before the gallery and votes can work, run:
- `snippets/supabase-schema.creative-cards.sql`

in Supabase SQL Editor.

## Re-adding later

To bring the feature back:

1. Restore the archived route/component/helper files into the app and rename them back from `.ts.txt` / `.tsx.txt` to `.ts` / `.tsx`.
2. Copy the 14 images back into `public/cards/`.
3. Merge `snippets/app-globals.cards.css` into `app/globals.css`.
4. Merge `snippets/types-database.creative-cards.ts` into `types/database.ts`.
5. Run `snippets/supabase-schema.creative-cards.sql` in Supabase.
6. Run `npm.cmd run typecheck` and `npm.cmd run build`.

## Notes

- The gallery route was `/cards`.
- Voting was one heart per device/browser via a cookie.
- The main app did not require the gallery to function.
