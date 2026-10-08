import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MarketingPage } from '@/components/snaperp/site-chrome';

export const Route = createFileRoute('/features')({
 head:()=>({meta:[{title:'Features | SnapERP'},{name:'description',content:'Explore connected business modules and the next features planned for SnapERP.'},{property:'og:title',content:'Features | SnapERP'},{property:'og:description',content:'Explore connected business modules and the next features planned for SnapERP.'},{property:'og:url',content:'https://snaperp-journey.higgsfield.app/features'}]}),
 component:Page,
});
const modules = [
 {name:'Sales', icon:0, title:'Turn an order into a complete record.', copy:'Keep customers, orders, invoices and receipts connected through every handover.', steps:['Customer order','Invoice issued','Receipt recorded'], record:'SO-0286 → INV-0286 → RCT-0286', metric:'One customer. One connected history.'},
 {name:'Purchasing', icon:1, title:'Bring every purchase into view.', copy:'Connect supplier orders, incoming goods and supplier transactions from the start.', steps:['Purchase order','Goods received','Supplier transaction'], record:'PO-1048 → GRN-1048 → Supplier ledger', metric:'Trace materials back to their purchase.'},
 {name:'Inventory', icon:2, title:'Know where your goods belong.', copy:'Follow items, stock movements and inquiries across receiving, storage and dispatch.', steps:['Receive items','Update stock','Dispatch goods'], record:'Receiving → Warehouse → Customer', metric:'A stock movement behind each handover.'},
 {name:'Banking', icon:4, title:'Give payments their place.', copy:'Bring bank records, customer payments and supplier balances into your daily workflow.', steps:['Payment recorded','Invoice matched','Balance updated'], record:'Payment → Invoice → Customer balance', metric:'Connect money received to the right record.'},
 {name:'Accounting', icon:3, title:'See the records behind the numbers.', copy:'Use the General Ledger with financial and operational reports to understand your business.', steps:['Transaction recorded','Ledger updated','Report reviewed'], record:'Transaction → General Ledger → Report', metric:'From daily activity to a clearer overview.'},
 {name:'Manufacturing', icon:5, optional:true, title:'Connect materials to finished goods.', copy:'Discuss production workflows that connect raw materials, work orders and finished stock.', steps:['Materials allocated','Work order processed','Finished goods received'], record:'Raw materials → Work order → Finished goods', metric:'Optional module · confirm scope during your demo.'},
 {name:'Fixed assets', icon:2, optional:true, title:'Keep business assets in view.', copy:'Discuss the asset records and accounting setup your team needs for equipment and other fixed assets.', steps:['Asset registered','Record maintained','Account reviewed'], record:'Equipment → Asset record → Accounts', metric:'Optional module · confirm scope during your demo.'},
 {name:'Dimensions', icon:3, optional:true, title:'Add context to your accounts.', copy:'Discuss dimensions for organising transactions and reporting around the way your business works.', steps:['Dimension selected','Transaction recorded','Results reviewed'], record:'Business context → Transaction → Report', metric:'Optional module · confirm scope during your demo.'},
];
const planned = [
 {name:'CRM & follow-ups', icon:'◎', copy:'Manage leads, customer conversations and reminders in one place.', flow:['Lead','Conversation','Next step']},
 {name:'Point of sale', icon:'▦', copy:'A checkout workflow connected to products, stock and customer receipts.', flow:['Basket','Checkout','Receipt']},
 {name:'Barcode workflows', icon:'▥', copy:'Scan items during receiving, stock counts, picking and dispatch.', flow:['Scan','Verify','Update']},
 {name:'Approvals & automation', icon:'✓', copy:'Route purchases, discounts and other requests to the right approver.', flow:['Request','Review','Approve']},
 {name:'People & payroll', icon:'◉', copy:'Bring employee records, attendance and payroll preparation together.', flow:['People','Attendance','Payroll']},
 {name:'Multi-branch operations', icon:'⌘', copy:'Coordinate branch stock, transfers and consolidated business views.', flow:['Branch','Transfer','Overview']},
 {name:'Mobile workspace', icon:'↗', copy:'Help field teams capture orders and delivery updates on the move.', flow:['Order','Deliver','Sync']},
 {name:'Planning & insights', icon:'↗', copy:'Explore demand trends, replenishment suggestions and business planning.', flow:['Trends','Forecast','Plan']},
];
function Page(){
 const [selected,setSelected]=useState(0),[replay,setReplay]=useState(0);
 const roadmap=useRef<HTMLElement>(null);
 useEffect(()=>{
  const cards=roadmap.current?.querySelectorAll<HTMLElement>('.planned-feature');
  if(!cards||!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('feature-enter');observer.unobserve(entry.target);}}),{threshold:.15});
  cards.forEach(card=>observer.observe(card));return()=>observer.disconnect();
 },[]);
 const current=modules[selected];
 return <MarketingPage active="/features">
  <section className="feature-intro section-wrap">
   <p className="feature-kicker">THE CONNECTED WORKSPACE</p>
   <h1>Every team.<br/>Moving together.</h1>
   <p>From the first purchase to the final receipt, give each team the records they need—and connect the work between them.</p>
   <div className="feature-intro-links"><a href="#explore-modules">Explore the modules ↓</a><a href="#planned-features">See what’s next ↗</a></div>
  </section>
  <section className="feature-explorer section-wrap" id="explore-modules" aria-labelledby="modules-heading">
   <div className="feature-section-heading"><div><p className="feature-kicker">EXPLORE SNAP ERP</p><h2 id="modules-heading">See how the work connects.</h2></div><p>Select a module to follow an illustrative workflow. Module scope and availability are confirmed during your demo.</p></div>
   <div className="feature-workspace">
    <div className="module-picker" aria-label="Explore a business module">{modules.map((module,i)=><button key={module.name} aria-pressed={selected===i} aria-controls="module-preview" onClick={()=>setSelected(i)}><img src={`/assets/icon-${module.icon}.png`} alt="" width="36" height="36"/><span>{module.name}{module.optional&&<small>Optional module</small>}</span><span className="module-arrow" aria-hidden="true">↗</span></button>)}</div>
    <div className="module-preview" id="module-preview" aria-live="polite" aria-atomic="true">
     <div className="module-preview-copy"><p className="feature-kicker">{current.name} / WORKFLOW PREVIEW</p><h3>{current.title}</h3><p>{current.copy}</p></div>
     <div className="module-animation" key={`${selected}-${replay}`}>
      <div className="module-flow" aria-label="Workflow steps">{current.steps.map((step,i)=><div className="module-flow-step" key={step} style={{'--item':i} as CSSProperties}><span className="module-step-marker" aria-hidden="true">✓</span><span>{step}</span></div>)}</div>
      <div className="module-record"><span>CONNECTED RECORD</span><strong>{current.record}</strong><div className="module-progress" aria-hidden="true"><span/></div><p>{current.metric}</p></div>
     </div>
     <div className="module-preview-footer"><span>Illustrative example</span><button onClick={()=>setReplay(value=>value+1)} aria-label={`Replay ${current.name} workflow animation`}>Replay animation ↻</button></div>
    </div>
   </div>
  </section>
  <section className="feature-roadmap section-wrap" id="planned-features" ref={roadmap} aria-labelledby="roadmap-heading">
   <div className="feature-section-heading"><div><p className="feature-kicker">LOOKING AHEAD</p><h2 id="roadmap-heading">More room to grow.</h2></div><p>Features we plan to build next. These concepts are not available yet; scope and release timing are still to be decided.</p></div>
   <div className="planned-grid">{planned.map((feature,i)=><article className="planned-feature" key={feature.name} style={{'--item':i%2} as CSSProperties}><div className="planned-top"><span className="planned-icon" aria-hidden="true">{feature.icon}</span><span className="planned-badge">Planned</span></div><h3>{feature.name}</h3><p>{feature.copy}</p><ol className="planned-flow" aria-label={`${feature.name} concept workflow`}>{feature.flow.map(step=><li key={step}>{step}</li>)}</ol></article>)}</div>
   <div className="roadmap-invitation"><h3>What would make your work easier?</h3><p>Tell us which workflow matters most to your team when you book a demo. Your feedback can help shape what we build.</p><a href="/#demo">Share your workflow ↗</a></div>
  </section>
 </MarketingPage>;
}
