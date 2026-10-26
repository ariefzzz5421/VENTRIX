"use client";

import {useMemo,useState} from "react";
import Link from "next/link";
import {Area,Bar,CartesianGrid,ComposedChart,Line,ResponsiveContainer,Tooltip,XAxis,YAxis} from "recharts";
import {funds,projects} from "@/lib/data";
import {fundingRounds,formatUsd} from "@/lib/funding";

const firstYear=2009;
// The latest curated announcement is dated 2026. Do not imply that future years are complete.
const lastYear=2026;
const equity=fundingRounds.filter(round=>round.instrument==="equity");
const knownFounded=funds.filter(fund=>fund.founded!==null);
const years=Array.from({length:lastYear-firstYear+1},(_,index)=>firstYear+index);
const points=years.map(year=>({
 year,
 annualUsdM:equity.filter(round=>Number(round.announcedAt.slice(0,4))===year).reduce((sum,round)=>sum+round.amountUsd/1e6,0),
 cumulativeUsdM:equity.filter(round=>Number(round.announcedAt.slice(0,4))<=year).reduce((sum,round)=>sum+round.amountUsd/1e6,0),
 roundCount:equity.filter(round=>Number(round.announcedAt.slice(0,4))===year).length,
 knownFunds:knownFounded.filter(fund=>(fund.founded??Infinity)<=year).length,
 foundedThisYear:knownFounded.filter(fund=>fund.founded===year).length,
}));
const money=(millions:number)=>formatUsd(millions*1e6);

export function FundingFlowChart(){
 const [mode,setMode]=useState<"funding"|"funds">("funding");
 const [selectedYear,setSelectedYear]=useState(2026);
 const annual=useMemo(()=>equity.filter(round=>Number(round.announcedAt.slice(0,4))===selectedYear).sort((a,b)=>b.announcedAt.localeCompare(a.announcedAt)),[selectedYear]);
 const founded=useMemo(()=>funds.filter(fund=>fund.founded===selectedYear).sort((a,b)=>a.name.localeCompare(b.name)),[selectedYear]);
 const total=equity.reduce((sum,round)=>sum+round.amountUsd,0);
 return <section className="flow-panel" aria-labelledby="flow-title">
  <div className="flow-head"><div><span className="eyebrow">VENTRIX // DOCUMENTED CAPITAL HISTORY</span><h2 id="flow-title">Crypto VC funding timeline</h2><p>Explore announced company financing and growth of the tracked fund directory from Bitcoin&apos;s 2009 launch through 2026.</p></div><div className="flow-tabs" role="group" aria-label="Chart metric"><button type="button" className={mode==="funding"?"active":""} aria-pressed={mode==="funding"} onClick={()=>setMode("funding")}>Funding rounds</button><button type="button" className={mode==="funds"?"active":""} aria-pressed={mode==="funds"} onClick={()=>setMode("funds")}>Fund count</button></div></div>
  <div className="flow-metrics"><div><span>INDEXED EQUITY ROUNDS</span><strong>{equity.length}</strong><small>Distinct official announcements</small></div><div><span>ANNOUNCED ROUND TOTAL</span><strong>{formatUsd(total)}</strong><small>Company proceeds, not VC check sizes</small></div><div><span>TRACKED CRYPTO FUNDS</span><strong>{funds.length}</strong><small>{knownFounded.length} with a recorded founding year</small></div></div>
  <div className="flow-chart" role="img" aria-label={mode==="funding"?"Annual and cumulative announced equity rounds in VENTRIX from 2009 to 2026":"Cumulative count of VENTRIX funds with a known founding year from 2009 to 2026"}>
   <ResponsiveContainer width="100%" height={310}><ComposedChart data={points} margin={{top:12,right:16,bottom:4,left:0}} onClick={event=>{const year=Number(event?.activeLabel);if(year>=firstYear&&year<=lastYear)setSelectedYear(year)}}>
    <CartesianGrid stroke="#2a4054" strokeDasharray="3 6" vertical={false}/><XAxis dataKey="year" stroke="#88a2b7" tickLine={false} axisLine={false} minTickGap={28} tick={{fontSize:11}}/><YAxis yAxisId="left" stroke="#88a2b7" tickLine={false} axisLine={false} width={53} tick={{fontSize:10}} tickFormatter={value=>mode==="funding"?"$"+value+"M":String(value)}/>
    {mode==="funding"&&<YAxis yAxisId="right" orientation="right" stroke="#d5b880" tickLine={false} axisLine={false} width={52} tick={{fontSize:10}} tickFormatter={value=>"$"+(value/1000).toFixed(1)+"B"}/>}
    <Tooltip content={({active,payload,label})=>{if(!active||!payload?.length)return null;const point=points.find(item=>item.year===Number(label));if(!point)return null;return <div className="flow-tooltip"><strong>{point.year}</strong>{mode==="funding"?<><span>Announced this year: <b>{point.roundCount?money(point.annualUsdM):"No round indexed"}</b></span><span>Cumulative indexed: <b>{point.roundCount||point.cumulativeUsdM?money(point.cumulativeUsdM):"No round indexed"}</b></span><small>{point.roundCount} sourced round{point.roundCount===1?"":"s"}</small></>:<><span>Tracked funds with known year: <b>{point.knownFunds}</b></span><small>{point.foundedThisYear} founded in {point.year} within this directory</small></>}</div>}}/>
    {mode==="funding"?<><Bar yAxisId="left" dataKey="annualUsdM" fill="#63dcad" radius={[4,4,0,0]} maxBarSize={36} name="Annual announced"/><Line yAxisId="right" type="monotone" dataKey="cumulativeUsdM" stroke="#e0bb76" strokeWidth={2.5} dot={false} activeDot={{r:5}} name="Cumulative indexed"/></>:<Area yAxisId="left" type="stepAfter" dataKey="knownFunds" stroke="#69dfb5" fill="#4fbc9b33" strokeWidth={3} name="Known founding year"/>}
   </ComposedChart></ResponsiveContainer>
  </div>
  <div className="flow-key"><span><i className="flow-key-bar"/> {mode==="funding"?"Annual indexed equity round value":"Cumulative funds with known founding year"}</span>{mode==="funding"&&<span><i className="flow-key-line"/> Cumulative indexed round value</span>}</div>
  <div className="flow-detail"><label>Inspect year <select value={selectedYear} onChange={event=>setSelectedYear(Number(event.target.value))} aria-label="Inspect funding year">{years.slice().reverse().map(year=><option value={year} key={year}>{year}</option>)}</select></label><span>{mode==="funding"?`${annual.length} sourced equity round${annual.length===1?"":"s"}`:`${founded.length} tracked fund${founded.length===1?"":"s"} founded`}</span></div>
  <div className="flow-detail-list">{mode==="funding"?(annual.length?annual.map(round=>{const project=projects.find(item=>item.slug===round.projectSlug);return <div key={round.id}><Link href={"/projects/"+round.projectSlug}>{project?.name??round.projectSlug}</Link><span>{round.stage} · {round.announcedAt}</span><strong>{formatUsd(round.amountUsd)}</strong><a href={round.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Source for ${project?.name??round.projectSlug} ${round.stage}`}>Source ↗</a></div>}):<p>No equity round has been indexed for {selectedYear}. Coverage is incomplete; this does not mean market funding was zero.</p>):(founded.length?founded.map(fund=><div key={fund.slug}><Link href={"/funds/"+fund.slug}>{fund.name}</Link><span>{fund.type} · {fund.headquarters}</span></div>):<p>No tracked fund has a verified founding year of {selectedYear}. Funds with an unknown founding year are excluded from the series.</p>)}</div>
  <p className="flow-note"><strong>Coverage:</strong> Curated VENTRIX sample, not a global crypto venture market total. Annual bars sum each distinct disclosed company equity round once; participating investors are not each credited with the full round. Token sales and rounds with an undisclosed instrument are excluded. Fund counts refer only to this directory; missing founding years are unknown, never treated as zero. Sources are linked in each selected year and in <Link href="/deals">Funding Rounds</Link>.</p>
 </section>;
}
