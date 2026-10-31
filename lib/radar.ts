/** Public launch discovery, not VC follow-graph or evidence of a funding round. */
export type RadarSector = "AI / ML" | "Crypto / Web3";
export type RadarSignal = {
  id: string;
  title: string;
  sector: RadarSector;
  source: "Hacker News · Show HN";
  sourceUrl: string;
  websiteUrl: string | null;
  author: string;
  builder: string | null;
  summary: string | null;
  projectType: string;
  socialLinks: { label: "GitHub" | "X" | "LinkedIn" | "YouTube"; url: string }[];
  createdAt: string;
  points: number;
  comments: number;
  score: number;
  reasons: string[];
};
export type RadarSnapshot = {
  asOf: string;
  coverage: "Public Show HN launches (not VC follows)";
  sourceUrl: string;
  sourceOk: boolean;
  fetchedQueries: number;
  signals: RadarSignal[];
};

type HnHit = {
  objectID?: string;
  title?: string | null;
  story_text?: string | null;
  url?: string | null;
  author?: string | null;
  created_at?: string;
  created_at_i?: number;
  points?: number | null;
  num_comments?: number | null;
};
type HnResponse = { hits?: HnHit[] };
const SEARCH_TERMS = ["AI", "LLM", "agent", "crypto", "blockchain", "Solana"];
const AI = /\b(ai|llm|llms|agents?|agentic|inference|machine learning|neural|transformer|foundation model|computer vision|generative|rag|embedding|voice ai)\b/i;
const CRYPTO = /\b(crypto|blockchain|ethereum|bitcoin|btc|solana|defi|web3|onchain|on-chain|wallet|zk|zero knowledge|smart contracts?|stablecoin|dapp|evm|rollup|dex|tokenization)\b/i;

function externalUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch { return null; }
}
function plainText(value: string): string {
  return value.replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|quot|apos|lt|gt|nbsp|#39);/gi, entity => ({
      "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&#39;": "'"
    })[entity.toLowerCase() as "&amp;"] || " ")
    .replace(/\s+/g, " ").trim();
}
function summaryFrom(hit: HnHit): string | null {
  const body = plainText(hit.story_text || "").replace(/https?:\/\/\S+/g, "").trim();
  const tagline = (hit.title || "").replace(/^Show HN:\s*/i, "").split(/\s+[—–-]\s+/).slice(1).join(" — ");
  const firstSentence = body.match(/^.{30,240}?[.!?](?:\s|$)/)?.[0]?.trim() || body;
  const descriptive = /\b(?:builds?|helps?|lets?|enables?|edits?|generates?|tracks?|analyzes?|tool|app|platform|editor|workflow|website|webapp|api|video|wallet)\b/i.test(firstSentence);
  const candidate = descriptive && firstSentence.length >= 30 ? firstSentence : tagline || firstSentence;
  if (!candidate) return null;
  return candidate.length > 220 ? candidate.slice(0, 217).replace(/\s+\S*$/, "") + "…" : candidate;
}
function projectType(text: string, sector: RadarSector): string {
  if (/\b(pictionary|game|gaming|puzzle)\b/i.test(text)) return "Game";
  if (/\b(video edit|video editor|video editing)\b/i.test(text)) return "Video editor";
  if (/\b(wallet|payments?)\b/i.test(text)) return "Wallet / payments";
  if (/\b(defi|dex|lending|yield)\b/i.test(text)) return "DeFi";
  if (/\b(agent|agents|agentic)\b/i.test(text)) return "AI agent";
  if (/\b(code|coding|developer|webapp|serverless|api|cli)\b/i.test(text)) return "Developer tool";
  return sector;
}
function socialLinks(value: string, websiteUrl: string | null): RadarSignal["socialLinks"] {
  const urls = [...value.matchAll(/https?:\/\/[^\s<>"']+/gi)]
    .filter(match => /\b(?:github|repo|source|code|demo|updates|follow|social|twitter|linkedin|youtube)\b/i.test(value.slice(Math.max(0, (match.index || 0) - 80), match.index)))
    .map(match => externalUrl(match[0].replace(/[),.;]+$/, ""))).filter((url): url is string => !!url);
  if (websiteUrl) urls.unshift(websiteUrl);
  const links: RadarSignal["socialLinks"] = [];
  for (const url of urls) {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const label = host === "github.com" ? "GitHub" : host === "x.com" || host === "twitter.com" ? "X" : host === "linkedin.com" ? "LinkedIn" : host === "youtube.com" || host === "youtu.be" ? "YouTube" : null;
    if (label && !links.some(link => link.label === label)) links.push({ label, url });
  }
  return links.slice(0, 4);
}
export function toSignal(hit: HnHit, now: number): RadarSignal | null {
  if (!hit.objectID || !hit.title || !hit.created_at) return null;
  const body = plainText(hit.story_text || "");
  const text = (hit.title + " " + body).slice(0, 3000);
  const isCrypto = CRYPTO.test(text);
  const isAI = AI.test(text);
  if (!isCrypto && !isAI) return null;
  const sector: RadarSector = isCrypto ? "Crypto / Web3" : "AI / ML";
  const points = Math.max(0, Math.floor(hit.points || 0));
  const comments = Math.max(0, Math.floor(hit.num_comments || 0));
  const ageHours = Math.max(0, (now - new Date(hit.created_at).getTime()) / 3_600_000);
  // Community activity + recency only; this is not an investment probability or VC signal.
  const score = Math.min(100, Math.round(20 + Math.min(points, 120) * 0.38 + Math.min(comments, 65) * 0.3 + Math.max(0, 20 - ageHours / 12)));
  const reasons = [
    "Public Show HN submission",
    points + " community points · " + comments + " comments",
    ageHours < 48 ? "Posted in the last 48 hours" : "Posted within the observation window"
  ];
  const websiteUrl = externalUrl(hit.url);
  return {
    id: hit.objectID,
    title: hit.title.replace(/^Show HN:\s*/i, "").slice(0, 220),
    sector,
    source: "Hacker News · Show HN",
    sourceUrl: "https://news.ycombinator.com/item?id=" + encodeURIComponent(hit.objectID),
    websiteUrl,
    author: (hit.author || "unknown").slice(0, 80),
    // The HN author is a builder only when the post explicitly says they built or launched it.
    builder: /\b(?:I|we)\s+(?:built|made|created|launched|developed)\b|\b(?:I'm|I am)\s+(?:the\s+)?(?:founder|co-founder|creator)\b/i.test(body) && hit.author ? hit.author.slice(0, 80) : null,
    summary: summaryFrom(hit),
    projectType: projectType(hit.title, sector),
    socialLinks: socialLinks(hit.story_text || "", websiteUrl),
    createdAt: hit.created_at,
    points, comments, score, reasons
  };
}

async function searchShowHN(term: string, sinceUnix: number): Promise<HnHit[]> {
  const url = new URL("https://hn.algolia.com/api/v1/search_by_date");
  url.searchParams.set("query", term);
  url.searchParams.set("tags", "show_hn");
  url.searchParams.set("numericFilters", "created_at_i>" + sinceUnix);
  url.searchParams.set("hitsPerPage", "50");
  const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(6500) });
  if (!response.ok) throw new Error("HN search returned HTTP " + response.status);
  const data = (await response.json()) as HnResponse;
  if (!Array.isArray(data.hits)) throw new Error("Unexpected HN response");
  return data.hits;
}

/** Returns source health explicitly; never substitutes made-up launch records. */
export async function getRadarSnapshot(): Promise<RadarSnapshot> {
  const now = Date.now();
  // Bucket the query window so the URL stays stable and Next.js can reuse its 15-minute fetch cache.
  const sinceUnix = Math.floor(now / 900_000) * 900 - 7 * 86_400;
  const results = await Promise.allSettled(SEARCH_TERMS.map(term => searchShowHN(term, sinceUnix)));
  const hits = new Map<string, HnHit>();
  let fetchedQueries = 0;
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    fetchedQueries++;
    for (const hit of result.value) if (hit.objectID) hits.set(hit.objectID, hit);
  }
  const signals = Array.from(hits.values())
    .map(hit => toSignal(hit, now))
    .filter((signal): signal is RadarSignal => signal !== null)
    .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 80);
  return {
    asOf: new Date(now).toISOString(),
    coverage: "Public Show HN launches (not VC follows)",
    sourceUrl: "https://hn.algolia.com/api",
    sourceOk: fetchedQueries > 0,
    fetchedQueries,
    signals
  };
}
