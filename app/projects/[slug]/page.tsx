import {notFound} from "next/navigation";
import Link from "next/link";
import {funds,projects,getProject} from "@/lib/data";
import {BrandLogo} from "@/components/brand-logo";
import {Shell,Panel,SourceNote,FundBadge,External} from "@/components/terminal";
export function generateStaticParams(){return projects.map(p=>({slug:p.slug}))}
export default async function ProjectPage({params}:{params:Promise<{slug:string}>}){
const p=getProject((await params).slug);if(!p)notFound();const backers=funds.filter(f=>f.investments.includes(p.name));
return <Shell title={p.name} subtitle={p.sector+" · Project intelligence"}>
<div className="panel"><div className="fundhero"><BrandLogo name={p.name} website={p.website} size={64}/><div><h2>{p.name}</h2><p className="mutedtext">{p.sector}</p></div></div><External href={p.website}>Official project website</External></div>
<div className="stats"><div className="metric"><span>SECTOR</span><strong style={{fontSize:22}}>{p.sector}</strong></div><div className="metric"><span>SOURCED VC ASSOCIATIONS</span><strong>{backers.length}</strong></div><div className="metric"><span>FUNDING AMOUNT</span><strong className="unavailable">N/D</strong><small>Not independently established</small></div><div className="metric"><span>ENTRY VALUATION</span><strong className="unavailable">N/D</strong><small>No verified private price</small></div></div>
<SourceNote/>
<Panel title={"Associated venture investors · "+backers.length}><div className="linked-funds">{backers.map(f=><Link className="linked-fund" href={"/funds/"+f.slug} key={f.slug}><FundBadge name={f.name} initials={f.initials} color={f.color}/><span className="pill">{f.portfolioEvidence}</span></Link>)}</div>{!backers.length&&<p className="mutedtext">Investor associations are pending source verification; we don't infer backers.</p>}</Panel>
<Panel title="Evidence & sources">{backers.map(f=><div className="listline" key={f.slug}><strong>{f.name}</strong>{f.portfolioSource?<External href={f.portfolioSource}>View evidence</External>:<span>Pending</span>}</div>)}<p className="mutedtext">Portfolio references are not proof of ongoing ownership, entry price, individual rounds, or realized investment performance.</p></Panel>
</Shell>}