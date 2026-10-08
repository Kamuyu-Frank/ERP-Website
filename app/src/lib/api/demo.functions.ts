import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { z } from 'zod';
import { bindings } from '../bindings.server';
const input=z.object({requestId:z.string().uuid(),name:z.string().trim().min(2).max(100),business:z.string().trim().min(2).max(150),email:z.string().trim().email().max(254),phone:z.string().trim().max(30),workflow:z.string().trim().min(10).max(2000),website:z.string().max(200),consent:z.boolean().refine(v=>v,'Consent is required')});
export const requestDemo=createServerFn({method:'POST'}).validator(input).handler(async({data})=>{
 const request=getRequest();const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return {ok:false as const,message:'Please submit your request from this website.'};
 if(data.website)return {ok:false as const,message:'We could not accept this request.'};
 const {DB}=bindings();if(!DB)return {ok:false as const,message:'Demo booking is temporarily unavailable. Please try again later.'};
 const reference='DEMO-'+data.requestId.slice(0,8).toUpperCase();
 const prior=await DB.prepare('SELECT id FROM demo_requests WHERE id=?').bind(data.requestId).first();
 if(prior)return {ok:true as const,reference};
 const source=request.headers.get('cf-connecting-ip')||'unknown';
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('snaperp-demo:'+source));
 const fingerprint=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
 const bucket=fingerprint+':'+Math.floor(Date.now()/3600000);
 const limit=await DB.prepare('INSERT INTO demo_rate_limits (bucket,hits,created_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 WHERE hits<5 RETURNING hits').bind(bucket,new Date().toISOString()).first();
 if(!limit)return {ok:false as const,message:'Too many requests. Please try again later.'};
 try{await DB.prepare('INSERT INTO demo_requests (id,reference,name,business,email,phone,workflow,consented_at,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(data.requestId,reference,data.name,data.business,data.email.toLowerCase(),data.phone,data.workflow,new Date().toISOString(),new Date().toISOString()).run();return {ok:true as const,reference};}catch{return {ok:false as const,message:'Your request could not be saved. Please try again.'};}
});
