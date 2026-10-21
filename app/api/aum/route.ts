import {NextResponse} from "next/server";
import {funds} from "@/lib/data";
import {disclosures,aumHistory} from "@/lib/aum";
export const dynamic="force-static";
export function GET(){return NextResponse.json({asOfResearch:"2026-10-21",universe:funds.length,reported:Object.keys(disclosures).length,currency:"USD",unit:"billions",funds:funds.map(f=>({slug:f.slug,name:f.name,type:f.type,founded:f.founded,website:f.website,aum:disclosures[f.slug]??null,regulatoryHistory:aumHistory[f.slug]??[]})),methodology:"Adviser-wide regulatory or manager-reported assets under management, not VC-only assets, capital raised or investment return. Null denotes undisclosed; source dates and scopes vary."})}