import { createHash } from "node:crypto";
import type { RadarSignal } from "@/lib/radar";

const PREFIX = "ventrix:radar:v1:";
const SENT_TTL_SECONDS = 30 * 24 * 60 * 60;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !/^https:\/\//.test(url)) throw new Error("Persistent Upstash Redis is not configured");
  return { url: url.replace(/\/$/, ""), token };
}
async function redisCommand<T>(args: (string | number)[]): Promise<T> {
  const { url, token } = redisConfig();
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
    signal: AbortSignal.timeout(4000)
  });
  if (!response.ok) throw new Error("Redis HTTP " + response.status);
  const body = (await response.json()) as { result?: T; error?: string };
  if (body.error) throw new Error("Redis rejected command");
  return body.result as T;
}
function dedupKey(input: string) { return PREFIX + createHash("sha256").update(input).digest("hex"); }

export async function reserveDelivery(id: string): Promise<string | null> {
  const key = dedupKey(id);
  const result = await redisCommand<string | null>(["SET", key, "pending", "EX", 300, "NX"]);
  return result === "OK" ? key : null;
}
export async function confirmDelivery(key: string) {
  await redisCommand(["SET", key, "sent", "EX", SENT_TTL_SECONDS]);
}
export async function releaseDelivery(key: string) {
  // Only pending leases are deleted; do not remove a completed delivery.
  const script = "if redis.call('GET', KEYS[1]) == 'pending' then return redis.call('DEL', KEYS[1]) else return 0 end";
  await redisCommand(["EVAL", script, 1, key]);
}
function safe(value: string | undefined | null, limit = 800): string {
  return (value || "").replace(/@/g, "@\u200b").slice(0, limit);
}
export type DiscordEmbed = {
  title: string; description?: string; url?: string; color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string }; timestamp?: string;
};
export async function sendDiscord(embeds: DiscordEmbed[], content = "VENTRIX · Early Startup Radar") {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook || !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[^/?#]+/.test(webhook))
    throw new Error("Discord webhook is not configured");
  if (embeds.length < 1 || embeds.length > 10) throw new Error("Invalid embed count");
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "VENTRIX Radar", content: safe(content, 1800), embeds, allowed_mentions: { parse: [] } }),
    signal: AbortSignal.timeout(7000),
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Discord delivery failed: HTTP " + response.status);
}
export function publicLaunchEmbed(signal: RadarSignal): DiscordEmbed {
  return {
    title: safe(signal.title, 240),
    description: "Public product-launch signal — **not** a verified investment, funding round, or VC-follow event.",
    url: signal.sourceUrl,
    color: signal.sector === "AI / ML" ? 0x69cced : 0x6ce6c1,
    fields: [
      { name: "Sector", value: signal.sector, inline: true },
      { name: "Community score", value: String(signal.score) + "/100 (heuristic)", inline: true },
      { name: "HN discussion", value: signal.points + " points · " + signal.comments + " comments", inline: true },
      { name: "Website", value: signal.websiteUrl ? "[Visit launch](" + signal.websiteUrl + ")" : "Not provided", inline: false }
    ],
    timestamp: signal.createdAt,
    footer: { text: "Source: Show HN via HN Algolia · Not a VC investment recommendation" }
  };
}
export function frontrunEmbed(input: {
  name: string; handle: string; description?: string; sector?: string;
  investors?: string[]; timestamp?: string; event: "convergence" | "new_follows";
}): DiscordEmbed {
  const investors = (input.investors || []).slice(0, 12).map(x => safe(x, 40));
  return {
    title: safe(input.name || input.handle, 240),
    description: safe(input.description, 350) + "\n\n" + (input.event === "convergence" ? "**VC follow convergence** (not proof of investment)." : "**New tracked follow** (not proof of investment)."),
    url: /^[-_a-z0-9]{1,32}$/i.test(input.handle) ? "https://x.com/" + input.handle : undefined,
    color: 0xc6a6ff,
    fields: [
      { name: "Sector", value: safe(input.sector || "Unclassified", 100), inline: true },
      { name: "Tracked follows", value: investors.length ? investors.length + " — " + investors.join(", ") : "1 tracked account", inline: false }
    ],
    ...(input.timestamp && !Number.isNaN(Date.parse(input.timestamp)) ? { timestamp: input.timestamp } : {}),
    footer: { text: "Source: Frontrun webhook · Follow signal, not a confirmed financing" }
  };
}
