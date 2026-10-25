import {createHmac,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {reserveDelivery,confirmDelivery,releaseDelivery,sendDiscord,type DiscordEmbed} from "@/lib/radar-delivery";
export const runtime="nodejs";
export const dynamic="force-dynamic";
type Input={title?:unknown;url?:unknown;description?:unknown;sector?:unknown;createdAt?:unknown;source?:unknown};
function verify(message:string,supplied:string|null,secret:string){
 if(!supplied||!/^sha256=[a-f0-9]{64}$/i.test(supplied))return false;
 const expected=createHmac("sha256",secret).update(message).digest();
 const got=Buffer.from(supplied.slice(7),"hex");
 return expected.length===got.length&&timingSafeEqual(expected,got);
}
function clean(s:unknown,max=160){return typeof s==="string"?s.replace(/@/g,"@\u200b").slice(0,max):""}
function link(s:unknown){if(typeof s!=="string")return undefined;try{const url=new URL(s);return ["http:","https:"].includes(url.protocol)?url.href:undefined}catch{return undefined}}
export async function POST(request:Request){
 const secret=process.env.RADAR_INGEST_SECRET;
 if(!secret||!process.env.DISCORD_WEBHOOK_URL||!process.env.UPSTASH_REDIS_REST_URL||!process.env.UPSTASH_REDIS_REST_TOKEN)return NextResponse.json({error:"Radar incoming webhook is not configured"},{status:503});
 const text=await request.text();
 if(text.length>16000)return NextResponse.json({error:"Payload too large"},{status:413});
 if(!verify(text,request.headers.get("x-ventrix-signature"),secret))return NextResponse.json({error:"Invalid HMAC signature"},{status:401});
 const delivery=request.headers.get("x-ventrix-delivery-id");
 if(!delivery||!/^[-_a-zA-Z0-9:.]{5,160}$/.test(delivery))return NextResponse.json({error:"Missing valid delivery identifier"},{status:400});
 let body:Input;try{body=JSON.parse(text) as Input;}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 const title=clean(body?.title,240),source=clean(body?.source,80)||"External webhook";
 if(!title||!link(body?.url))return NextResponse.json({error:"Valid title and URL required"},{status:400});
 const date=typeof body?.createdAt==="string"&&!Number.isNaN(Date.parse(body.createdAt))?body.createdAt:undefined;
 const embed:DiscordEmbed={title,url:link(body.url),description:clean(body.description,450)||"External startup discovery (not verified funding or VC investment)",color:0x6ce6c1,fields:[{name:"Sector",value:clean(body.sector,80)||"Unclassified",inline:true},{name:"Source",value:source,inline:true}],footer:{text:"External signed webhook · unverified lead · VENTRIX Radar"},...(date?{timestamp:date}:{})};
 let key:string|null=null;
 try{key=await reserveDelivery("incoming:"+delivery);if(!key)return NextResponse.json({ok:true,duplicate:true});
 await sendDiscord([embed],"VENTRIX · New externally sourced startup signal");await confirmDelivery(key);
 return NextResponse.json({ok:true,delivered:1});}
 catch(error){if(key)await releaseDelivery(key).catch(()=>undefined);console.error("Incoming radar webhook failed",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Delivery failed"},{status:502});}
}
