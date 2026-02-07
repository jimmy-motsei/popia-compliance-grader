# POPIA Compliance Grader (MVP Scaffold)

Scanner-first MVP for automated website POPIA grading with Maru-styled UI.

## What is implemented

- Next.js app shell with refreshed Maru token-based styling.
- `POST /api/scan` endpoint:
  - Crawls website with fixed cap (`25` pages, depth `2`).
  - Runs POPIA detector rules and returns evidence.
  - Calculates pillar and overall score with grade/risk band.
- `POST /api/score` endpoint:
  - Scores an existing scan payload.
- `POST /api/lead` endpoint:
  - Captures lead data with scan + assessment payload.
  - Persists to Neon when `DATABASE_URL` is configured.
  - Falls back to JSON file persistence (`data/leads.json`) if Neon is not configured.
  - Syncs to HubSpot if access token is configured.
- `GET /api/lead/:leadId` endpoint:
  - Returns a single lead payload as JSON.
- `GET /api/leads?limit=50` endpoint:
  - Returns latest persisted leads and active storage backend.
- `GET /api/report/:leadId` endpoint:
  - Renders a shareable HTML report for a captured lead.

## Scanner policy

- `max_pages_per_domain`: 25
- `max_depth`: 2
- HTML-only crawl, same-domain links only
- request timeout per page: 12s

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Neon + Vercel setup

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL` (Neon connection string from Vercel/Neon integration)
- `HUBSPOT_ACCESS_TOKEN` (optional now, can be added later)

Database schema is auto-initialized at runtime and also included in:

- `sql/001_create_popia_assessments.sql`

## HubSpot setup (optional)

- Optional property name overrides if your internal HubSpot property names differ:
  - `HUBSPOT_PROP_POPIA_SCORE` (default: `popia_compliance_score`)
  - `HUBSPOT_PROP_POPIA_RISK` (default: `popia_risk_level`)
  - `HUBSPOT_PROP_POPIA_GRADE` (default: `popia_assessment_grade`)
  - `HUBSPOT_PROP_POPIA_DATE` (default: `popia_assessment_date`)

## Current MVP limitations

- Rules are heuristic and intentionally conservative.
- Report output is HTML only (no PDF yet).
- No async job queue yet.

## Next build steps

1. Add PDF report generation and email delivery.
2. Add async scan/lead processing jobs.
3. Expand detector coverage and improve false-positive control.
4. Add auth/guardrails around internal operational endpoints.
