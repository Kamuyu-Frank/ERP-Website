import { ActionIcon } from './site-icons';
import { useId, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Sun, Moon, Monitor, Menu, X } from 'lucide-react';
function subscribeTheme(callback:()=>void){window.addEventListener('snaperp-theme-change',callback);return ()=>window.removeEventListener('snaperp-theme-change',callback);}
const themeOptions=[{value:'light',label:'Light',Icon:Sun},{value:'dark',label:'Dark',Icon:Moon},{value:'system',label:'Device theme',Icon:Monitor}];
function ThemeControl(){
 const preference=useSyncExternalStore(subscribeTheme,()=>document.documentElement.dataset.themePreference||'system',()=> 'system');
 const id=useId();
 const panel=useRef<HTMLDivElement>(null);
 const current=themeOptions.find(option=>option.value===preference)||themeOptions[2];
 const Icon=current.Icon;
 return <div className="theme-control">
  <button type="button" className="theme-trigger" popoverTarget={id} aria-label={`Appearance: ${current.label}. Change theme`} title={`Appearance: ${current.label}`}><Icon size={19} strokeWidth={1.7} aria-hidden="true"/></button>
  <div id={id} ref={panel} popover="auto" className="theme-popover">
   <span className="theme-caption">Appearance</span>
   <div className="theme-options" role="group" aria-label="Colour theme">{themeOptions.map(({value,label,Icon:OptionIcon})=><button type="button" key={value} aria-label={label} aria-pressed={preference===value} title={label} onClick={()=>{window.dispatchEvent(new CustomEvent('snaperp-theme-select',{detail:value}));panel.current?.hidePopover();}}><OptionIcon size={19} strokeWidth={1.7} aria-hidden="true"/><span>{value==='system'?'Auto':label}</span></button>)}</div>
  </div>
 </div>;
}
function Brand(){return <a className="brand" href="/" aria-label="SnapERP home"><picture><source media="(prefers-reduced-motion: reduce)" srcSet="/assets/brand/logo-static.png"/><img src="/assets/brand/logo.gif" alt="SnapERP arithmetic tiles" width="48" height="48"/></picture><span>Snap<span className="brand-erp">ERP</span></span></a>}

export function SiteHeader({active=''}:{active?:string}){
 const [menu,setMenu]=useState(false);
 return <><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><div className="header-inner"><Brand/><nav id="site-nav" className={menu?'site-nav nav-open':'site-nav'} aria-label="Main navigation">{[['Workflow','/#workflow'],['Features','/features'],['Integrations','/integrations'],['Pricing','/pricing']].map(([label,link])=><a key={label} href={link} aria-current={active===link?'page':undefined} onClick={()=>setMenu(false)}>{label}</a>)}<a className="sign-in" href="https://erp.werevu.co.ke/">Sign in <ActionIcon name="external"/></a><a className="nav-demo" href="/#demo" onClick={()=>setMenu(false)}>Book a demo <ActionIcon/></a></nav><div className="header-tools"><ThemeControl/><button type="button" className="menu-toggle" aria-label={menu?'Close navigation':'Open navigation'} aria-expanded={menu} aria-controls="site-nav" onClick={()=>setMenu(!menu)}>{menu?<X size={21} aria-hidden="true"/>:<Menu size={21} aria-hidden="true"/>}</button></div></div></header></>;
}
export function SiteFooter({onPrivacy}:{onPrivacy?:()=>void}){return <footer className="site-footer section-wrap"><div><Brand/><p>Sales, stock and accounts, connected.</p></div><div className="footer-links"><a href="/#workflow">Workflow</a><a href="/features">Features</a><a href="/integrations">Integrations</a><a href="/pricing">Pricing</a><a href="/#security">Security</a>{onPrivacy?<button onClick={onPrivacy}>Demo request privacy</button>:<a href="/#demo">Request a demo</a>}<a href="https://erp.werevu.co.ke/">Sign in <ActionIcon name="external"/></a></div><div className="footer-bottom"><span>© {new Date().getFullYear()} SnapERP</span><span>Follow the goods. Understand the business.</span></div></footer>;}
export function MarketingPage({active,children}:{active:string;children:ReactNode}){return <><SiteHeader active={active}/><main id="main" className="marketing-page">{children}<div className="section-wrap page-demo-link"><a className="nav-demo" href="/#demo">Book a demo <ActionIcon/></a></div></main><SiteFooter/></>;}
