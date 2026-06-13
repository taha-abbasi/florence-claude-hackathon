# Florence

A voice-first + visual health-insurance plan finder. Surfacing thousands of real
health-insurance plans for a fraction of the price, matched to millions of
providers and your medications, in seconds. **Built with Claude and Opus 4.8.**

Healthcare.gov shows someone $960/month; Florence shows them the same coverage,
with ACA subsidies already applied, for $7 - then proves the plan covers their
doctors and their medications.

## Two ways in, one brain

1. **Visual flow** - editorial home (`/`) -> 4-field calculator -> a full-screen
   takeover that searches, reveals the subsidized price, and shows the best
   plans -> a plan-detail page (`/plans/[planId]`).
2. **Florence voice flow** (`/florence`) - tap to talk; Florence collects ZIP,
   household and income by voice, finds plans, and checks coverage for the
   doctors and drugs you name, the screen rendering each beat in lockstep.

## Architecture

Pure front end. Every plan price, subsidy calculation, provider/drug coverage
lookup, and the voice session itself come from the **Florence Tools API**. No
database, no scraping, no subsidy math in this repo.

The browser only ever calls relative `/api/florence/*` paths. A single server
proxy (`app/api/florence/[...slug]/route.ts`) holds the one scoped key
(`FLORENCE_TOOLS_API_KEY`, server-side only) and forwards each call upstream with
the `X-Florence-Tools-Key` header. The ElevenLabs voice token is minted through
the same proxy, so the browser never holds any ElevenLabs credential either.

```
app/
  page.tsx                         # home: hero + sections + <Calculator/>
  plans/[planId]/page.tsx          # plan detail
  florence/page.tsx                # voice experience
  api/florence/[...slug]/route.ts  # server proxy (the only place the key lives)
components/{home,plans,florence}/  # surfaces
lib/{calculator,florence}/         # state machines, pricing rules, client tools
```

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript (strict),
`@elevenlabs/react` for the voice agent, `next/font` for Playfair Display /
Inter / Outfit. Editorial design system driven entirely by `--af-*` CSS tokens.

## Run locally

```bash
npm install
# set the one secret (server-side, never committed):
echo "FLORENCE_TOOLS_API_KEY=<scoped-key>" > .env.local
npm run dev
```

Develop the voice UI without a live call: `/florence?debug-scene=plans`
(also `greeting`, `searching`, `reveal`, `coverage`, `email-confirm`, `done`).

## Deploy

One env var on Vercel: `FLORENCE_TOOLS_API_KEY` (server-side). `npm run build`
is clean; deploy with `vercel --prod`.

---

The pricing the client applies is only `realPrice = max(0, premium - aptc)` -
the same number renders identically on the takeover, the plan card, the detail
page, and the voice card. CSR-eligible households are Silver-only. Everything
else (APTC, CSR, Medicaid adjustment, CMS parity) stays behind the API.
