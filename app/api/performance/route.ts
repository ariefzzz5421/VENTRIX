import {NextResponse} from "next/server";
import {researchScores,scoreMeaning} from "@/lib/performance";
export function GET(){return NextResponse.json({kind:"source_coverage_proxies_not_realized_returns",asOf:"2026-10-21",rankings:researchScores,realizedDpiTvpIrr:null,disclaimer:scoreMeaning})}
