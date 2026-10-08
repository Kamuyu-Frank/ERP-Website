import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { journeySteps } from '@/components/snaperp/business-world';
import { requestDemo } from '@/lib/api/demo.functions';
const STAGE_COUNT=journeySteps.length;
const TOUR_SECONDS=STAGE_COUNT*5;
export const Route = createFileRoute('/')({ component: Home });
function Brand(){return <a className="brand" href="/" aria-label="SnapERP home"><picture><source media="(prefers-reduced-motion: reduce)" srcSet="/assets/brand/logo-static.png"/><img src="/assets/brand/logo.gif" alt="SnapERP arithmetic tiles" width="48" height="48"/></picture><span>Snap<span className="brand-erp">ERP</span></span></a>}
function Home(){
 const [menu,setMenu]=useState(false),[stage,setStage]=useState(0),[tour,setTour]=useState(false),[privacy,setPrivacy]=useState(false);
 const sectionRef=useRef<HTMLElement>(null);
 const journeyFrame=useRef<HTMLIFrameElement>(null);
 const journeyTime=useRef(0);
 const syncJourney=()=>journeyFrame.current?.contentWindow?.postMessage({type:'snaperp-journey',progress:journeyTime.current},window.location.origin);
 useEffect(()=>{
  if(tour)return;
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
 },[tour]);
 useEffect(()=>{
  if(!tour)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let frame=0;let start:number|null=null;
  const initial=journeyTime.current>=STAGE_COUNT-.01?0:journeyTime.current*5;
  const stop=()=>setTour(false);
  window.addEventListener('wheel',stop,{passive:true});window.addEventListener('touchstart',stop,{passive:true});
  const play=(now:number)=>{
   if(start===null)start=now;
   const elapsed=Math.min(TOUR_SECONDS,initial+(now-start)/1000);
   const chapter=Math.min(STAGE_COUNT-1,Math.floor(elapsed/5));
   setStage(chapter);
   journeyTime.current=reduced?Math.min(STAGE_COUNT,chapter+1-.01):elapsed/5;
   syncJourney();
   const section=sectionRef.current;const sticky=section?.querySelector<HTMLElement>('.journey-sticky');
   if(section&&sticky){const header=window.innerWidth<=800?70:78;window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top-header+(section.offsetHeight-sticky.offsetHeight)*elapsed/TOUR_SECONDS,behavior:'instant'});}
   if(elapsed<TOUR_SECONDS)frame=requestAnimationFrame(play);else setTour(false);
  };
  frame=requestAnimationFrame(play);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('wheel',stop);window.removeEventListener('touchstart',stop);};
 },[tour]);
 useEffect(()=>{if(privacy)document.getElementById('privacy-close')?.focus();},[privacy]);
 const closePrivacy=()=>{setPrivacy(false);document.querySelector<HTMLButtonElement>('.privacy-link')?.focus();};
 const jump=(i:number)=>{
  setTour(false);const section=sectionRef.current;const sticky=section?.querySelector<HTMLElement>('.journey-sticky');if(!section||!sticky)return;
  const header=window.innerWidth<=800?70:78;
  window.scrollTo({top:window.scrollY+section.getBoundingClientRect().top-header+(section.offsetHeight-sticky.offsetHeight)*(i+.04)/STAGE_COUNT,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
 };
 const selected=journeySteps[stage];
 return <><a className="skip-link" href="#main">Skip to content</a>
 <header className="site-header"><div className="header-inner"><Brand/><button className="menu-toggle" aria-expanded={menu} aria-controls="site-nav" onClick={()=>setMenu(!menu)}>{menu?'Close':'Menu'}</button><nav id="site-nav" className={menu?'site-nav nav-open':'site-nav'} aria-label="Main navigation">{[['Workflow','#workflow'],['Features','#features'],['Integrations','#integrations'],['Pricing','#pricing']].map(([label,link])=><a key={label} href={link} onClick={()=>setMenu(false)}>{label}</a>)}<a className="sign-in" href="https://erp.werevu.co.ke/">Sign in ↗</a><a className="nav-demo" href="#demo" onClick={()=>setMenu(false)}>Book a demo ↗</a></nav></div></header>
 <main id="main"><h1 className="journey-page-title">SnapERP. Business in motion.</h1>
 <section id="workflow" className="journey journey-immersive" ref={sectionRef} aria-label="One continuous journey from the farm to the final receipt">
  {journeySteps.map((s,i)=><span key={s.name} id={`step-${i}`} className="journey-anchor" style={{'--step':i} as CSSProperties} aria-hidden="true"/>)}
  <div className="journey-sticky">
   <iframe ref={journeyFrame} onLoad={syncJourney} src="/journey.html?continuous=1" title="Winding road from the farm to the final receipt" className="journey-animation-frame" tabIndex={-1}/>
   <div className="journey-copy" aria-live="polite" aria-atomic="true">
    <p className="journey-eyebrow"><span>{String(stage+1).padStart(2,'0')} / {STAGE_COUNT}</span> {selected.name}</p>
    <h2 key={selected.name}>{stage===0?<>SnapERP.<br/>Business in motion.</>:selected.title}</h2>
    <p className="journey-description">{stage===0?"From the first maize sack to the final receipt. Scroll to drive the truck through a connected business.":selected.body}</p>
    {stage===0?<div className="journey-opening-actions"><a href="#demo">Book a demo ↗</a><span>Scroll to begin ↓</span></div>:<div className="journey-receipt"><span>{selected.record}</span><strong>{selected.ref}</strong><small>{selected.detail}</small></div>}
   </div>
   <div className="journey-bottom">
    <div className="journey-playback"><span>Scroll to follow the journey ↓</span><button className="tour-toggle" onClick={()=>setTour(!tour)} aria-pressed={tour}>{tour?'Pause tour Ⅱ':'Play tour ▷'}</button></div>
    <nav className="stage-controls" aria-label="Choose a workflow stage">{journeySteps.map((s,i)=><button key={s.name} aria-pressed={stage===i} onClick={()=>jump(i)} title={s.name}><span>{String(i+1).padStart(2,'0')}</span><strong>{s.name}</strong></button>)}</nav>
    <p className="illustration-note">Illustrative workflow · Integration setup and module availability confirmed during your demo.</p>
   </div>
  </div>
 </section>
 <section className="integrations section-wrap" id="integrations"><div className="section-heading"><h2>Local connections.<br/>Clearer business records.</h2><p>Discuss the payment and tax-invoice setup your business needs.</p></div><div className="integration-layout"><div className="integration-rows"><article><div className="integration-name">M-Pesa<span>COLLECTIONS</span></div><h3>Connect payments to invoices.</h3><p>Explore payment requests and matching for configured collections. Confirm supported collection modes, onboarding and plan availability during your demo.</p><ul><li>Invoice payment requests</li><li>Configured collection matching</li><li>Connected customer receipts</li></ul></article><article><div className="integration-name">KRA eTIMS<span>TAX INVOICING</span></div><h3>Follow the invoice handoff.</h3><p>Explore configured invoice and credit-note stamping. Live onboarding, credentials and successful stamping must be confirmed for your setup.</p><ul><li>Configured invoice stamping</li><li>Credit-note workflow</li><li>Document traceability</li></ul></article></div><figure><img src="/assets/integrations.webp" alt="Concept sculpture connecting an invoice and a payment phone" loading="lazy" width="2048" height="1360"/><figcaption>Payments and invoices, connected in your workflow.</figcaption></figure></div></section>
 <section className="features section-wrap" id="features"><div className="features-lead"><h2>One connected<br/>workspace.</h2><p>Choose the modules your business needs. Give your team a common view of the records behind each transaction.</p><img src="/assets/steel.webp" alt="Brushed metal detail with a blue inlay" loading="lazy" width="2048" height="1152"/></div><div className="capabilities">{[['Sales','Customers, sales documents, invoices and receipts.',0],['Purchasing','Suppliers, orders, goods receipts and supplier transactions.',1],['Inventory','Items, stock movements and stock inquiries.',2],['Banking','Bank records, customer payments and supplier balances.',4],['Accounting & reports','General Ledger and financial and operational reports.',3],['Optional modules','Discuss manufacturing, fixed assets and dimensions for your setup.',5]].map(([name,copy,icon])=><article key={String(name)}><img src={`/assets/icon-${icon}.png`} alt="" role="presentation" width="40" height="40"/><div><h3>{name}</h3><p>{copy}</p></div></article>)}</div></section>
 <section className="pricing section-wrap" id="pricing"><div className="pricing-type"><h2>Your business.<br/><span>Your setup.</span></h2><p>Plan your users, modules, onboarding and support around the way your business works.</p></div><div className="setup-list">{[['Choose your modules','Start with the workflows you need.'],['Size your team','Confirm included and additional users.'],['Agree your onboarding','Discuss data import and training.'],['Confirm the offer','Review billing, add-ons and support terms.']].map(([title,copy],i)=><div key={title}><span>{String(i+1).padStart(2,'0')}</span><h3>{title}</h3><p>{copy}</p></div>)}</div><a href="#demo" className="pricing-action"><span>Talk to us about your setup.</span><strong>Book a demo ↗</strong></a></section>
 <section className="demo section-wrap" id="demo"><div className="demo-lead"><h2>See your workflow<br/>in action.</h2><p>Tell us what you manage and what you want to connect. Start with a focused product demonstration.</p><div className="demo-summary"><span>A useful demo starts with your business.</span><ul><li>Your purchasing and stock flow</li><li>Your invoicing and payment needs</li><li>Your team, reports and optional modules</li></ul></div><a className="existing-link" href="https://erp.werevu.co.ke/">Already using SnapERP? Sign in ↗</a></div><DemoForm onPrivacy={()=>setPrivacy(true)}/></section>
 <section className="security section-wrap" id="security"><h2>A workspace for your team.</h2><div><p>Explore permissions, personal profiles, two-step sign-in and active-session management. Confirm the protections and configuration available for your company.</p><p>Use demonstration data to explore the workflow. No real payments or tax submissions are made by this marketing site.</p></div></section></main>
 <footer className="site-footer section-wrap"><div><Brand/><p>Sales, stock and accounts, connected.</p></div><div className="footer-links"><a href="#workflow">Workflow</a><a href="#security">Security</a><button onClick={()=>setPrivacy(true)}>Demo request privacy</button><a href="https://erp.werevu.co.ke/">Sign in ↗</a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} SnapERP</span><span>Follow the goods. Understand the business.</span></div></footer>
 {privacy&&<div className="privacy-backdrop" onClick={closePrivacy}><section className="privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-title" onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')closePrivacy();if(e.key==='Tab'){const nodes=e.currentTarget.querySelectorAll<HTMLElement>('button');const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}><button id="privacy-close" className="privacy-close" onClick={closePrivacy} aria-label="Close privacy notice">×</button><h2 id="privacy-title">About your demo request</h2><p>Your name, business, contact details and workflow are recorded to understand your needs and contact you about your demo request.</p><p>The form stores your submission in the website's private database. A hashed network identifier limits automated abuse. Your contact details are not published on this site.</p><p>Do not include passwords, credentials or sensitive financial information. Workflow examples use illustrative records.</p><button className="privacy-done" onClick={closePrivacy}>Close notice</button></section></div>}
 </>;
}
function DemoForm({onPrivacy}:{onPrivacy:()=>void}){
 const [pending,setPending]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState('');const requestId=useRef('');
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(pending)return;setError('');setPending(true);const form=new FormData(e.currentTarget);if(!requestId.current)requestId.current=crypto.randomUUID();try{const result=await requestDemo({data:{requestId:requestId.current,name:String(form.get('name')||''),business:String(form.get('business')||''),email:String(form.get('email')||''),phone:String(form.get('phone')||''),workflow:String(form.get('workflow')||''),website:String(form.get('website')||''),consent:form.get('consent')==='on'}});if(result.ok)setReceipt(result.reference);else setError(result.message);}catch{setError('We could not record your request. Please try again.');}finally{setPending(false);}}
 if(receipt)return <div className="demo-success" role="status"><span className="success-check" aria-hidden="true">✓</span><h3>Your request is recorded.</h3><p>Your demo details have been saved for review. Keep this reference for your request.</p><strong>{receipt}</strong><button onClick={()=>{setReceipt('');requestId.current='';}}>Make another request</button></div>;
 return <form className="demo-form" onSubmit={submit}><div className="form-pair"><div><label htmlFor="demo-name">Your name</label><input id="demo-name" name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Full name"/></div><div><label htmlFor="demo-business">Business name</label><input id="demo-business" name="business" autoComplete="organization" required minLength={2} maxLength={150} placeholder="Your business"/></div></div><div className="form-pair"><div><label htmlFor="demo-email">Email address</label><input id="demo-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@business.co.ke"/></div><div><label htmlFor="demo-phone">Phone <span>(optional)</span></label><input id="demo-phone" name="phone" type="tel" autoComplete="tel" maxLength={30} placeholder="Preferred contact number"/></div></div><div><label htmlFor="demo-workflow">What would you like to connect?</label><textarea id="demo-workflow" name="workflow" required minLength={10} maxLength={2000} rows={4} placeholder="For example: purchasing, processing, stock, M-Pesa and invoicing."/></div><div className="form-honey" aria-hidden="true"><label htmlFor="demo-website">Website</label><input id="demo-website" name="website" tabIndex={-1} autoComplete="off"/></div><label className="consent-label"><input type="checkbox" name="consent" required/><span>I agree to use of my details to review and contact me about this demo request.</span></label><button className="privacy-link" type="button" onClick={onPrivacy}>How your demo details are used ↗</button>{error&&<p className="form-error" id="demo-error" role="alert">{error}</p>}<button className="demo-submit" type="submit" disabled={pending} aria-describedby={error?'demo-error':undefined}>{pending?'Recording request…':'Request demo'}<span aria-hidden="true">↗</span></button><p className="form-footnote">No payment details needed. Share your workflow, not sensitive business records.</p></form>;
}
