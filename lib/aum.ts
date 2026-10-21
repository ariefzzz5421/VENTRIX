/** Point-in-time crypto fund manager AUM disclosure registry.
 * USD billions. Regulatory AUM is adviser-level (not necessarily crypto venture-only).
 * Data provenance is individually documented; undisclosed is null, NEVER zero.
 */
export type AumDisclosure = {
  amount:number; asOf:string; source:string; origin:"Manager website"|"SEC Form ADV";
  scope:string; legalEntity:string; precision:"exact"|"rounded"; note?:string;
};
export const disclosures:Record<string,AumDisclosure>={
"paradigm":{amount:11.9,asOf:"2026-06-05",source:"https://www.formds.com/investment-advisers/paradigm-operations-lp",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Paradigm Operations LP",precision:"rounded"},
"pantera-capital":{amount:3.5,asOf:"2026-03-31",source:"https://panteracapital.com/",origin:"Manager website",scope:"Firm-wide AUM",legalEntity:"Pantera Capital",precision:"rounded",note:"Manager describes figures as estimated and unaudited."},
"dragonfly":{amount:3.437541969,asOf:"2026-03-31",source:"https://www.formds.com/investment-advisers/dragonfly-digital-management-llc",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Dragonfly Digital Management LLC",precision:"exact"},
"polychain-capital":{amount:2.901320856,asOf:"2026-03-28",source:"https://www.formds.com/investment-advisers/polychain-capital-lp?filing=2083814",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Polychain Capital LP",precision:"exact"},
"electric-capital":{amount:2.877301822,asOf:"2026-03-31",source:"https://formds.com/investment-advisers/electric-capital-partners-llc?filing=2080192",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Electric Capital Partners LLC",precision:"exact"},
"blockchain-capital":{amount:2.857244723,asOf:"2026-06-18",source:"https://www.formds.com/investment-advisers/blockchain-capital-llc?filing=2114344",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Blockchain Capital LLC",precision:"exact",note:"Figure corresponds to regulatory AUM previously reported at March 2026 annual filing."},
"multicoin-capital":{amount:2.69,asOf:"2026-03-07",source:"https://www.formds.com/investment-advisers/multicoin-capital-management-llc",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Multicoin Capital Management LLC",precision:"rounded"},
"haun-ventures":{amount:2.49,asOf:"2026-03-31",source:"https://www.formds.com/investment-advisers/haun-ventures-management-lp",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Haun Ventures Management LP",precision:"rounded"},
"galaxy-ventures":{amount:1.722962538,asOf:"2026-07-01",source:"https://www.formds.com/investment-advisers/galaxy-digital-capital-management-lp?filing=2117210",origin:"SEC Form ADV",scope:"BROADER MANAGER AUM — not Galaxy Ventures standalone",legalEntity:"Galaxy Digital Capital Management LP",precision:"exact",note:"AUM encompasses strategies beyond the Galaxy Ventures portfolio. NOT venture-only AUM."},
"parafi-capital":{amount:1.6,asOf:"2026-06-30",source:"https://parafi.com/",origin:"Manager website",scope:"Firm-wide AUM",legalEntity:"ParaFi Capital",precision:"rounded",note:"SEC reported a different regulatory AUM figure of $1.8178B in its March 2026 filing. Different scopes and dates."},
"arrington-capital":{amount:1.41,asOf:"2026-03-31",source:"https://formds.com/investment-advisers/arrington-capital-investment-management-llc",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Arrington Capital Investment Management LLC",precision:"rounded"},
"hack-vc":{amount:.823,asOf:"2026-07-30",source:"https://www.formds.com/investment-advisers/hack-vc-management-llc",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Hack VC Management LLC",precision:"rounded"},
"variant":{amount:.729,asOf:"2026-05-06",source:"https://formds.com/investment-advisers/variant",origin:"SEC Form ADV",scope:"Adviser-level regulatory AUM",legalEntity:"Unofficial Management Inc. (Variant)",precision:"rounded"}
};
export type HistoricAum={year:number;amount:number};
export const aumHistory:Record<string,HistoricAum[]>={
"polychain-capital":[[2021,6.627305743],[2022,2.610949877],[2023,5.03970385],[2024,5.598543862],[2025,2.901320856]].map(([year,amount])=>({year,amount})),
"blockchain-capital":[[2021,1.943267696],[2022,1.736164957],[2023,2.35582212],[2024,2.758166857],[2025,2.857244723]].map(([year,amount])=>({year,amount})),
"electric-capital":[[2021,1.72688588],[2022,1.137704565],[2023,1.831050949],[2024,3.135607397],[2025,2.877301822]].map(([year,amount])=>({year,amount})),
"dragonfly":[[2022,1.934858193],[2023,2.466635502],[2024,4.140480327],[2025,3.437541969]].map(([year,amount])=>({year,amount})),
"parafi-capital":[[2021,1.198148965],[2022,.632168671],[2023,.944974583],[2024,1.399287817],[2025,1.81781471]].map(([year,amount])=>({year,amount})),
"galaxy-ventures":[[2021,1.280070691],[2022,1.24561132],[2023,3.649532477],[2024,2.452058739],[2025,1.722962538]].map(([year,amount])=>({year,amount}))
};
export const aumAmount=(slug:string)=>disclosures[slug]?.amount??null;
export const formatAum=(billions:number|null,digits=2)=>billions===null?"Undisclosed":billions>=1?"$"+billions.toFixed(digits)+"B":"$"+Math.round(billions*1000)+"M";
