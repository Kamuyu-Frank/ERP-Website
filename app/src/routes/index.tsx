import { SiteHeader, SiteFooter } from '@/components/snaperp/site-chrome';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { journeySteps } from '@/components/snaperp/business-world';
import { requestDemo } from '@/lib/api/demo.functions';
const STAGE_COUNT=journeySteps.length;
export const Route = createFileRoute('/')({ component: Home });
function Home(){
 const [stage,setStage]=useState(0),[privacy,setPrivacy]=useState(false);
 const sectionRef=useRef<HTMLElement>(null);
 const journeyFrame=useRef<HTMLIFrameElement>(null);
 const journeyTime=useRef(0);
 const syncJourney=()=>journeyFrame.current?.contentWindow?.postMessage({type:'snaperp-journey',progress:journeyTime.current},window.location.origin);
 useEffect(()=>{
  let frame=0;
  const sync=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const section=sectionRef.current;if(!section)return;
   const sticky=section.querySelector<HTMLElement>('.journey-sticky');if(!sticky)return;
   const header=window.innerWidth<=800?70:78;
   const travel=section.offsetHeight-sticky.offsetHeight;
   const progress=Math.max(0,Math.min(STAGE_COUNT,(header-section.getBoundingClientRect().top)/Math.max(1,travel)*STAGE_COUNT));
   journeyTime.current=progress;
   setStage(Math.min(STAGE_COUNT-1,Math.floor(progress)));syncJourney();
  });};
  window.addEventListener('scroll',sync,{passive:true});window.addEventListener('resize',sync);sync();
  return()=>{window.removeEventListener('scroll',sync);window.removeEventListener('resize',sync);cancelAnimationFrame(frame);};
 },[]);
 useEffect(()=>{if(privacy)document.getElementById('privacy-close')?.focus();},[privacy]);
 const closePrivacy=()=>{setPrivacy(false);document.querySelector<HTMLButtonElement>('.privacy-link')?.focus();};
 const selected=journeySteps[stage];
 return <><SiteHeader/>
 <main id="main"><h1 className="journey-page-title">SnapERP. Your business, in sync.</h1>
 <section id="workflow" className="journey journey-immersive" ref={sectionRef} aria-label="One continuous journey from the supplier to the final receipt">
  {journeySteps.map((s,i)=><span key={s.name} id={`step-${i}`} className="journey-anchor" style={{'--step':i} as CSSProperties} aria-hidden="true"/>)}
  <div className={stage===0?"journey-sticky journey-first-screen":"journey-sticky"}>
   <iframe ref={journeyFrame} onLoad={syncJourney} src="/journey.html?continuous=1" title="Winding road from the supplier to the final receipt" className="journey-animation-frame" tabIndex={-1}/>
   <div className={stage===0?"journey-copy journey-opening-copy":"journey-copy"} aria-live="polite" aria-atomic="true">
    <p className="journey-eyebrow">{stage===0?<> <span className="opening-status-dot" aria-hidden="true"/> ONE CONNECTED WORKSPACE</>:selected.name}</p>
    <h2 key={selected.name}>{stage===0?<>Your business.<br/><span className="opening-headline-accent">In sync.</span></>:selected.title}</h2>
    <p className="journey-description">{stage===0?"Bring purchases, stock, sales and accounts together. Follow every handover, from the first order to the final receipt.":selected.body}</p>
    {stage===0?<><div className="journey-opening-actions"><a className="opening-primary" href="#demo">See SnapERP in action ↗</a><a className="opening-secondary" href="/features">Explore features</a></div><p className="opening-assurance">Built around your workflows. Start with a demo.</p><div className="opening-benefits"><span>Follow your stock</span><span>Connect your records</span><span>Understand your business</span></div></>:<div className="journey-receipt"><span>{selected.record}</span><strong>{selected.ref}</strong><small>{selected.detail}</small></div>}
   </div>
   {stage===0&&<a className="opening-scroll-cue" href="#step-1"><span className="opening-scroll-track" aria-hidden="true"><span/></span><span>Follow the goods<strong>Scroll to move the truck ↓</strong></span></a>}
  </div>
 </section>



 <section className="demo section-wrap" id="demo"><div className="demo-lead"><h2>See your workflow<br/>in action.</h2><p>Tell us what you manage and what you want to connect. Start with a focused product demonstration.</p><div className="demo-summary"><span>A useful demo starts with your business.</span><ul><li>Your purchasing and stock flow</li><li>Your invoicing and payment needs</li><li>Your team, reports and optional modules</li></ul></div><a className="existing-link" href="https://erp.werevu.co.ke/">Already using SnapERP? Sign in ↗</a></div><DemoForm onPrivacy={()=>setPrivacy(true)}/></section>
 <section className="security section-wrap" id="security"><h2>A workspace for your team.</h2><div><p>Explore permissions, personal profiles, two-step sign-in and active-session management. Confirm the protections and configuration available for your company.</p><p>Use demonstration data to explore the workflow. No real payments or tax submissions are made by this marketing site.</p></div></section></main>
 <SiteFooter onPrivacy={()=>setPrivacy(true)}/>
 {privacy&&<div className="privacy-backdrop" onClick={closePrivacy}><section className="privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-title" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')closePrivacy();if(e.key==='Tab'){const nodes=e.currentTarget.querySelectorAll<HTMLElement>('button');const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}><button id="privacy-close" className="privacy-close" onClick={closePrivacy} aria-label="Close privacy notice">×</button><h2 id="privacy-title">About your demo request</h2><p>Your name, business, contact details and workflow are recorded to understand your needs and contact you about your demo request.</p><p>The form stores your submission in the website's private database. A hashed network identifier limits automated abuse. Your contact details are not published on this site.</p><p>Do not include passwords, credentials or sensitive financial information. Workflow examples use illustrative records.</p><button className="privacy-done" onClick={closePrivacy}>Close notice</button></section></div>}
 </>;
}
function DemoForm({onPrivacy}:{onPrivacy:()=>void}){
 const [pending,setPending]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState('');const requestId=useRef('');
 const [workflow,setWorkflow]=useState('');
 useEffect(()=>{const brief=new URLSearchParams(window.location.search).get('workflow');if(brief)setWorkflow(brief.slice(0,2000));},[]);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(pending)return;setError('');setPending(true);const form=new FormData(e.currentTarget);if(!requestId.current)requestId.current=crypto.randomUUID();try{const result=await requestDemo({data:{requestId:requestId.current,name:String(form.get('name')||''),business:String(form.get('business')||''),email:String(form.get('email')||''),phone:String(form.get('phone')||''),workflow:String(form.get('workflow')||''),website:String(form.get('website')||''),consent:form.get('consent')==='on'}});if(result.ok)setReceipt(result.reference);else setError(result.message);}catch{setError('We could not record your request. Please try again.');}finally{setPending(false);}}
 if(receipt)return <div className="demo-success" role="status"><span className="success-check" aria-hidden="true">✓</span><h3>Your request is recorded.</h3><p>Your demo details have been saved for review. Keep this reference for your request.</p><strong>{receipt}</strong><button onClick={()=>{setReceipt('');requestId.current='';}}>Make another request</button></div>;
 return <form className="demo-form" onSubmit={submit}><div className="form-pair"><div><label htmlFor="demo-name">Your name</label><input id="demo-name" name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Full name"/></div><div><label htmlFor="demo-business">Business name</label><input id="demo-business" name="business" autoComplete="organization" required minLength={2} maxLength={150} placeholder="Your business"/></div></div><div className="form-pair"><div><label htmlFor="demo-email">Email address</label><input id="demo-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@business.co.ke"/></div><div><label htmlFor="demo-phone">Phone <span>(optional)</span></label><input id="demo-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="Preferred contact number"/></div></div><div><label htmlFor="demo-workflow">What would you like to connect?</label><textarea id="demo-workflow" name="workflow" value={workflow} onChange={event=>setWorkflow(event.target.value)} required minLength={10} maxLength={2000} rows={4} placeholder="For example: purchasing, processing, stock, M-Pesa and invoicing."/></div><div className="form-honey" aria-hidden="true"><label htmlFor="demo-website">Website</label><input id="demo-website" name="website" tabIndex={-1} autoComplete="off"/></div><label className="consent-label"><input type="checkbox" name="consent" required/><span>I agree to use of my details to review and contact me about this demo request.</span></label><button className="privacy-link" type="button" onClick={onPrivacy}>How your demo details are used ↗</button>{error&&<p className="form-error" id="demo-error" role="alert">{error}</p>}<button className="demo-submit" type="submit" disabled={pending} aria-describedby={error?'demo-error':undefined}>{pending?'Recording request…':'Request demo'}<span aria-hidden="true">↗</span></button><p className="form-footnote">No payment details needed. Share your workflow, not sensitive business records.</p></form>;
}
