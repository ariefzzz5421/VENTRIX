import {NextResponse} from "next/server";
import {projects,funds} from "@/lib/data";
import {byProject,documentedEquity,documentedTokenSales} from "@/lib/funding";
export function GET(req:Request){const search=new URL(req.url).searchParams.get("search")?.toLowerCase()||"";return NextResponse.json({count:projects.filter(p=>p.name.toLowerCase().includes(search)).length,projects:projects.filter(p=>p.name.toLowerCase().includes(search)).map(p=>({...p,documentedEquityUsd:documentedEquity(p.slug),documentedTokenSalesUsd:documentedTokenSales(p.slug),rounds:byProject(p.slug).length,portfolioAssociations:funds.filter(f=>f.investments.includes(p.name)).map(f=>f.slug)})),disclaimer:"Amounts represent only sourced announced rounds, NOT complete lifetime totals. Missing=null, not zero."})}
