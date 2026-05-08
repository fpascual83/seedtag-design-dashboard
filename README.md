# SDS Service Dashboard

Real-time service transparency dashboard for the SDS Design team. Built for the
Seedtag CSM team to monitor delivery health across EMEA markets before
escalating client issues.

Live: `https://fpascual83.github.io/seedtag-design-dashboard`

## What it shows

- Tickets delivered in the selected period
- Average delivery time (Design hands-on time only)
- % of tickets delivered first time (no corrections)
- Average waiting-for-customer time
- Tickets currently in progress
- Charts: avg time by market, first-time % by market, weekly delivery volume,
  Design vs customer time split
- Sortable, searchable ticket table with full status history per row

## Service model (CSM perspective)

A ticket flows: `New → Design works → Done`. If a fix is needed, the ticket
re-enters processing and reaches `Done` again. Time spent in `Waiting for
customer` is not counted as Design time.

- **Design time** = total time from creation to last `Done` − time in `Waiting
  for customer`
- **Corrections** = (number of times `Done` was reached) − 1
- **First-time delivery** = ticket reached `Done` exactly once

## Stack

Single-file HTML. Chart.js from CDN. Calls Jira REST API directly from the
browser. 30-minute localStorage cache. No backend.

## Access

Password gate: `SDS2026`. Note: this is cosmetic — the page is public and the
client-side code holds the API token. Treat the token as compromised the
moment the page is reachable.

## Local dev

Just open `index.html` in a browser. Browsers may block CORS calls to
`seedtag.atlassian.net`; use a CORS extension for local debugging or proxy
through a Cloudflare Worker.
