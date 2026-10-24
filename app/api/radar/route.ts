import { NextResponse } from "next/server";
import { getRadarSnapshot } from "@/lib/radar";

export const dynamic = "force-dynamic";
export async function GET() {
  const snapshot = await getRadarSnapshot();
  return NextResponse.json(snapshot, {
    status: snapshot.sourceOk ? 200 : 503,
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900" }
  });
}
