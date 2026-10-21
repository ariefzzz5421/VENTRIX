import {funds} from "@/lib/data";
import {disclosures} from "@/lib/aum";
import {fundRoundParticipation,fundingRounds} from "@/lib/funding";
export type EvidenceScore={slug:string;name:string;portrait:string;publicPortfolioLinks:number;documentedRoundParticipation:number;documentedLeadRounds:number;associatedRoundCapitalUsd:number;aumBillion:number|null};
export const researchScores:EvidenceScore[]=funds.map(f=>{const rows=fundRoundParticipation(f.name);return {slug:f.slug,name:f.name,portrait:f.website,publicPortfolioLinks:f.investments.length,documentedRoundParticipation:rows.length,documentedLeadRounds:rows.filter(r=>r.leadInvestors.includes(f.name)).length,associatedRoundCapitalUsd:rows.reduce((sum,r)=>sum+r.amountUsd,0),aumBillion:disclosures[f.slug]?.amount??null}});
export const scoreMeaning="Research visibility and disclosed financing exposure are NOT investment returns, fund performance or capital deployed by the VC. A round is counted once per project financing, NOT per investor check.";
export const documentedRoundsCount=fundingRounds.length;
