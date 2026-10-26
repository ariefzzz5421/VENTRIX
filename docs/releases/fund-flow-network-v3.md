# VENTRIX fund flow and network audit — 2026-10-26

## Scope and measurement

The Overview timeline runs from 2009, the year Bitcoin launched, through 2026. It charts **only the company equity funding announcements indexed in `lib/funding.ts`** and counts **only the funds in the VENTRIX directory with a recorded founding year**. It is a reproducible curated sample, not an estimate of all crypto VC capital or all crypto funds worldwide. A year with no indexed round means coverage is missing or no qualifying row is present; it does not establish zero market activity. Company round totals cannot be attributed to individual investor check sizes. World Assets' WLD token sale remains separate from equity.

## Data added and corrected

- Added seven company equity rounds with primary announcement links: [Circle 2018 Series E](https://www.circle.com/blog/circle-announces-usd-coin-bitmain-partnership-and-new-strategic-financing), [Chainalysis 2019 Series B](https://www.chainalysis.com/blog/series-b/), [Uniswap 2020 Series A](https://blog.uniswap.org/uniswap-raise), [Aztec 2021 Series A](https://aztec.network/blog/aztec-network-raises-17-million-series-a-from-paradigm-to-bring-programmable-privacy-to-web3), [Optimism 2022 Series B](https://optimism.io/blog/a-new-chapter), [Uniswap 2022 Series B](https://blog.uniswap.org/bringing-web3-to-everyone), and [BitGo 2023 Series C](https://www.prweb.com/releases/bitgo-secures-100m-series-c-funding-at-1-75b-valuation-301901731.html).
- Replaced the Fireblocks Series E link with [Fireblocks' own announcement](https://www.fireblocks.com/blog/550m-series-e-zero-to-crypto), which names ParaFi Capital among the round participants.
- Added [Babylon's $70 million 2024 funding announcement](https://www.prweb.com/releases/babylon-completes-70m-raise-led-by-paradigm-to-advance-trustless-bitcoin-staking-302159158.html), naming Paradigm, Polychain Capital, and Bullish Capital. Its instrument is undisclosed, so it is visible in the ledger and network but excluded from the equity chart.
- Reclassified [1inch's $2.8 million 2020 round](https://1inch.com/blog/post/1inch-secures-2-8-mln-in-funding-from-top-investors) as instrument undisclosed: the project announcement names investors and an amount but does not say equity or token sale.
- Added portfolio relationships from manager-owned directories for [Blockchain Capital](https://www.blockchaincapital.com/portfolio), [Framework Ventures](https://www.framework.ventures/portfolio), [Variant](https://variant.fund/portfolio/), [1kx](https://1kx.network/portfolio), [Multicoin Capital](https://multicoin.capital/portfolio/), and [CoinFund](https://www.coinfund.io/portfolio). These are associations, not dated equity-round participation or proof of current holdings. The source link is visible in the network detail panel.
- Excluded HashKey project associations from this change because the names could not be individually confirmed from the publicly readable portfolio page during this audit. HashKey remains in the fund directory and fund selector with pending relationship coverage.

## Interface and bug audit

- The React Flow stylesheet was absent, so the Network Graph rendered as tiny disconnected nodes and a blank map. The stylesheet is now loaded, the map removed, and focused graphs use positions and zoom suitable for narrow screens.
- The network has a selector for every tracked VC. A selected fund with no official round but a sourced portfolio entry switches to portfolio view and explains that evidence class. A fund with no indexed relationship shows an explicit unknown state.
- The detail panel lists every sourced announcement when a fund and project share multiple indexed rounds, so its round count can be inspected rather than represented by a single source link.
- Official-round network edges now include company equity rounds only. Portfolio links have a distinct style and source explanation. Sankey widths count links, never dollars.
- The Overview chart offers annual/cumulative indexed equity round amounts, a tracked fund-count view, year inspection, and direct source links. Its coverage label is present on the chart itself.

## Remaining data gaps

The directory is not exhaustive. Several funds have no verified founding year, dated AUM, or individually sourced portfolio relationship. The older portfolio associations in `lib/data.ts` should be checked per edge before being promoted to the audited set. Babylon's and 1inch's instruments remain unknown. No individual VC check size, ownership, performance, or global market total is inferred from these records.

## Verification

TypeScript lint and production build pass locally. Browser checks covered the Overview chart, all three network views, the VC filter, and 390px/1280px layouts without page-level horizontal overflow or console errors. Local production responses returned HTTP 200 for `/`, `/network`, `/deals`, `/methodology`, `/api/funding-rounds`, and `/api/release`. The final post-edit build and remote deployment are verified separately.
