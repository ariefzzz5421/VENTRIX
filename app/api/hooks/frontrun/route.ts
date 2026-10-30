import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { confirmDelivery, frontrunEmbed, hasRedisConfig, releaseDelivery, reserveDelivery, sendDiscord } from "@/lib/radar-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Classification = { is_company?: boolean; sector?: string; entity_type?: string };
type Follow = { username?: string; name?: string; description?: string; classification?: Classification };
type EventData = {
  username?: string; name?: string; description?: string; followed_by?: string[];
  classification?: Classification; tracked_account?: string; new_follows?: Follow[];
};
type Event = { event?: string; timestamp?: string; data?: EventData };

function verify(raw: string, header: string | null, secret: string) {
  if (!header || !/^sha256=[a-f0-9]{64}$/i.test(header)) return false;
  const mac = createHmac("sha256", secret).update(raw, "utf8").digest("hex");
  const actual = Buffer.from(header.slice(7), "hex");
  const expected = Buffer.from(mac, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function trackedSector(classification?: Classification) {
  const sector = classification?.sector || "";
  return /\b(ai|machine learning|crypto|web3|blockchain|defi|infrastructure)\b/i.test(sector);
}
export async function POST(req: Request) {
  const secret = process.env.FRONTRUN_WEBHOOK_SECRET;
  if (!secret || !process.env.DISCORD_WEBHOOK_URL || !hasRedisConfig())
    return NextResponse.json({ error: "Webhook receiver is not configured" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 64_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  if (!verify(raw, req.headers.get("x-frontrun-signature"), secret))
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  const deliveryId = req.headers.get("x-frontrun-delivery-id");
  if (!deliveryId || deliveryId.length > 160) return NextResponse.json({ error: "Missing delivery ID" }, { status: 400 });
  let payload: Event;
  try { payload = JSON.parse(raw) as Event; }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const event = payload.event;
  if ((event !== "convergence" && event !== "new_follows") || req.headers.get("x-frontrun-event") !== event)
    return NextResponse.json({ error: "Unsupported or mismatched event" }, { status: 400 });
  const data = payload.data || {};
  const embeds = [];
  if (event === "convergence") {
    const investors = (data.followed_by || []).filter((v): v is string => typeof v === "string");
    if (investors.length >= 3 && data.classification?.is_company !== false && trackedSector(data.classification) && data.username) {
      embeds.push(frontrunEmbed({
        event, handle: data.username, name: data.name || data.username,
        description: data.description, sector: data.classification?.sector,
        investors, timestamp: payload.timestamp
      }));
    }
  } else {
    const tracked = typeof data.tracked_account === "string" ? data.tracked_account : "tracked investor";
    for (const follow of (Array.isArray(data.new_follows) ? data.new_follows : []).slice(0, 5)) {
      if (!follow || follow.classification?.is_company !== true || !trackedSector(follow.classification) || !follow.username) continue;
      embeds.push(frontrunEmbed({
        event, handle: follow.username, name: follow.name || follow.username,
        description: follow.description, sector: follow.classification?.sector,
        investors: [tracked], timestamp: payload.timestamp
      }));
    }
  }
  if (!embeds.length) return NextResponse.json({ ok: true, ignored: "Below threshold or outside watched sectors" });
  let key: string | null = null;
  try {
    key = await reserveDelivery("frontrun:" + deliveryId);
    if (!key) return NextResponse.json({ ok: true, duplicate: true });
    await sendDiscord(embeds, "VENTRIX · Frontrun " + event.replace("_", " ") + " signal");
    await confirmDelivery(key);
    return NextResponse.json({ ok: true, sent: embeds.length });
  } catch (error) {
    if (key) await releaseDelivery(key).catch(() => undefined);
    console.error("Frontrun webhook forwarding failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Forwarding failed" }, { status: 502 });
  }
}
