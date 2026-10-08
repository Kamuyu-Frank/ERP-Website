import {
  ArrowDown, ArrowRight, ArrowUpRight, ChevronDown, Barcode, Boxes, ChartNoAxesCombined, Check,
  CircleCheck, ClipboardCheck, Factory, FileText, GitBranch, Headphones,
  Landmark, Layers, MessageCircle, MonitorSmartphone, Network, PackageCheck,
  Plus, ReceiptText, ScanLine, Settings2, ShieldCheck, ShoppingBag, ShoppingCart,
  Smartphone, Truck, Users, Wallet, Webhook, Wrench, X,
  type LucideIcon,
} from 'lucide-react';

const icons:Record<string,LucideIcon>={
 'Connect the essentials':Boxes,'Connect the whole business':Network,'Connect production':Factory,
 'Point of sale':ScanLine,Sales:ReceiptText,Purchasing:ShoppingCart,Inventory:Boxes,
 Banking:Landmark,Accounting:ChartNoAxesCombined,'Accounting & reports':ChartNoAxesCombined,
 Manufacturing:Factory,'Fixed assets':Wrench,Dimensions:Layers,
 'CRM & follow-ups':MessageCircle,'Barcode workflows':Barcode,'Approvals & automation':ClipboardCheck,
 'People & payroll':Users,'Multi-branch operations':Network,'Mobile workspace':Smartphone,'Planning & insights':ChartNoAxesCombined,
 'Bank feeds':Landmark,'Online stores':ShoppingBag,Messaging:MessageCircle,'APIs & webhooks':Webhook,
 'Modules & users':Users,'Onboarding & migration':Truck,Integrations:GitBranch,'Billing & support':Headphones,
 'Discuss your workflow':MessageCircle,'Confirm the connection':Settings2,'Verify the handoff':ShieldCheck,
 'M-Pesa':Wallet,'KRA eTIMS':FileText,
};
export function BusinessIcon({name,className=''}:{name:string;className?:string}){
 const Icon=icons[name]||PackageCheck;
 return <span className={`business-icon ${className}`} aria-hidden="true"><Icon strokeWidth={1.6}/></span>;
}
const actions={arrow:ArrowRight,external:ArrowUpRight,chevron:ChevronDown,down:ArrowDown,check:Check,success:CircleCheck,plus:Plus,close:X,device:MonitorSmartphone};
export function ActionIcon({name='arrow'}:{name?:keyof typeof actions}){
 const Icon=actions[name];
 return <Icon className={`action-icon action-icon-${name}`} size={18} strokeWidth={1.8} aria-hidden="true"/>;
}
