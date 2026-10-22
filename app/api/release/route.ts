import {NextResponse} from "next/server";

export const dynamic = "force-dynamic";

/** Verify which source commit is actually serving production (not just merged on GitHub). */
export function GET() {
  return NextResponse.json(
    {
      service: "VENTRIX",
      release: "funding-network-v2",
      deployedCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      environment: process.env.VERCEL_ENV || "local",
      features: ["funding-rounds", "project-search", "performance-research", "investment-flow"],
      note: "This endpoint reports deployment identity, not data freshness or API provider health."
    },
    {headers: {"Cache-Control": "no-store, max-age=0"}}
  );
}
