import { Shell } from "@/components/terminal";
import { RadarBoard } from "@/components/radar-board";
import { getRadarSnapshot } from "@/lib/radar";
import { hasRedisConfig } from "@/lib/radar-delivery";
import "./radar.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Early Startup Radar — VENTRIX",
  description: "Discover public AI and crypto project launches with transparent source attribution."
};
export default async function RadarPage() {
  const snapshot = await getRadarSnapshot();
  const integrations = {
    frontrunWebhook: Boolean(process.env.FRONTRUN_WEBHOOK_SECRET),
    customWebhook: Boolean(process.env.RADAR_INGEST_SECRET),
    cron: Boolean(process.env.CRON_SECRET),
    discord: Boolean(process.env.DISCORD_WEBHOOK_URL),
    dedup: hasRedisConfig()
  };
  return <Shell title="Early Startup Radar" subtitle="Spot public AI & crypto launches, rank community momentum, and configure source-aware alerts.">
    <RadarBoard snapshot={snapshot} integrations={integrations} />
  </Shell>;
}
