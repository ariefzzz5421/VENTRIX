"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ReactFlow,Background,BackgroundVariant,Controls,Handle,Position,MarkerType,type Node,type Edge,type NodeProps} from "@xyflow/react";
import {ArrowUpRight,ExternalLink,GitBranch,Info,Search,Waypoints} from "lucide-react";
import {funds,projects,type Fund,type Project} from "@/lib/data";
import {fundingRounds} from "@/lib/funding";
import {BrandLogo} from "@/components/brand-logo";
import {Shell} from "@/components/terminal";
import "./network.css";

type Evidence="official"|"portfolio";
type View="sankey"|"graph"|"tree";
type Relation={id:string;fund:Fund;project:Project;evidence:Evidence;source:string;rounds:number;year:string|null;roundSources?:{id:string;stage:string;date:string;url:string}[]};
type Detail={kind:"fund"|"project"|"relation";fund?:Fund;project?:Project;relation?:Relation};
const fundNames=new Map(funds.map(f=>[f.name,f]));
const projectSlugs=new Map(projects.map(p=>[p.slug,p]));
const projectNames=new Map(projects.map(p=>[p.name,p]));
const ICON=(url:string)=>{try{const domain=new URL(url).hostname;if(domain==="polychain.capital")return "";return "https://www.google.com/s2/favicons?domain="+encodeURIComponent(domain)+"&sz=128"}catch{return ""}};
const COLORS=["#6ce6c1","#76b8f2","#e3be86","#bcaaf4","#82d8d3","#d8a0b4","#8bcda2","#adc0e8"];
const officialRelations:Relation[]=(()=>{
  const result=new Map<string,Relation>();
  for(const round of fundingRounds.filter(item=>item.instrument!=="token-sale")){
    const project=projectSlugs.get(round.projectSlug);
    if(!project)continue;
    for(const name of round.investors){
      const fund=fundNames.get(name);
      if(!fund)continue; // Do not imply that similarly named firms are the same legal investor.
      const key=fund.slug+":"+project.slug,existing=result.get(key);
      const roundSource={id:round.id,stage:round.stage,date:round.announcedAt,url:round.sourceUrl};
      if(existing){existing.rounds++;existing.roundSources?.push(roundSource);if(!existing.year||existing.year>round.announcedAt.slice(0,4))existing.year=round.announcedAt.slice(0,4);}
      else result.set(key,{id:key,fund,project,evidence:"official",source:round.sourceUrl,rounds:1,year:round.announcedAt.slice(0,4),roundSources:[roundSource]});
    }
  }
  return [...result.values()];
})();
const portfolioRelations:Relation[]=(()=>{
 const result=new Map(officialRelations.map(r=>[r.id,r]));
 for(const fund of funds){
   if(!fund.portfolioSource||fund.portfolioEvidence==="Pending")continue;
   for(const name of fund.investments){
     const project=projectNames.get(name);
     if(!project)continue;
     const id=fund.slug+":"+project.slug;
     if(!result.has(id))result.set(id,{id,fund,project,evidence:"portfolio",source:fund.portfolioSource,rounds:0,year:null});
   }
 }
 return [...result.values()];
})();

function InfoDrawer({detail,close}:{detail:Detail;close:()=>void}){
 const rel=detail.relation, fund=detail.fund||rel?.fund, project=detail.project||rel?.project;
 return <aside className="vn-drawer"><button onClick={close} className="vn-close" aria-label="Close details">×</button><span className="eyebrow">CONNECTION INTELLIGENCE</span>
 <h3>{rel?fund?.name+" → "+project?.name:fund?.name||project?.name}</h3>
 {fund&&<p><BrandLogo name={fund.name} website={fund.website} size={24}/> <Link href={"/funds/"+fund.slug}>Open fund profile <ArrowUpRight size={14}/></Link></p>}
 {project&&<p><BrandLogo name={project.name} website={project.website} size={24}/> <Link href={"/projects/"+project.slug}>Open project dossier <ArrowUpRight size={14}/></Link></p>}
 {rel&&<><p><strong>Evidence:</strong> {rel.evidence==="official"?"Named in an official funding announcement; instrument may be undisclosed":"Indexed portfolio reference (not necessarily confirmed for a particular round)"}</p>
 <p><strong>Known funding rounds:</strong> {rel.rounds||"Not individually documented"}</p><p><strong>Earliest indexed year:</strong> {rel.year||"Not established"}</p>
 {rel.roundSources?<div className="vn-round-sources">{rel.roundSources.map(item=><a key={item.id} target="_blank" rel="noopener noreferrer" href={item.url}>{item.stage} · {item.date} <ExternalLink size={13}/></a>)}</div>:<a target="_blank" rel="noopener noreferrer" href={rel.source}>Inspect evidence <ExternalLink size={13}/></a>}</>}
 {!rel&&<p className="mutedtext">Select a connecting flow to inspect the underlying evidence.</p>}
 </aside>;
}
function SankeyView({relations,onSelect}:{relations:Relation[];onSelect:(d:Detail)=>void}){
 const [active,setActive]=useState<string|null>(null);
 const left=[...new Map(relations.map(r=>[r.fund.slug,r.fund])).values()].sort((a,b)=>a.name.localeCompare(b.name));
 const right=[...new Map(relations.map(r=>[r.project.slug,r.project])).values()].sort((a,b)=>a.name.localeCompare(b.name));
 const h=Math.max(570,Math.max(left.length,right.length)*67+90),w=1170,lx=245,rx=895,thick=8;
 const leftCounts=new Map(left.map(f=>[f.slug,relations.filter(r=>r.fund.slug===f.slug).length]));
 const rightCounts=new Map(right.map(p=>[p.slug,relations.filter(r=>r.project.slug===p.slug).length]));
 const yLeft=new Map(left.map((f,i)=>[f.slug,50+(i+.5)*(h-100)/left.length]));
 const yRight=new Map(right.map((p,i)=>[p.slug,50+(i+.5)*(h-100)/right.length]));
 const outgoing=new Map<string,number>(),incoming=new Map<string,number>();
 const links=relations.slice().sort((a,b)=>a.fund.slug.localeCompare(b.fund.slug)||a.project.slug.localeCompare(b.project.slug)).map((r)=>{
 const leftIndex=outgoing.get(r.fund.slug)||0,rightIndex=incoming.get(r.project.slug)||0;
 outgoing.set(r.fund.slug,leftIndex+1);incoming.set(r.project.slug,rightIndex+1);
 const y1=(yLeft.get(r.fund.slug)||0)-(leftCounts.get(r.fund.slug)||1)*thick/2+leftIndex*thick;
 const y2=(yRight.get(r.project.slug)||0)-(rightCounts.get(r.project.slug)||1)*thick/2+rightIndex*thick;
 const c1=lx+230,c2=rx-230;
 return {...r,path:`M ${lx} ${y1} C ${c1} ${y1},${c2} ${y2},${rx} ${y2} L ${rx} ${y2+thick} C ${c2} ${y2+thick},${c1} ${y1+thick},${lx} ${y1+thick} Z`};
 });
 if(!relations.length)return <div className="empty-state">No source-backed relationships match the filters. Try another fund or choose portfolio references.</div>;
 return <div className="vn-scroll"><svg viewBox={`0 0 ${w} ${h}`} className="vn-sankey-svg" role="img" aria-label="Sankey diagram connecting venture funds at left with their portfolio projects at right">
 <defs><linearGradient id="vnFlow" x1="0" x2="1"><stop offset="0%" stopColor="#53cfae"/><stop offset="100%" stopColor="#7fa8e8"/></linearGradient></defs>
 <text x="22" y="24" className="vn-axis">CRYPTO VENTURE INVESTORS</text><text x="918" y="24" className="vn-axis">FUNDED PROJECTS</text>
  {links.map((r)=><path key={r.id} d={r.path} fill={active&&active!==r.id?"#38526b":"url(#vnFlow)"} opacity={active===r.id?.9:active?.10:r.evidence==="official"?.43:.19} stroke={active===r.id?"#e4d3a4":"none"} strokeWidth={1} role="button" tabIndex={0} aria-label={`${r.fund.name} to ${r.project.name} · ${r.evidence==="official"?"official funding announcement":"portfolio reference"}`} style={{cursor:"pointer",transition:"opacity .16s"}} onMouseEnter={()=>setActive(r.id)} onMouseLeave={()=>setActive(null)} onClick={()=>onSelect({kind:"relation",relation:r})} onKeyDown={e=>{if(e.key==="Enter"||e.key===" ")onSelect({kind:"relation",relation:r})}}/>)}
  {left.map((f,i)=>{const y=yLeft.get(f.slug)||0,deg=leftCounts.get(f.slug)||1,icon=ICON(f.website);return <g key={f.slug} role="button" tabIndex={0} aria-label={`Open ${f.name}`} onClick={()=>onSelect({kind:"fund",fund:f})} onKeyDown={e=>{if(e.key==="Enter")onSelect({kind:"fund",fund:f})}} style={{cursor:"pointer"}}><rect x={lx-1} y={y-deg*thick/2} width={14} height={deg*thick} rx="3" fill={COLORS[i%COLORS.length]}/>{icon&&<image href={icon} x="18" y={y-15} width="30" height="30"/>}<text x="57" y={y+5} className="vn-name">{f.name.length>23?f.name.slice(0,22)+"…":f.name}</text></g>})}
 {right.map(p=>{const y=yRight.get(p.slug)||0,deg=rightCounts.get(p.slug)||1,icon=ICON(p.website);return <g key={p.slug} role="button" tabIndex={0} onClick={()=>onSelect({kind:"project",project:p})} onKeyDown={e=>{if(e.key==="Enter")onSelect({kind:"project",project:p})}} style={{cursor:"pointer"}}><rect x={rx-13} y={y-deg*thick/2} width={14} height={deg*thick} rx="3" fill="#8baefa"/>{icon&&<image href={icon} x="913" y={y-15} width="30" height="30"/>}<text x="951" y={y+5} className="vn-name">{p.name.length>24?p.name.slice(0,23)+"…":p.name}</text></g>})}
 </svg></div>
}
type GraphNodeData=Record<string,unknown>&{label:string;kind:"fund"|"project";website:string};
type GraphNode=Node<GraphNodeData>;
function NodeCard({data}:NodeProps<GraphNode>){return <div className={"vn-graphnode "+data.kind}><Handle type="target" position={Position.Left}/><BrandLogo website={data.website} name={data.label} size={28}/><b>{data.label}</b><Handle type="source" position={Position.Right}/></div>}
const nodeTypes={card:NodeCard};
function GraphView({relations,onSelect}:{relations:Relation[];onSelect:(d:Detail)=>void}){
 const [compact,setCompact]=useState(false);
 useEffect(()=>{const update=()=>setCompact(window.matchMedia("(max-width: 700px)").matches);update();window.addEventListener("resize",update);return()=>window.removeEventListener("resize",update)},[]);
 const left=[...new Map(relations.map(r=>[r.fund.slug,r.fund])).values()];
 const right=[...new Map(relations.map(r=>[r.project.slug,r.project])).values()];
 const nodes:GraphNode[]=[...left.map((f,i)=>({id:"f:"+f.slug,type:"card",data:{kind:"fund" as const,label:f.name,website:f.website},position:{x:compact?8:40,y:30+i*(compact?75:85)}})),...right.map((p,i)=>({id:"p:"+p.slug,type:"card",data:{kind:"project" as const,label:p.name,website:p.website},position:{x:compact?175:470,y:30+i*(compact?75:85)}}))];
 const edges:Edge[]=relations.map(r=>({id:r.id,source:"f:"+r.fund.slug,target:"p:"+r.project.slug,type:"smoothstep",style:{stroke:r.evidence==="official"?"#6ce6c1":"#708ca9",strokeWidth:r.evidence==="official"?2:1,strokeDasharray:r.evidence==="portfolio"?"5 5":undefined},markerEnd:{type:MarkerType.ArrowClosed,color:"#6ce6c1"}}));
 return relations.length?<div className={"vn-reactflow"+(compact?" compact":"")}><ReactFlow key={relations.map(r=>r.id).join("|")+(compact?":compact":"")} nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView={!compact&&relations.length<=20} defaultViewport={compact?{x:6,y:24,zoom:1}:{x:65,y:35,zoom:.75}} fitViewOptions={{padding:.13,maxZoom:1}} minZoom={.35} maxZoom={1.8} onNodeClick={(_e,n)=>{const f=funds.find(f=>"f:"+f.slug===n.id),p=projects.find(p=>"p:"+p.slug===n.id);onSelect(f?{kind:"fund",fund:f}:{kind:"project",project:p})}} onEdgeClick={(_e,edge)=>{const r=relations.find(x=>x.id===edge.id);if(r)onSelect({kind:"relation",relation:r})}}><Background variant={BackgroundVariant.Dots} color="#334c61"/><Controls/></ReactFlow></div>:<div className="empty-state">No connections found.</div>;
}
function TreeView({relations,onSelect}:{relations:Relation[];onSelect:(d:Detail)=>void}){
 const [open,setOpen]=useState<string[]>([]);
 const grouped=[...new Map(relations.map(r=>[r.fund.slug,r.fund])).values()];
 return <div className="vn-tree">{grouped.map(f=>{const items=relations.filter(r=>r.fund.slug===f.slug),expanded=open.includes(f.slug);return <section className="vn-tree-card" key={f.slug}><button className="vn-tree-fund" onClick={()=>setOpen(s=>expanded?s.filter(v=>v!==f.slug):[...s,f.slug])}><BrandLogo name={f.name} website={f.website} size={32}/><span>{f.name}</span><small>{items.length} projects</small><strong>{expanded?"−":"+"}</strong></button>{expanded&&<div className="vn-tree-children">{items.map(r=><button onClick={()=>onSelect({kind:"relation",relation:r})} key={r.id}><BrandLogo name={r.project.name} website={r.project.website} size={26}/><span>{r.project.name}</span><small>{r.evidence==="official"?"Official round":"Portfolio source"}</small></button>)}</div>}</section>})}{!grouped.length&&<div className="empty-state">No connections found.</div>}</div>;
}
export default function Network(){
 const [view,setView]=useState<View>("sankey"),[evidence,setEvidence]=useState<Evidence>("official"),[selected,setSelected]=useState("All"),[sector,setSector]=useState("All"),[query,setQuery]=useState(""),[detail,setDetail]=useState<Detail|null>(null);
 const [all,setAll]=useState(false);
  const chosenFund=funds.find(f=>f.slug===selected);
  const chosenOfficial=chosenFund?officialRelations.filter(r=>r.fund.slug===chosenFund.slug).length:0;
  const chosenPortfolio=chosenFund?portfolioRelations.filter(r=>r.fund.slug===chosenFund.slug).length:0;
 const sectors=["All",...new Set(projects.map(p=>p.sector))].sort();
 const filtered=useMemo(()=>{const source=evidence==="official"?officialRelations:portfolioRelations;return source.filter(r=>(selected==="All"||r.fund.slug===selected)&&(sector==="All"||r.project.sector===sector)&&(!query||(r.fund.name+" "+r.project.name).toLowerCase().includes(query.toLowerCase())));},[evidence,selected,sector,query]);
 const list=useMemo(()=>{if(selected!=="All"||all||filtered.length<=50)return filtered;const ranked=[...filtered].sort((a,b)=>a.fund.name.localeCompare(b.fund.name)||a.project.name.localeCompare(b.project.name));return ranked.slice(0,50)},[filtered,all,selected]);
 return <Shell title="Investment Network" subtitle="Explore sourced VC → startup connections across three interactive diagram modes.">
 <div className="vn-evidence"><Info size={17}/><span><b>Evidence-first mapping:</b> Official rounds mean the investor was named in a project funding announcement. Portfolio discovery adds indexed associations whose exact investment round and check size may be unknown. <b>Flow width counts documented relationships, never invested dollars.</b></span></div>
 <section className="vn-workspace"><header className="vn-header"><div className="eyebrow">VENTRIX // VENTURE RELATIONSHIP INTELLIGENCE</div><h2>Capital Relationship Explorer</h2><p>Funds on the left. Funded projects on the right. Click any connection for details.</p></header>
  <div className="vn-toolbar"><label><Waypoints size={15}/> Diagram mode<select aria-label="Diagram mode" value={view} onChange={e=>{setView(e.target.value as View);setDetail(null)}}><option value="sankey">Sankey Diagram (Default)</option><option value="graph">Network Graph</option><option value="tree">Tree Diagram</option></select></label><label>Data source<select value={evidence} onChange={e=>{setEvidence(e.target.value as Evidence);setAll(false);setDetail(null)}} aria-label="Connection evidence"><option value="official">Official funding rounds</option><option value="portfolio">Include portfolio references</option></select></label><label>Track a VC fund<select value={selected} onChange={e=>{const slug=e.target.value;setSelected(slug);setAll(false);setDetail(null);if(slug!=="All"&&!officialRelations.some(r=>r.fund.slug===slug)&&portfolioRelations.some(r=>r.fund.slug===slug))setEvidence("portfolio")}} aria-label="Track venture fund"><option value="All">All sourced funds</option>{[...funds].sort((a,b)=>a.name.localeCompare(b.name)).map(f=><option key={f.slug} value={f.slug}>{f.name}{!portfolioRelations.some(r=>r.fund.slug===f.slug)?" · research pending":""}</option>)}</select></label><label>Sector<select value={sector} onChange={e=>setSector(e.target.value)} aria-label="Filter sector">{sectors.map(s=><option key={s}>{s}</option>)}</select></label><label className="vn-search"><Search size={15}/><input aria-label="Search connections" placeholder="Search fund / project" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
 <div className="vn-summary"><span>{new Set(list.map(r=>r.fund.slug)).size} VC investors</span><span>{new Set(list.map(r=>r.project.slug)).size} projects</span><span>{list.length} connections</span><span>{evidence==="official"?"Primary funding announcements":"Primary + portfolio-level references"}</span></div>
  {chosenFund&&<div className="vn-coverage"><strong>{chosenFund.name}</strong><span>{chosenOfficial} announced round connection{chosenOfficial===1?"":"s"} · {chosenPortfolio-chosenOfficial} additional portfolio reference{chosenPortfolio-chosenOfficial===1?"":"s"}</span>{chosenPortfolio===0?<span>No source-backed project connection is indexed yet; this is unknown, not zero investments.</span>:chosenOfficial===0&&evidence==="portfolio"?<span>Showing portfolio associations; round dates and check sizes are not verified.</span>:null}<Link href={"/funds/"+chosenFund.slug}>Fund profile ↗</Link></div>}
 {filtered.length>list.length&&<div className="vn-load"><span>Showing {list.length} of {filtered.length} connections for readability.</span><button onClick={()=>setAll(true)}>Show all {filtered.length}</button></div>}
 <div className="vn-visual">{view==="sankey"?<SankeyView relations={list} onSelect={setDetail}/>:view==="graph"?<GraphView relations={list} onSelect={setDetail}/>:<TreeView relations={list} onSelect={setDetail}/>}
 {detail&&<InfoDrawer detail={detail} close={()=>setDetail(null)}/>}</div>
 <footer className="vn-legend"><span><i/> Source-backed VC → project relationship</span><span>Use project filters or choose one fund for a focused diagram</span></footer>
 </section></Shell>;
}
