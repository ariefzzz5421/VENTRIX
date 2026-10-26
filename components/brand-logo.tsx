"use client";
import {useState} from "react";
import Link from "next/link";
import {projects} from "@/lib/data";
export function BrandLogo({name,website,size=36,color="#70ddbd"}:{name:string;website:string;size?:number;color?:string}) {
 const [failed,setFailed]=useState(false);
 let domain="";try{domain=new URL(website).hostname.replace(/^www\./,"")}catch{}
 const initials=name.replace(/[^a-zA-Z0-9 ]/g,"").split(/\s+/).map(x=>x[0]).join("").slice(0,3).toUpperCase();
 const iconAvailable=domain!=="polychain.capital";
 return <span className="brand-logo" title={name+" · official-site favicon"} style={{width:size,height:size,background:color+"17",borderColor:color+"35",color}}>{!failed&&domain&&iconAvailable?<img src={"https://www.google.com/s2/favicons?domain="+encodeURIComponent(domain)+"&sz=128"} alt={name+" brand icon"} width={Math.round(size*.78)} height={Math.round(size*.78)} loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>:<span style={{fontSize:size<30?9:Math.min(13,size*.34)}}>{initials}</span>}</span>
}
export function ProjectBadge({name,slug}:{name:string;slug?:string}){
 const p=projects.find(x=>x.name===name||x.slug===slug);
 const body=<span className="fundcell"><BrandLogo name={name} website={p?.website||""} size={35} color="#9ab8db"/><span><strong>{name}</strong>{p&&<small className="subline">{p.sector}</small>}</span></span>;
 return p?<Link href={"/projects/"+p.slug} className="logo-link">{body}</Link>:body;
}
