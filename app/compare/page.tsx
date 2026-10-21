"use client";
import {useMemo,useState} from "react";
import Link from "next/link";
import {BarChart,Bar,LineChart,Line,ResponsiveContainer,CartesianGrid,XAxis,YAxis,Tooltip,Cell,ReferenceLine} from "recharts";
import {ArrowUpRight,BarChart3,CalendarDays,CheckCheck,ExternalLink,Info,Search,TrendingUp} from "lucide-react";
import {funds} from "@/lib/data";
import {disclosures,aumHistory,formatAum} from "@/lib/aum";
import {BrandLogo} from "@/components/brand-logo";
import {Shell,Panel} from "@/components/terminal";
type Mode="rank"|"history";
const AUM_COLORS=["#63e5bd","#74b5fc","#b9a2fa","#f0c787","#e4a4bc","#8ee2e6","#86c4a1","#f2b29c","#9abaff","#b6d28c","#e8bef3","#91cde4","#bfc8e2"];
const fmt=(v:number)=>"$"+v.toFixed(2)+"B";
const first=()=>funds.map(f=>f.slug);
export default function Compare(){
 const[selected,setSelected]=useState<string[]>(first);
 const[mode,setMode]=useState<Mode>("rank");
 const[query,setQuery]=useState("");
 const[showFilters,setShowFilters]=useState(false);
 const[category,setCategory]=useState("All");
 const[sort,setSort]=useState("desc");
 const[includeBroad,setIncludeBroad]=useState(true);
 const[focus,setFocus]=useState<string|null>(null);
 const visibleFunds=useMemo(()=>funds.filter(f=>(category==="All"||f.type===category)&&f.name.toLowerCase().includes(query.toLowerCase())),[category,query]);
 const relevant=useMemo(()=>funds.filter(f=>selected.includes(f.slug)&&!!disclosures[f.slug]&&(includeBroad||f.slug!=="galaxy-ventures")).sort((a,b)=>sort==="asc"?(disclosures[a.slug].amount-disclosures[b.slug].amount):disclosures[b.slug].amount-disclosures[a.slug].amount),[selected,sort,includeBroad]);
 const lacking=useMemo(()=>funds.filter(f=>selected.includes(f.slug)&&!disclosures[f.slug]),[selected]);
 const raw=useMemo(()=>relevant.map((f,i)=>({slug:f.slug,name:f.name,value:disclosures[f.slug].amount,source:disclosures[f.slug].source,date:disclosures[f.slug].asOf,origin:disclosures[f.slug].origin,scope:disclosures[f.slug].scope,color:AUM_COLORS[i%AUM_COLORS.length]})),[relevant]);
 const historical=funds.filter(f=>selected.includes(f.slug)&&aumHistory[f.slug]&& (includeBroad||f.slug!=="galaxy-ventures"));
 const timeline=Array.from({length:5},(_,i)=>{const year=i+2021;return {year,...Object.fromEntries(historical.map(f=>[f.slug,aumHistory[f.slug].find(p=>p.year===year)?.amount??null]))}});
 const known=Object.keys(disclosures).length;
 const selectedLatest=relevant.reduce((m,f)=>Math.max(m,disclosures[f.slug].amount),0);
 const change=(slug:string)=>setSelected(cur=>cur.includes(slug)?cur.filter(x=>x!==slug):[...cur,slug]);
 return <Shell title="AUM Comparison Lab" subtitle="Institutional asset intelligence · regulatory filings, manager disclosures and audited provenance">
 <div className="aum-summary">
  <div className="aum-stat"><span>FUND UNIVERSE</span><strong>{funds.length}</strong><small>All firms selectable</small></div>
  <div className="aum-stat"><span>AUM DISCLOSURES</span><strong>{known}<em>/{funds.length}</em></strong><small>Dated public records</small></div>
  <div className="aum-stat"><span>LARGEST DISCLOSED</span><strong>{formatAum(Math.max(...Object.values(disclosures).map(x=>x.amount)),1)}</strong><small>Manager-wide · not VC-only</small></div>
  <div className="aum-stat"><span>YOUR COMPARISON</span><strong>{selected.length}</strong><small>{relevant.length} with published figures</small></div>
 </div>
 <div className="aum-caution"><Info size={17}/><span><b>AUM ≠ committed capital, fund performance, or fund size.</b> SEC regulatory AUM is generally adviser-wide; fund manager figures use different definitions and reporting dates. Missing disclosures are labelled <b>Undisclosed</b>, never $0. Galaxy's RAUM is broader than Galaxy Ventures alone. Values are research snapshots, not a live API.</span></div>
 <section className="aum-terminal">
  <div className="aum-terminal-head"><div><div className="eyebrow">CAPITAL INTELLIGENCE // VENTRIX LAB</div><h2>Institutional AUM Monitor</h2><p>Every tracked fund, one verifiable comparison.</p></div><span className="aum-livepill">SOURCE-VERIFIED SNAPSHOTS</span></div>
  <div className="aum-controls">
   <div className="aum-segments"><button className={mode==="rank"?"on":""} onClick={()=>setMode("rank")}><BarChart3 size={16}/> Latest AUM Rankings</button><button className={mode==="history"?"on":""} onClick={()=>setMode("history")}><TrendingUp size={16}/> Historical AUM</button></div>
   <div className="aum-rightcontrols"><label className="aum-checkbox"><input type="checkbox" checked={includeBroad} onChange={e=>setIncludeBroad(e.target.checked)}/> Include broader manager AUM</label><select aria-label="Sort data" value={sort} onChange={e=>setSort(e.target.value)}><option value="desc">Largest first</option><option value="asc">Smallest first</option></select></div>
  </div>
  <div className="aum-view-meta"><span><i className="aum-dot"/>{mode==="rank"?"Latest reported AUM in USD billions":"Historical SEC regulatory AUM · fiscal years"}</span><span>{mode==="rank"?raw.length+" of "+selected.length+" selected funds with disclosures":historical.length+" managers with multi-year filings"}</span></div>
  {mode==="rank"?<div className="aum-chartframe">
    {raw.length?<ResponsiveContainer width="100%" height={Math.max(370,raw.length*53+50)}><BarChart data={raw} layout="vertical" margin={{top:14,right:74,bottom:16,left:10}} barCategoryGap={12}><defs><linearGradient id="aumGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#17644f"/><stop offset="100%" stopColor="#69e7be"/></linearGradient></defs><CartesianGrid stroke="#263548" strokeDasharray="2 6" horizontal={false}/><XAxis type="number" domain={[0,"auto"]} tickFormatter={(n:number)=>"$"+n+"B"} stroke="#7793aa" axisLine={false} tickLine={false} tick={{fontSize:11}}/><YAxis type="category" dataKey="name" width={165} stroke="#b6c7dc" axisLine={false} tickLine={false} tick={{fontSize:12,fontWeight:600}}/><Tooltip cursor={{fill:"rgba(112,225,186,.06)"}} content={({active,payload})=>{if(!active||!payload?.length)return null;const r=payload[0]?.payload as (typeof raw)[number];return <div className="aum-tooltip"><strong>{r.name}</strong><b>{fmt(r.value)}</b><span>{r.origin}</span><span>Filed / stated: {r.date}</span><span>{r.scope}</span></div>}}/><Bar dataKey="value" fill="url(#aumGrad)" radius={[0,8,8,0]} maxBarSize={27} label={{position:"right",fill:"#bcf8e0",fontSize:11,formatter:(v:unknown)=>typeof v==="number"?fmt(v):""}}>{raw.map((x,i)=><Cell key={x.slug} fill={focus===x.slug?"#f0c787":AUM_COLORS[i%AUM_COLORS.length]} onClick={()=>setFocus(x.slug)} style={{cursor:"pointer"}}/>)}</Bar></BarChart></ResponsiveContainer>:<div className="aum-no-data">No selected funds have public AUM disclosures. Select a fund with a published figure below.</div>}
  </div>:<div className="aum-chartframe">{historical.length?<ResponsiveContainer width="100%" height={440}><LineChart data={timeline} margin={{top:18,right:24,bottom:12,left:8}}><CartesianGrid stroke="#253749" strokeDasharray="3 7"/><XAxis dataKey="year" stroke="#8297ad" tick={{fontSize:12}}/><YAxis stroke="#8297ad" tick={{fontSize:11}} tickFormatter={(v:number)=>"$"+v+"B"}/><Tooltip contentStyle={{background:"#122034",border:"1px solid #385469",borderRadius:10}} formatter={(v:unknown,n:unknown)=>[typeof v==="number"?fmt(v):"N/D",funds.find(f=>f.slug===n)?.name||String(n)]}/>{historical.map((f,i)=><Line name={f.slug} key={f.slug} type="monotone" dataKey={f.slug} stroke={AUM_COLORS[i%AUM_COLORS.length]} strokeWidth={3} dot={{r:3,strokeWidth:0}} activeDot={{r:6}} connectNulls={false}/>)}</LineChart></ResponsiveContainer>:<div className="aum-no-data">Historical SEC AUM series are unavailable for selected funds.</div>}<div className="aum-historylegend">{historical.map((f,i)=><span key={f.slug}><i style={{background:AUM_COLORS[i%AUM_COLORS.length]}}/>{f.name}</span>)}</div><p className="aum-footnote">Historical figures refer to annual SEC Form ADV regulatory AUM (fiscal years 2021–2025); they are not investment returns. Series from manager websites and SEC filings are not merged when definitions differ.</p></div>}
  <div className="aum-chartfooter"><span>Source: official manager disclosures &amp; SEC Form ADV via filing repositories</span><span>As-of dates vary by fund · updated research Oct 2026</span></div>
 </section>
 <Panel title="Fund Universe & Comparison Selection" action={<span className="aum-small-counter">{selected.length}/{funds.length} selected</span>}>
  <div className="aum-fundcontrols"><div className="aum-fundbuttons"><button onClick={()=>setSelected(first())}><CheckCheck size={14}/> Select all {funds.length}</button><button onClick={()=>setSelected(Object.keys(disclosures))}>With AUM data</button><button onClick={()=>setSelected(funds.filter(f=>f.type==="Venture").map(f=>f.slug))}>Venture only</button><button onClick={()=>setSelected([])}>Clear</button></div><div className="aum-fundsearch"><Search size={16}/><input placeholder="Search any fund..." value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search funds"/></div><select aria-label="Filter fund category" value={category} onChange={e=>setCategory(e.target.value)}>{["All","Venture","Hybrid","Corporate"].map(v=><option key={v}>{v}</option>)}</select><button className="aum-filtertoggle" onClick={()=>setShowFilters(v=>!v)}>{showFilters?"Compact":"Show all"} · {visibleFunds.length}</button></div>
  <div className="aum-fundgrid">{(showFilters?visibleFunds:visibleFunds.slice(0,16)).map(f=>{const d=disclosures[f.slug];return <button type="button" key={f.slug} onClick={()=>change(f.slug)} className={"aum-fundchoice "+(selected.includes(f.slug)?"selected":"")}><BrandLogo name={f.name} website={f.website} size={27} color={f.color}/><span className="aum-fundlabel"><b>{f.name}</b><small>{d?formatAum(d.amount):"Undisclosed"}</small></span><span className="aum-checkmark">{selected.includes(f.slug)?"✓":"+"}</span></button>})}</div>
  {!showFilters&&visibleFunds.length>16&&<button className="aum-expand" onClick={()=>setShowFilters(true)}>Show remaining {visibleFunds.length-16} funds ↓</button>}
 </Panel>
 <Panel title={"Complete AUM Research Ledger · "+funds.length+" firms"}>
  <div className="aum-tablewrap"><table className="aum-ledger"><thead><tr><th>FUND / ADVISER</th><th>LATEST AUM</th><th>REPORT DATE</th><th>METRIC & SCOPE</th><th>PROVENANCE</th><th></th></tr></thead><tbody>{[...funds].sort((a,b)=>(disclosures[b.slug]?.amount??-1)-(disclosures[a.slug]?.amount??-1)).map(f=>{const d=disclosures[f.slug];return <tr key={f.slug}><td><Link href={"/funds/"+f.slug} className="fundcell"><BrandLogo name={f.name} website={f.website} size={31}/><strong>{f.name}</strong></Link></td><td><strong className={d?"aum-number":"aum-undisclosed"}>{d?formatAum(d.amount):"Undisclosed"}</strong></td><td>{d?.asOf??"—"}</td><td><span className="aum-scope">{d?.scope??"Not publicly established"}</span></td><td>{d?<a className="aum-source" href={d.source} target="_blank" rel="noopener noreferrer">{d.origin}<ExternalLink size={12}/></a>:<span className="aum-undisclosed">No verified source</span>}</td><td><Link href={"/funds/"+f.slug}><ArrowUpRight size={15}/></Link></td></tr>})}</tbody></table></div>
  <p className="aum-footnote">Research covers all 41 funds, but this is not a complete list of investment advisers worldwide. An omitted figure means no defensible firm-level AUM value was established during this research pass, not that the manager has zero assets.</p>
 </Panel>
 </Shell>;
}
