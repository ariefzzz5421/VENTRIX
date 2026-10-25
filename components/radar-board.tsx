"use client";
import { useMemo, useState } from "react";
import { ArrowUpRight, BellRing, CheckCircle2, CircleAlert, Clock3, ExternalLink, Filter, Radar, Search, ShieldCheck, Sparkles, TrendingUp, XCircle } from "lucide-react";
import type { RadarSector, RadarSignal, RadarSnapshot } from "@/lib/radar";

type SectorFilter = "All sectors" | RadarSector;
function stamp(value: string) {
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(value)) + " UTC";
}
export function RadarBoard({ snapshot, integrations }: {
  snapshot: RadarSnapshot;
  integrations: { frontrunWebhook: boolean; customWebhook: boolean; cron: boolean; discord: boolean; dedup: boolean };
}) {
  const [sector, setSector] = useState<SectorFilter>("All sectors");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"score" | "newest" | "oldest">("score");
  const [year,setYear]=useState("All years");
  const years=useMemo(()=>["All years",...new Set(snapshot.signals.map(s=>new Date(s.createdAt).getUTCFullYear().toString()))], [snapshot.signals]);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matches = snapshot.signals.filter(s => (sector === "All sectors" || s.sector === sector) && (year==="All years"||new Date(s.createdAt).getUTCFullYear().toString()===year) &&
      (!term || (s.title + " " + s.author + " " + s.sector).toLowerCase().includes(term)));
    return matches.sort((a, b) => sort === "newest" ? b.createdAt.localeCompare(a.createdAt) : sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) : b.score - a.score || b.createdAt.localeCompare(a.createdAt));
  }, [snapshot.signals, sector, query, year, sort]);
  const ready = integrations.discord && integrations.dedup && integrations.cron;
  return <div className="radar-root">
    <div className="radar-hero">
      <div className="radar-hero-copy"><div className="radar-kicker"><Radar size={14}/> DISCOVERY ENGINE / PUBLIC DATA</div>
        <h2>Find the signal.<br/><span>Verify the story.</span></h2>
        <p>Early visibility into new products is useful. It is not evidence of VC investment, funding, or future returns.</p>
        <div className="radar-chipline"><span>AI / ML</span><span>Crypto / Web3</span><span>7-day rolling window</span></div>
      </div>
      <div className="radar-orbit" aria-hidden="true"><div className="radar-ring r-one"/><div className="radar-ring r-two"/><div className="radar-ring r-three"/><div className="radar-axis"/><Radar size={45}/><span className="radar-pip one"/><span className="radar-pip two"/><span className="radar-pip three"/></div>
    </div>
    <div className="radar-metrics">
      <div><span>DISCOVERED POSTS</span><strong>{snapshot.signals.length}</strong><small>Distinct Show HN launches</small></div>
      <div><span>AI SIGNALS</span><strong>{snapshot.signals.filter(s => s.sector === "AI / ML").length}</strong><small>Keyword-matched</small></div>
      <div><span>CRYPTO SIGNALS</span><strong>{snapshot.signals.filter(s => s.sector === "Crypto / Web3").length}</strong><small>Keyword-matched</small></div>
      <div><span>SOURCE HEALTH</span><strong className={snapshot.sourceOk ? "radar-ok" : "radar-warn"}>{snapshot.sourceOk ? "ONLINE" : "OFFLINE"}</strong><small>{snapshot.fetchedQueries}/6 searches returned</small></div>
    </div>
    <div className="radar-two-col">
      <section className="radar-main-panel">
        <div className="radar-panel-title"><div><span className="radar-label">SIGNAL TERMINAL</span><h3>Latest discovery feed</h3></div><span className="radar-updated"><Clock3 size={13}/> {stamp(snapshot.asOf)}</span></div>
        <div className="radar-tools">
          <label className="radar-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search launch or founder username..." aria-label="Search radar signals"/></label>
          <label className="radar-select"><Filter size={14}/><select aria-label="Sector filter" value={sector} onChange={e => setSector(e.target.value as SectorFilter)}><option>All sectors</option><option>AI / ML</option><option>Crypto / Web3</option></select></label>
          <select className="radar-order" aria-label="Filter year" value={year} onChange={e=>setYear(e.target.value)}>{years.map(y=><option key={y}>{y}</option>)}</select><select className="radar-order" aria-label="Sort results" value={sort} onChange={e => setSort(e.target.value as "score" | "newest" | "oldest")}><option value="score">Top momentum</option><option value="newest">Latest</option><option value="oldest">Oldest</option></select>
        </div>
        {!snapshot.sourceOk && <div className="radar-banner error"><CircleAlert size={17}/> The public source is unavailable. No synthetic results are shown.</div>}
        {!filtered.length && <div className="radar-empty">No matching public launches in this view.</div>}
        <div className="radar-feed">{filtered.map((signal: RadarSignal) => <article className="radar-item" key={signal.id}>
          <div className="radar-item-top"><span className={signal.sector === "AI / ML" ? "radar-sector ai" : "radar-sector crypto"}>{signal.sector}</span><span className="radar-item-time">{stamp(signal.createdAt)} <b className="radar-year">{new Date(signal.createdAt).getUTCFullYear()}</b></span></div>
          <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer" className="radar-story">{signal.title}<ArrowUpRight size={15}/></a>
          <div className="radar-reason">Posted by {signal.author} · {signal.points} points · {signal.comments} comments</div>
          <div className="radar-item-bottom">
            <div className="radar-score"><TrendingUp size={14}/><span>Community momentum</span><div className="radar-track"><i style={{width: signal.score + "%"}}/></div><strong>{signal.score}/100</strong></div>
            {signal.websiteUrl ? <a target="_blank" rel="noopener noreferrer" href={signal.websiteUrl} className="radar-visit">Website <ExternalLink size={13}/></a> : <span className="radar-visit disabled">No website</span>}
          </div>
        </article>)}</div>
      </section>
      <aside className="radar-side">
        <section className="radar-sidepanel"><span className="radar-label">OPERATIONS</span><h3><BellRing size={17}/> Discord notifications</h3>
          <div className="radar-status"><span>Discord webhook secret</span>{integrations.discord ? <CheckCircle2 size={16} color="#6ce6c1"/> : <XCircle size={16}/>}</div>
          <div className="radar-status"><span>Persistent deduplication</span>{integrations.dedup ? <CheckCircle2 size={16} color="#6ce6c1"/> : <XCircle size={16}/>}</div>
          <div className="radar-status"><span>Vercel cron auth</span>{integrations.cron ? <CheckCircle2 size={16} color="#6ce6c1"/> : <XCircle size={16}/>}</div><div className="radar-status"><span>Custom signed webhook receiver</span>{integrations.customWebhook ? <CheckCircle2 size={16} color="#6ce6c1"/> : <XCircle size={16}/>}</div><div className="radar-status"><span>Frontrun receiver secret</span>{integrations.frontrunWebhook ? <CheckCircle2 size={16} color="#6ce6c1"/> : <XCircle size={16}/>}</div>
          <div className={"radar-banner " + (ready ? "success" : "")}>{ready ? "Scheduled HN → Discord delivery is configured. Incoming custom sources are configured independently." : "To activate scheduled alerts, configure Discord, Upstash, and CRON_SECRET in Vercel."}</div>
          <p>Scheduled scan: daily, 08:00 WIB. First run can include recent launches; subsequent runs deduplicate events. Status checks confirm configuration, not successful delivery.</p><div className="radar-webhook-doc"><strong>Incoming webhooks</strong><code>POST /api/hooks/radar</code><small>HMAC-SHA256 signed · X-Ventrix-Signature · X-Ventrix-Delivery-Id</small><a href="https://github.com/ariefzzz5421/VENTRIX/blob/main/docs/radar-webhooks.md" target="_blank" rel="noopener noreferrer">Setup guide ↗</a></div>
        </section>
        <section className="radar-sidepanel"><span className="radar-label">INTELLIGENCE LAYERS</span><h3><Sparkles size={17}/> Signal provenance</h3>
          <div className="radar-layer"><span className="radar-layer-dot active"/><div><strong>Public launch discovery</strong><small>Show HN via Algolia · 15-minute cached fetch</small></div></div>
          <div className="radar-layer"><span className={"radar-layer-dot " + (integrations.frontrunWebhook ? "active" : "")}/><div><strong>VC follow convergence</strong><small>{integrations.frontrunWebhook ? "Receiver prepared; paid source setup still required" : "Requires Frontrun Pro and signing secret"}</small></div></div>
          <div className="radar-layer"><span className="radar-layer-dot"/><div><strong>Verified financing</strong><small>Not inferred from activity; use primary announcements in Funding Rounds</small></div></div>
        </section>
        <section className="radar-sidepanel"><h3><ShieldCheck size={17}/> Interpretation policy</h3><p><strong>Community momentum ≠ investment confidence.</strong> Scores derive only from recency, points, and comments. They are screening heuristics, not predictive probabilities.</p>
          <p>Original posts may be user-generated and inaccurate. Verify official product sites and funding claims independently.</p>
          <a className="radar-doc-link" href="https://hn.algolia.com/api" target="_blank" rel="noopener noreferrer">Inspect the public source <ArrowUpRight size={14}/></a>
        </section>
      </aside>
    </div>
  </div>;
}
