# VENTRIX Early Startup Radar

## What is live vs not yet enabled

- **Free discovery:** The `/radar` dashboard and `GET /api/radar` read recent **Show HN** posts through the public [HN Algolia Search API](https://hn.algolia.com/api), cached for 15 minutes. Data is fetched at request time; the app never fabricates results if HN is down. A Show HN post means a user submitted a launch, **not** that any VC follows, backs, or funds it.
- **Community score:** A documented ranking heuristic based on post age, HN points and comments. **Not** a predicted funding probability, valuation, or verified startup quality.
- **Daily Discord delivery:** `GET /api/cron/radar` sends up to five previously unseen qualifying public-launch signals at **08:00 Asia/Jakarta** (01:00 UTC), *once the secrets and persistent Redis deduplication are configured*.
- **Optional Pro source:** `POST /api/hooks/frontrun` accepts signed `convergence` (3+ follows) and `new_follows` events from a paid Frontrun account, filters classified AI/crypto companies, and forwards these to Discord. It does **not** itself subscribe to or pay for Frontrun. No Pro integration is represented as running until the provider actually delivers events.
- **Funding verification:** Not in the MVP. Use VENTRIX /deals for primary-source announcements; never infer investment from HN interest or X follows.

## Setup (Vercel)

1. Merge this PR, then redeploy to production. Visit `https://ventrix-kappa.vercel.app/radar` and `/api/radar`. Source health must be `ONLINE`; empty results are acceptable and are not filled with fake records.
2. In Discord, go to the dedicated alert channel > **Edit Channel > Integrations > Webhooks > New Webhook > Copy Webhook URL**. Store the URL **only** in Vercel environment variable `DISCORD_WEBHOOK_URL`. If an old URL was shared in a public place, rotate/delete it before use.
3. Create an Upstash Redis database (REST API access) and set `UPSTASH_REDIS_REST_URL` plus `UPSTASH_REDIS_REST_TOKEN` in Vercel. This Redis store is required: a stateless Vercel deployment cannot safely remember which alerts were sent. When unavailable, the worker fails closed rather than spamming the channel.
4. Generate a high-entropy `CRON_SECRET` and add it to Vercel; Vercel Cron authenticates its request with that secret. The included `vercel.json` schedules the job **once daily** at 01:00 UTC / 08:00 WIB. Verify Vercel plan's cron allowance and view execution logs after production deployment.
5. Redeploy after setting variables. To test manually without exposing the secret in the URL, use an authenticated server-side call, e.g.:

```bash
curl -i https://ventrix-kappa.vercel.app/api/cron/radar \
  -H "Authorization: Bearer $CRON_SECRET"
```

   A successful response shows `sent` (0..5); repeating should report `sent:0` if there are no unseen candidates. Do not put these values into GitHub or browser-exposed `NEXT_PUBLIC_` variables. Daily cron does not send when required secrets are absent.

## Optional Frontrun Pro webhook

Frontrun Pro or higher is required for their API/webhooks. This is a **push receiver**, so no Frontrun API key is stored in VENTRIX for receiving events.

1. Set `FRONTRUN_WEBHOOK_SECRET` to a randomly generated string in Vercel and redeploy.
2. From a secured terminal, register the HTTPS endpoint with the Frontrun API (do not commit your Frontrun key):

```bash
curl -X POST "https://frontrun.vc/v1/webhooks" \
  -H "X-API-Key: $FRONTRUN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://ventrix-kappa.vercel.app/api/hooks/frontrun",
    "events": ["new_follows", "convergence"],
    "filters": {
      "sectors": ["AI/ML", "Crypto/Web3"],
      "is_company_only": true,
      "min_convergence": 3
    },
    "secret": "REPLACE_WITH_SAME_SECRET_AS_VERCEL"
  }'
```

3. Frontrun signs the **raw request body** in the `X-Frontrun-Signature: sha256=<hex>` header and includes an `X-Frontrun-Delivery-Id`. The backend verifies signature before processing, refuses missing IDs, and deduplicates retries in Redis.
4. Verified convergence requires **3+ tracked investors**, sector classification and company status. New-follows alerts require classification as a company with AI/crypto sector. Neither is evidence of a financing round.

Provider docs: [Webhooks](https://www.frontrun.vc/docs/endpoints/webhooks/) and [API](https://www.frontrun.vc/docs/).

## Architecture

```text
HN Algolia (free) --fetch+cache--> /radar + /api/radar
                                      |
Vercel Cron daily ---> /api/cron/radar --Redis dedup--> Discord webhook
Frontrun Pro -------> /api/hooks/frontrun --HMAC verify--> Redis dedup --> Discord
```

**Security / operations**
- No client-side secrets. No unverified POST to Discord; worker authentication requires `CRON_SECRET`.
- The Frontrun handler rejects bad signature, unknown events and missing delivery ID; `allowed_mentions: { parse: [] }` protects channels against malicious pings.
- Redis keys expire after 30 days. Discord sends are bounded to <=5 public signals/day or <=5 relevant follows per webhook event.
- Failed downstream deliveries return 502 so Frontrun can retry. Operational logs should be monitored; delivery retries are not guaranteed exactly once across partial network failures.
- Free HN API coverage is incomplete and may include product demos rather than companies; no VC graph inference is possible without another data source.
- System health is visible on /radar. The public page reveals only whether integrations are configured, never secret values.
