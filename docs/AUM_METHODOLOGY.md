# VENTRIX AUM Research Methodology
As-of research: 2026-10-21. Public figures are dated snapshots, not continuous real-time API reads.

- **Manager website:** firm-reported AUM with the manager's own scope and data date. Pantera $3.5B estimated unaudited as of 2026-03-31; ParaFi $1.6B as of 2026-06-30.
- **Form ADV:** adviser-level **regulatory assets under management (RAUM)**, often manager-wide including liquid strategies and other business lines. The sources are linked SEC filing mirrors (FormDs), retaining legal adviser name and filing date; not venture-only capital.
- **Galaxy Ventures:** disclosed figure is from broader Galaxy Digital Capital Management LP, NOT standalone Galaxy Ventures fund AUM.
- **Historical data:** fiscal years 2021–2025 from selected SEC filing histories, never spliced to manager website snapshots with different coverage.
- **No disclosure:** display `null`/Undisclosed, NOT 0. Count of published AUM values is a coverage metric, not an AUM estimate.
- **AUM changes are NOT fund ROI:** flows, valuation, restructurings and changing client accounts affect AUM. Never label AUM growth as alpha or performance.
- **Sorting:** rank known disclosed AUM only; other names remain in 41-fund explorer and complete ledger.
- **Documentation:** `lib/aum.ts` contains date, source, metric scope and legal entity for every observation. `GET /api/aum` exposes all 41 including missing values.

Further research required: official firm-level reports and regulatory filings for remaining 28 fund entities. Brand/fund naming may not map one-to-one to SEC legal adviser entities. Do not infer returns or AUM from fundraises.
