# Radar alert and fund data audit — 2026-10-31

## Radar alert

- Show HN alerts now show one short description, a keyword-derived project type, an explicitly self-identified HN builder when available, and icon-labeled product/social/code links present in the submission. The HN source remains available as a link. The verbose disclaimer and source footer were removed; the embed retains its launch timestamp.
- A Hacker News submitter is **not** automatically a founder. The builder handle is only shown when their post uses first-person builder/founder language. The project type is a screening label, not a verified company classification. The title and source links still point to the original public post.
- Discovery remains separate from funding evidence. The cron authorization, Redis deduplication key, and webhook secret handling are unchanged.

## Fund records added

| Manager | Added evidence | Primary source |
| --- | --- | --- |
| Spartan Group | Founded 2017; business profile | [Manager website](https://www.spartangroup.io/) |
| IOSG Ventures | Founded 2017; business profile and 17 matched portfolio names | [Manager website](https://iosg.vc/) |
| Galaxy Ventures | Profile and 9 matched portfolio names | [Manager portfolio](https://ventures.galaxy.com/portfolio) |
| OKX Ventures | Profile and 6 matched portfolio names | [Manager portfolio](https://www.okx.com/en-us/ventures) |
| Foresight Ventures | Profile and two portfolio names explicitly identified in its release | [Manager profile](https://www.foresightventures.com/about), [manager release](https://foresightventures.com/details?details_id=34&details_type=news) |

These matches are portfolio associations, not dated financing rounds, current holdings, check sizes, or fund returns. The site links to each manager's source from the fund page and network detail. Spartan and IOSG founding years link to the statements on their own sites.

## Remaining gaps

- Eleven of the 41 tracked fund entries still lack a verified founding year. A brand launch, parent company founding date, and venture-arm start date are not automatically interchangeable.
- AUM remains unknown where the manager has not published a comparable dated figure; null means unknown, never zero. Existing founding years outside this audit still need per-fund source review.
- This is a curated sample, not a complete count of all crypto VC funds or global capital flow. The official portfolio pages can change, so these associations should be rechecked periodically.
