import { ActionIcon, BusinessIcon } from '@/components/snaperp/site-icons';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, type CSSProperties } from 'react';
import { useScrollShowcase } from '@/components/snaperp/use-scroll-showcase';
import { MarketingPage } from '@/components/snaperp/site-chrome';

export const Route = createFileRoute('/features')({
 head:()=>({meta:[{title:'Features | SnapERP'},{name:'description',content:'Explore connected business modules and the next features planned for SnapERP.'},{property:'og:title',content:'Features | SnapERP'},{property:'og:description',content:'Explore connected business modules and the next features planned for SnapERP.'},{property:'og:url',content:'https://snaperp-journey.higgsfield.app/features'}]}),
 component:Page,
});
const modules = [
 {name:'Point of sale', title:'Keep the counter moving.', copy:'Bring everyday counter sales into your business workflow with SnapERP point of sale.', steps:['Select items','Complete sale','Issue receipt'], record:'Basket → Sale → Receipt', metric:'Explore the POS workflow in your demo.'},
 {name:'Sales', title:'Turn an order into a complete record.', copy:'Keep customers, orders, invoices and receipts connected through every handover.', steps:['Customer order','Invoice issued','Receipt recorded'], record:'SO-0286 → INV-0286 → RCT-0286', metric:'One customer. One connected history.'},
 {name:'Purchasing', title:'Bring every purchase into view.', copy:'Connect supplier orders, incoming goods and supplier transactions from the start.', steps:['Purchase order','Goods received','Supplier transaction'], record:'PO-1048 → GRN-1048 → Supplier ledger', metric:'Trace materials back to their purchase.'},
 {name:'Inventory', title:'Know where your goods belong.', copy:'Follow items, stock movements and inquiries across receiving, storage and dispatch.', steps:['Receive items','Update stock','Dispatch goods'], record:'Receiving → Warehouse → Customer', metric:'A stock movement behind each handover.'},
 {name:'Banking', title:'Give payments their place.', copy:'Bring bank records, customer payments and supplier balances into your daily workflow.', steps:['Payment recorded','Invoice matched','Balance updated'], record:'Payment → Invoice → Customer balance', metric:'Connect money received to the right record.'},
 {name:'Accounting', title:'See the records behind the numbers.', copy:'Use the General Ledger with financial and operational reports to understand your business.', steps:['Transaction recorded','Ledger updated','Report reviewed'], record:'Transaction → General Ledger → Report', metric:'From daily activity to a clearer overview.'},
 {name:'Manufacturing', optional:true, title:'Connect materials to finished goods.', copy:'Discuss production workflows that connect raw materials, work orders and finished stock.', steps:['Materials allocated','Work order processed','Finished goods received'], record:'Raw materials → Work order → Finished goods', metric:'Optional module · confirm scope during your demo.'},
 {name:'Fixed assets', optional:true, title:'Keep business assets in view.', copy:'Discuss the asset records and accounting setup your team needs for equipment and other fixed assets.', steps:['Asset registered','Record maintained','Account reviewed'], record:'Equipment → Asset record → Accounts', metric:'Optional module · confirm scope during your demo.'},
 {name:'Dimensions', optional:true, title:'Add context to your accounts.', copy:'Discuss dimensions for organising transactions and reporting around the way your business works.', steps:['Dimension selected','Transaction recorded','Results reviewed'], record:'Business context → Transaction → Report', metric:'Optional module · confirm scope during your demo.'},
];
const planned = [
 {name:'CRM & follow-ups', copy:'Manage leads, customer conversations and reminders in one place.', flow:['Lead','Conversation','Next step']},
 {name:'Barcode workflows', copy:'Scan items during receiving, stock counts, picking and dispatch.', flow:['Scan','Verify','Update']},
 {name:'Approvals & automation', copy:'Route purchases, discounts and other requests to the right approver.', flow:['Request','Review','Approve']},
 {name:'People & payroll', copy:'Bring employee records, attendance and payroll preparation together.', flow:['People','Attendance','Payroll']},
 {name:'Multi-branch operations', copy:'Coordinate branch stock, transfers and consolidated business views.', flow:['Branch','Transfer','Overview']},
 {name:'Mobile workspace', copy:'Help field teams capture orders and delivery updates on the move.', flow:['Order','Deliver','Sync']},
 {name:'Planning & insights', copy:'Explore demand trends, replenishment suggestions and business planning.', flow:['Trends','Forecast','Plan']},
];
function Page(){
 const {selected,track,jumpTo:jumpToModule}=useScrollShowcase(modules.length);
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
   <div className="feature-intro-links"><a href="#explore-modules">Explore the modules <ActionIcon name="down"/></a><a href="#planned-features">See what’s next <ActionIcon/></a></div>
  </section>
  <section className="feature-scrolltrack" id="explore-modules" ref={track} style={{'--module-count':modules.length} as CSSProperties} aria-label="Scroll through the SnapERP modules">
   <div className="feature-pinned-stage">
    <div className="feature-stage-inner section-wrap">
     <div className="feature-stage-top"><p className="feature-kicker">THE WORKSPACE, IN MOTION</p><a href="#planned-features">Skip to what’s next <ActionIcon/></a></div>
     <div className="feature-stage-layout">
      <div className="feature-stage-copy" aria-live="polite" aria-atomic="true">
       <p className="feature-module-label">{current.name}{current.optional&&<span>Optional module</span>}</p>
       <h2 key={current.name}>{current.title}</h2><p>{current.copy}</p>
       <a href="/#demo">Explore {current.name.toLowerCase()} in your demo <ActionIcon/></a>
      </div>
      <div className="feature-stage-visual" id="module-preview" aria-label={`${current.name} illustrative workflow`}>
       <div className="feature-visual-heading"><span>SnapERP / {current.name}</span><span>Illustrative workflow</span></div>
       <div className="feature-module-emblem" key={current.name}><div className="feature-orbit" aria-hidden="true"/><BusinessIcon name={current.name} className="business-icon-hero"/><strong>{current.name}</strong></div>
       <div className="module-flow" aria-label="Workflow steps">{current.steps.map((step,i)=><div className="module-flow-step" key={step} style={{'--item':i} as CSSProperties}><span className="module-step-marker"><ActionIcon name="check"/></span><span>{step}</span></div>)}</div>
       <div className="module-record"><span>CONNECTED RECORD</span><strong>{current.record}</strong><div className="module-progress" aria-hidden="true"><span/></div><p>{current.metric}</p></div>
      </div>
     </div>
     <div className="feature-stage-bottom"><p><ActionIcon name="down"/> Keep scrolling. The next module follows.</p><label>Jump to a module<select value={selected} onChange={event=>jumpToModule(Number(event.target.value))}>{modules.map((module,i)=><option key={module.name} value={i}>{module.name}</option>)}</select></label></div>
    </div>
   </div>
   <div className="feature-static-list section-wrap">{modules.map(module=><article key={module.name}><BusinessIcon name={module.name}/><p className="feature-kicker">{module.name}{module.optional?' · Optional module':''}</p><h2>{module.title}</h2><p>{module.copy}</p><ol>{module.steps.map(step=><li key={step}>{step}</li>)}</ol><small>{module.metric}</small></article>)}</div>
  </section>
  <section className="feature-roadmap section-wrap" id="planned-features" ref={roadmap} aria-labelledby="roadmap-heading">
   <div className="feature-section-heading"><div><p className="feature-kicker">LOOKING AHEAD</p><h2 id="roadmap-heading">More room to grow.</h2></div><p>Features we plan to build next. These concepts are not available yet; scope and release timing are still to be decided.</p></div>
   <div className="planned-grid">{planned.map((feature,i)=><article className="planned-feature" key={feature.name} style={{'--item':i%2} as CSSProperties}><div className="planned-top"><BusinessIcon name={feature.name}/><span className="planned-badge">Planned</span></div><h3>{feature.name}</h3><p>{feature.copy}</p><ol className="planned-flow" aria-label={`${feature.name} concept workflow`}>{feature.flow.map(step=><li key={step}>{step}</li>)}</ol></article>)}</div>
   <div className="roadmap-invitation"><h3>What would make your work easier?</h3><p>Tell us which workflow matters most to your team when you book a demo. Your feedback can help shape what we build.</p><a href="/#demo">Share your workflow <ActionIcon/></a></div>
  </section>
 </MarketingPage>;
}
