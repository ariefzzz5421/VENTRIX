# VENTRIX Radar Webhook Setup

VENTRIX supports **two separate channels**:
1. `/api/cron/radar` — scheduled public HN startup discovery; source snapshots, persistent Redis deduplication, outgoing Discord alerts.
2. `/api/hooks/radar` — incoming custom startup event from other integrations, then signed verification, deduplication, and outgoing Discord alert. It does **not** assert funding or VC investment.
3. `/api/hooks/frontrun` — existing dedicated Frontrun event schema and signature handling, retained without changes.

### Required Vercel environment variables (server-side secrets, never NEXT_PUBLIC)
- `DISCORD_WEBHOOK_URL` — destination Discord channel webhook
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET` — Vercel Cron bearer verification for GET /api/cron/radar
- `RADAR_INGEST_SECRET` — dedicated random HMAC secret for custom incoming POST /api/hooks/radar
- `FRONTRUN_WEBHOOK_SECRET` — only for /api/hooks/frontrun

All env variables must be set in **Vercel Project > Settings > Environment Variables > Production**, then redeploy. Do not store these secrets in Git or paste them into chat.

### Signed incoming request

Send the **exact raw UTF-8 JSON body** `{"title":"Launch title","url":"https://example.org","sector":"AI / ML","description":"Short note","source":"Your source","createdAt":"2026-10-26T08:00:00Z"}`.

Include:
- `Content-Type: application/json`
- `X-Ventrix-Delivery-Id`: unique stable event ID (retries reuse same ID)
- `X-Ventrix-Signature: sha256=<hex>`: HMAC SHA256 of raw body using `RADAR_INGEST_SECRET`.

Webhook is strict, responds 401 to invalid signatures, 400 to malformed events, 503 if missing configuration, and suppresses duplicate event IDs via Upstash. It never accepts a destination URL from the requester.

### Security & limitations
- Anyone with the secret can send signed events; rotate credentials if exposed.
- Incoming custom events are marked **unverified discovery**. They are not added to the Hacker News feed; they are delivered to Discord (new storage/ingestion pipeline required for unified feed).
- Radar's Latest / Oldest sorts within the existing 7-day Show HN discovery window, not all historical startups.
- Vercel Cron runs daily at 01:00 UTC = 08:00 WIB per `vercel.json`; plan quotas and provider limits apply.
