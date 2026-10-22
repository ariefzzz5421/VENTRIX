# VENTRIX

**Decode the Capital Behind Crypto.**

A responsive crypto venture capital intelligence terminal built with Next.js App Router, TypeScript, Recharts and Lucide.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Pages

- `/`: research overview
- `/funds` and `/funds/[slug]`: fund directory and individual dossiers
- `/compare`: interactive historical comparison
- `/performance`: winner and loser methodology (no fake fund returns)
- `/deals` and `/projects/[slug]`: project and deal research
- `/capital-flows`: financial data integration roadmap
- `/network`: VC to portfolio relationship explorer
- `/methodology`: source provenance and definitions

## API

- `GET /api/funds`
- `GET /api/funds/:slug`
- `GET /api/deals`
- `GET /api/compare?funds=paradigm,pantera-capital`

## Important data caveat

The bundled `lib/data.ts` is an **editorial prototype dataset**, not a verified or complete financial database. Some investment associations, funding years and round classifications are provisional and require primary-source verification. No AUM, actual holdings, entry prices, realized fund returns, or winners/losers are fabricated. Connect licensed data sources and record dated provenance before publishing verified claims.

## Production priorities

1. Configure PostgreSQL and ingestion/sync workers.
2. Integrate licensed provider feeds (e.g. CryptoRank, RootData, DefiLlama).
3. Store provenance, confidence, as-of timestamps and point-in-time snapshots.
4. Ingest official AUM and performance disclosures separately from capital-raise records.
5. Add integration tests, production analytics and caching.

Deploy through Vercel by importing this repository. No secrets are required to run the seeded prototype.

## SEC / official AUM intelligence upgrade
- Comparison Lab `/compare`: latest regulatory/manager AUM ranked bars + SEC annual RAUM history with full-universe multi-select.
- Includes 13 date-stamped manager disclosures, sourced per legal adviser, and tracks 41 fund profiles. Unavailable data is explicitly undisclosed.
- `lib/aum.ts`: source URLs, legal entities, metric scopes, disclosure dates, annual observations, notes, precision.
- AUM is manager-wide and reported on different dates: **never a fund's investment return or venture-only portfolio valuation**.
- The ranking is built from research snapshots; no live financial data provider is used.

## Production release verification

The latest funding-network release exposes `GET /api/release` with its source commit SHA (when provided by Vercel). Confirm that value after deployment; a green GitHub check alone does not mean production changed. See `docs/releases/funding-network-v2.md` for release checks and Vercel quota guidance.
