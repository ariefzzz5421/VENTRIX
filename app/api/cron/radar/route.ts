import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getRadarSnapshot } from "@/lib/radar";
import { confirmDelivery, publicLaunchEmbed, releaseDelivery, reserveDelivery, sendDiscord } from "@/lib/radar-delivery";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
function authorized(req: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = req.headers.get("authorization") || "";
  if (!expected || !supplied.startsWith("Bearer ")) return false;
  const a = Buffer.from(supplied.slice(7)), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.DISCORD_WEBHOOK_URL || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)
    return NextResponse.json({ error: "Discord or persistent deduplication store is not configured" }, { status: 503 });
  const snapshot = await getRadarSnapshot();
  if (!snapshot.sourceOk) return NextResponse.json({ error: "Public source unavailable — no fabricated fallback" }, { status: 503 });
  const selected: typeof snapshot.signals = [];
  const reserved: string[] = [];
  try {
    for (const signal of snapshot.signals.filter(s => s.score >= 48)) {
      if (selected.length >= 5) break;
      const key = await reserveDelivery("hn:" + signal.id);
      if (key) { selected.push(signal); reserved.push(key); }
    }
    if (!selected.length) return NextResponse.json({ ok: true, sent: 0, reason: "No new qualified signals" });
    await sendDiscord(selected.map(publicLaunchEmbed), "VENTRIX · " + selected.length + " new public startup-launch signals");
    await Promise.all(reserved.map(confirmDelivery));
    return NextResponse.json({ ok: true, sent: selected.length, source: "Show HN", asOf: snapshot.asOf });
  } catch (error) {
    await Promise.allSettled(reserved.map(releaseDelivery));
    console.error("Radar dispatch failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Dispatch failed; check server logs" }, { status: 502 });
  }
}
