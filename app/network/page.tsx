"use client";
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {Background,BackgroundVariant,Controls,Edge,Handle,MarkerType,MiniMap,Node,NodeProps,Position,ReactFlow,useEdgesState,useNodesState} from "@xyflow/react";
import {ArrowUpRight,ExternalLink,GitBranch,Info,Maximize2,Network as NetworkIcon,Search} from "lucide-react";
import {funds,projects} from "@/lib/data";
import {fundingRounds,formatUsd} from "@/lib/funding";
import {BrandLogo} from "@/components/brand-logo";
import {Shell} from "@/components/terminal";
type EntityData=Record<string,unknown>&{kind:"fund"|"round"|"project";label:string;sub:string;website?:string;amount?:string;source?:string;projectSlug?:string;fundSlug?:string;roundId?:string};
type FlowNode=Node<EntityData>;
const fundLookup=new Map(funds.map(f=>[f.name,f]));
const projectLookup=new Map(projects.map(p=>[p.slug,p]));
function EntityCard({data,selected}:NodeProps<FlowNode>){return <div className={"flow-entity flow-"+data.kind+(selected?" flow-active":"")}><Handle type="target" position={Position.Left} className="flow-handle"/><div className="flow-entity-inner">{data.kind==="round"?<div className="flow-round-symbol"><GitBranch size={18}/></div>:<BrandLogo name={data.label} website={data.website||""} size={38}/>}<div className="flow-entity-text"><b>{data.label}</b><small>{data.sub}</small>{data.amount&&<strong>{data.amount}</strong>}</div></div><Handle type="source" position={Position.Right} className="flow-handle"/></div>}
const nodeTypes={entity:EntityCard};
type Mode="rounds"|"portfolio";
function createGraph(mode:Mode,selectedFund:string,sector:string,search:string,kind:string):{nodes:FlowNode[];edges:Edge[]}{
 const edges:Edge[]=[];const nodes:FlowNode[]=[];const projectNames=(id:string)=>projectLookup.get(id)?.name||id;
 if(mode==="rounds"){
   let rounds=fundingRounds.filter(r=>(selectedFund==="All"||r.investors.includes(selectedFund)||r.leadInvestors.includes(selectedFund))&&(kind==="All"||r.instrument===kind)&&(sector==="All"||projectLookup.get(r.projectSlug)?.sector===sector)&&(!search||[projectNames(r.projectSlug),r.stage,...r.investors].join(" ").toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>b.amountUsd-a.amountUsd);
   // Full register shown; no truncation of source-backed events.
   const fundingNames=Array.from(new Set(rounds.flatMap(r=>r.investors.filter(n=>selectedFund==="All"||n===selectedFund))));
   const pSlugs=Array.from(new Set(rounds.map(r=>r.projectSlug)));
   for(let i=0;i<fundingNames.length;i++){const f=fundLookup.get(fundingNames[i]);nodes.push({id:"fund:"+fundingNames[i],type:"entity",position:{x:30,y:30+i*115},data:{kind:"fund",label:fundingNames[i],sub:f?"Tracked VC · investor":"Named external investor",website:f?.website, fundSlug:f?.slug}})}
   for(let i=0;i<rounds.length;i++){const r=rounds[i];nodes.push({id:"round:"+r.id,type:"entity",position:{x:375,y:30+i*125},data:{kind:"round",label:r.stage,sub:r.announcedAt,amount:formatUsd(r.amountUsd),source:r.sourceUrl,projectSlug:r.projectSlug,roundId:r.id}});for(const name of r.investors.filter(n=>fundingNames.includes(n))){edges.push({id:"e:"+name+":"+r.id,source:"fund:"+name,target:"round:"+r.id,type:"smoothstep",animated:false,style:{stroke:"#65b6a3",strokeWidth:1.5,opacity:.75},markerEnd:{type:MarkerType.ArrowClosed,color:"#65b6a3",width:13,height:13}})}edges.push({id:"p:"+r.id,source:"round:"+r.id,target:"project:"+r.projectSlug,type:"smoothstep",style:{stroke:"#79aaf2",strokeWidth:2.3},markerEnd:{type:MarkerType.ArrowClosed,color:"#79aaf2",width:14,height:14}})}
   for(let i=0;i<pSlugs.length;i++){const p=projectLookup.get(pSlugs[i]);nodes.push({id:"project:"+pSlugs[i],type:"entity",position:{x:745,y:30+i*155},data:{kind:"project",label:p?.name||pSlugs[i],sub:p?.sector||"Crypto project",website:p?.website,projectSlug:pSlugs[i]}})}
 }else{
   const list=funds.filter(f=>selectedFund==="All"?(f.investments.length>0):f.name===selectedFund).filter(f=>!search||f.name.toLowerCase().includes(search.toLowerCase())||f.investments.some(n=>n.toLowerCase().includes(search.toLowerCase())));
   // Avoid rendering a hairball with 100+ links; select individual fund for full portfolio discovery.
   const clipped=selectedFund==="All"?list.slice(0,6):list;
   const matches=(name:string)=>{const p=projects.find(p=>p.name===name);return !!p&&(sector==="All"||p.sector===sector)&&(!search||(p.name+" "+p.sector+" "+clipped.map(f=>f.name).join(" ")).toLowerCase().includes(search.toLowerCase()))};
   const projectNames=Array.from(new Set(clipped.flatMap(f=>f.investments.filter(matches))));const step=Math.max(105,projectNames.length*100/Math.max(clipped.length,1));
   for(let i=0;i<clipped.length;i++){const f=clipped[i];nodes.push({id:"fund:"+f.name,type:"entity",position:{x:60,y:45+i*step},data:{kind:"fund",label:f.name,sub:f.portfolioEvidence+" portfolio",fundSlug:f.slug,website:f.website,source:f.portfolioSource||undefined}})}
   for(let i=0;i<projectNames.length;i++){const p=projects.find(p=>p.name===projectNames[i]);if(!p)continue;nodes.push({id:"project:"+p.slug,type:"entity",position:{x:540,y:45+i*105},data:{kind:"project",label:p.name,sub:p.sector,projectSlug:p.slug,website:p.website}});for(const f of clipped.filter(f=>f.investments.includes(p.name))){edges.push({id:"portfolio:"+f.slug+":"+p.slug,source:"fund:"+f.name,target:"project:"+p.slug,type:"smoothstep",style:{stroke:"#779bb4",strokeDasharray:"5 5",strokeWidth:1.6},markerEnd:{type:MarkerType.ArrowClosed,color:"#779bb4",width:13,height:13}})}}
 }
 return {nodes,edges};
}
export default function Network(){
 const[mode,setMode]=useState<Mode>("rounds");const[fund,setFund]=useState("All");const[sector,setSector]=useState("All");const[kind,setKind]=useState("All");const[search,setSearch]=useState("");const[detail,setDetail]=useState<EntityData|null>(null);
 const sectors=["All",...Array.from(new Set(projects.map(p=>p.sector))).sort()];
 const graph=useMemo(()=>createGraph(mode,fund,sector,search,kind),[mode,fund,sector,search,kind]);
 const[nodes,setNodes,onNodesChange]=useNodesState<FlowNode>(graph.nodes);
 const[edges,setEdges,onEdgesChange]=useEdgesState<Edge>(graph.edges);
 useEffect(()=>{setNodes(graph.nodes);setEdges(graph.edges);setDetail(null)},[graph,setNodes,setEdges]);
 const detailRound=detail?.roundId?fundingRounds.find(r=>r.id===detail.roundId):null;
 const affiliated=detail?.projectSlug?funds.filter(f=>f.investments.includes(projectLookup.get(detail.projectSlug!)?.name||"")):[];
 return <Shell title="Interactive Investment Network" subtitle="Trace documented capital relationships across venture investors, funding rounds and projects.">
 <div className="network-explainer"><Info size={17}/><span><b>Two evidence levels:</b> Solid paths show investors named in individual official funding announcements; dashed paths are historical portfolio research associations, not proof of round participation. Click nodes to inspect details and original source.</span></div>
 <div className="graph-workspace">
 <div className="graph-header"><div><span className="eyebrow">VENTRIX / CAPITAL CONNECTIONS</span><h2>Funding Relationship Graph</h2><small>Drag nodes · zoom · pan · inspect connections</small></div><div className="graph-status"><span className="aum-dot"/> INTERACTIVE RESEARCH</div></div>
 <div className="graph-toolbar"><div className="aum-segments"><button className={mode==="rounds"?"on":""} onClick={()=>{setMode("rounds");setFund("All")}}>Official Funding Rounds</button><button className={mode==="portfolio"?"on":""} onClick={()=>{setMode("portfolio");setFund("All")}}>Portfolio Discovery</button></div><div className="graph-toolbarfilters"><select value={fund} onChange={e=>setFund(e.target.value)} aria-label="Fund filter"><option value="All">All investors</option>{funds.map(f=><option key={f.slug}>{f.name}</option>)}</select><select value={sector} onChange={e=>setSector(e.target.value)} aria-label="Sector filter">{sectors.map(v=><option key={v}>{v}</option>)}</select>{mode==="rounds"&&<select value={kind} onChange={e=>setKind(e.target.value)} aria-label="Funding type"><option value="All">Equity & tokens</option><option value="equity">Equity</option><option value="token-sale">Token sales</option></select>}<label className="graph-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find entity..." aria-label="Search network"/></label></div></div>
 <div className="graph-statrow"><span>{graph.nodes.filter(n=>n.data.kind==="fund").length} investors</span><span>{graph.nodes.filter(n=>n.data.kind==="round").length} source-backed rounds</span><span>{graph.nodes.filter(n=>n.data.kind==="project").length} projects</span><span>{graph.edges.length} relationships</span></div>
 <div className="graph-stage">
 {graph.nodes.length?<ReactFlow key={mode+":"+fund+":"+sector+":"+kind+":"+search} nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onNodeClick={(_e,node)=>setDetail(node.data)} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.22,maxZoom:1}} minZoom={.15} maxZoom={1.7} attributionPosition="bottom-right" proOptions={{hideAttribution:false}}><Background variant={BackgroundVariant.Dots} color="#31465b" gap={20} size={1}/><Controls showInteractive={false}/><MiniMap pannable zoomable nodeColor={node=>node.data.kind==="fund"?"#63e0b3":node.data.kind==="round"?"#e7bb79":"#85aff0"} style={{background:"#101d2d",border:"1px solid #365169"}}/></ReactFlow>:<div className="empty-state">No documented connections match the filters. Select “All investors”, or switch to Portfolio Discovery.</div>}
 {detail&&<aside className="graph-drawer"><button className="graph-close" aria-label="Close details" onClick={()=>setDetail(null)}>×</button><span className="eyebrow">{detail.kind.toUpperCase()} INTELLIGENCE</span><div className="graph-drawer-title">{detail.website&&<BrandLogo name={detail.label} website={detail.website} size={42}/>}<h3>{detail.label}</h3></div><p>{detail.sub}</p>{detail.amount&&<strong className="funding-money">{detail.amount}</strong>}{detailRound&&<><p><b>Investors:</b> {detailRound.investors.join(" · ")}</p><p><b>Lead:</b> {detailRound.leadInvestors.join(" · ")||"Not specified"}</p><p><b>Instrument:</b> {detailRound.instrument==="equity"?"Equity":"Token transaction"}</p></>}{detailRound?.sourceUrl&&<a href={detailRound.sourceUrl} target="_blank" rel="noopener noreferrer">Official funding announcement <ExternalLink size={13}/></a>}{detail.source&&!detailRound&&<a href={detail.source} target="_blank" rel="noopener noreferrer">Portfolio research reference <ExternalLink size={13}/></a>}{detail.fundSlug&&<Link href={"/funds/"+detail.fundSlug}>Open VC dossier <ArrowUpRight size={13}/></Link>}{detail.projectSlug&&<Link href={"/projects/"+detail.projectSlug}>Open project funding profile <ArrowUpRight size={13}/></Link>}{detail.kind==="project"&&affiliated.length>0&&<p className="graph-drawer-foot">{affiliated.length} historical portfolio references in VENTRIX.</p>}</aside>}
 </div>
 <div className="graph-footer"><span><i className="graph-key solid"/> Official round investor → funding round → project</span><span><i className="graph-key dotted"/> Portfolio research link (different evidence level)</span><span>Click a node to view details</span></div>
 </div>
 <p className="mutedtext" style={{fontSize:12,marginTop:16}}>When viewing all funds, Portfolio Discovery initially displays six sourced managers to keep the diagram readable. Choose a fund in the dropdown to view its full catalogue; official-round mode displays every indexed primary-source round.</p>
 </Shell>}
