import { useEffect, useRef, type CSSProperties } from 'react';

export const journeySteps = [
  {
    "name": "Farm",
    "title": "Every journey starts with a grower.",
    "body": "Maize is harvested and gathered into sacks. Workers prepare the collection while the purchase order connects the grower to the mill.",
    "record": "Purchase order",
    "ref": "PO-1048",
    "event": "Farm collection arranged",
    "detail": "Maize ready for collection",
    "module": "Purchasing",
    "icon": 0
  },
  {
    "name": "Transport",
    "title": "Follow the road to the mill.",
    "body": "The collection truck leaves the farm and follows the bends to the factory receiving bay. The incoming consignment stays linked to its purchase order.",
    "record": "Incoming shipment",
    "ref": "PO-1048",
    "event": "Collection in transit",
    "detail": "Farm → factory",
    "module": "Purchasing",
    "icon": 5
  },
  {
    "name": "Receive",
    "title": "People handle every handover.",
    "body": "The truck stops at the factory. Workers offload the sacks, check the delivery and bring the maize into the receiving area.",
    "record": "Goods receipt",
    "ref": "GRN-1048",
    "event": "Maize received at the mill",
    "detail": "Checked and received",
    "module": "Inventory",
    "icon": 1
  },
  {
    "name": "Process",
    "title": "Watch the factory get to work.",
    "body": "Inside the mill, maize moves along the conveyor into processing. The production work order connects the raw grain to the finished flour.",
    "record": "Work order",
    "ref": "WO-0241",
    "event": "Milling and packing illustrated",
    "detail": "Maize → packaged flour",
    "module": "Optional manufacturing",
    "icon": 2
  },
  {
    "name": "Stock",
    "title": "A place for every package.",
    "body": "Packed flour moves into the warehouse. Workers place the finished goods on storage racks, ready for the next order.",
    "record": "Stock movement",
    "ref": "ST-0241",
    "event": "Flour placed into storage",
    "detail": "24 packages available",
    "module": "Inventory",
    "icon": 1
  },
  {
    "name": "Order",
    "title": "The next journey starts with a call.",
    "body": "A customer calls the sales desk. The order is recorded and the required flour is reserved for a credit sale.",
    "record": "Sales order",
    "ref": "SO-0286",
    "event": "Customer order confirmed",
    "detail": "24 packages reserved",
    "module": "Sales",
    "icon": 3
  },
  {
    "name": "Load",
    "title": "Pick it. Load it. Check it.",
    "body": "The warehouse team picks the reserved flour and carries it to the delivery truck. The loaded goods are checked against the customer order.",
    "record": "Picking list",
    "ref": "PICK-0286",
    "event": "Order picked and loaded",
    "detail": "Ready for dispatch",
    "module": "Inventory + dispatch",
    "icon": 1
  },
  {
    "name": "Invoice",
    "title": "Give the shipment its invoice.",
    "body": "Create the invoice for the loaded order. The customer, flour quantities and amount are recorded together. Payment will follow delivery.",
    "record": "Customer invoice",
    "ref": "INV-0286",
    "event": "Invoice created",
    "detail": "KSh 48,000 · unpaid",
    "module": "Sales",
    "icon": 3
  },
  {
    "name": "eTIMS",
    "title": "Submit. Validate. Stamp.",
    "body": "Follow the illustrative KRA eTIMS submission. Validation returns to the invoice before the loaded vehicle leaves for delivery.",
    "record": "Invoice validation",
    "ref": "INV-0286",
    "event": "eTIMS stamping illustrated",
    "detail": "Validated · unpaid",
    "module": "Configured eTIMS",
    "icon": 3
  },
  {
    "name": "Deliver",
    "title": "Take the goods all the way.",
    "body": "The delivery truck leaves the factory, follows the road downhill and turns with each bend. At the customer, workers unload the flour and confirm delivery.",
    "record": "Delivery note",
    "ref": "DSP-0286",
    "event": "Customer handover confirmed",
    "detail": "Delivered on credit",
    "module": "Delivery",
    "icon": 5
  },
  {
    "name": "Pay",
    "title": "Delivery first. Payment next.",
    "body": "The customer pays through M-Pesa after receiving the goods. The illustrative payment is matched to the outstanding invoice.",
    "record": "Payment matching",
    "ref": "INV-0286",
    "event": "M-Pesa payment received",
    "detail": "KSh 48,000 matched",
    "module": "Configured M-Pesa",
    "icon": 4
  },
  {
    "name": "Receipt",
    "title": "Close the journey with a receipt.",
    "body": "Issue the receipt, mark the invoice paid and bring the customer balance to zero. Every handover is connected, from the farm to the final record.",
    "record": "Customer receipt",
    "ref": "RCT-0286",
    "event": "Receipt issued",
    "detail": "Paid · balance KSh 0",
    "module": "Banking + accounting",
    "icon": 4
  }
] as const;

function Block({x,y,w=88,d=48,h=48,accent=false}:{x:number;y:number;w?:number;d?:number;h?:number;accent?:boolean}) {
 return <g transform={`translate(${x} ${y})`} className={accent?'iso-block accent-block':'iso-block'}><path className="block-top" d={`M0 0 L${w} -${w*.45} L${w+d} ${d*.45-w*.45} L${d} ${d*.45} Z`}/><path className="block-front" d={`M0 0 L${d} ${d*.45} L${d} ${d*.45+h} L0 ${h} Z`}/><path className="block-side" d={`M${d} ${d*.45} L${w+d} ${d*.45-w*.45} L${w+d} ${d*.45-w*.45+h} L${d} ${d*.45+h} Z`}/></g>
}
function Carton({x,y}:{x:number;y:number}) {return <g><Block x={x} y={y} w={24} d={20} h={25} accent/><path className="carton-seam" d={`M${x+12} ${y-5} l20 9 v25`}/></g>}
function Gear({x,y}:{x:number;y:number}) {return <g transform={`translate(${x} ${y})`}><g className="gear-rotor"><path className="gear-shape" d="M-8 -28h16l3 10 8 5 10-2 8 14-7 8v9l7 8-8 14-10-2-8 5-3 10H-8l-3-10-8-5-10 2-8-14 7-8v-9l-7-8 8-14 10 2 8-5z"/><circle className="gear-center" r="11"/></g></g>}
function Truck({x,y,small=false}:{x:number;y:number;small?:boolean}) {return <g transform={`translate(${x} ${y}) scale(${small?.68:1})`} className="world-truck"><Block x={0} y={0} w={94} d={43} h={43}/><Block x={-30} y={17} w={30} d={43} h={33} accent/><path className="truck-glass" d="M-25 24l32 15v12l-32-14z"/>{[-14,53,89].map(v=><g key={v} transform={`translate(${v} 57)`}><ellipse rx="10" ry="13" className="wheel"/><ellipse rx="4" ry="6" className="wheel-hub"/></g>)}<path className="truck-stripe" d="M46 22l65-30v8L46 30z"/></g>}

export function BusinessWorld({stage,progress=0}:{stage:number;progress?:number}) {
 const world=useRef<SVGSVGElement>(null);
 useEffect(()=>{if(world.current)world.current.style.setProperty('--travel',String(progress));},[progress]);
 return <svg ref={world} className="business-world" viewBox="0 0 860 630" role="img" aria-label={`Illustrative business world: ${journeySteps[stage].name}`} data-stage={stage} style={{'--stage':stage} as CSSProperties}>
 <defs><linearGradient id="floor-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" className="floor-light"/><stop offset="1" className="floor-dark"/></linearGradient><linearGradient id="glass-grad"><stop className="glass-light"/><stop offset="1" className="glass-dark"/></linearGradient><pattern id="world-grid" width="32" height="32" patternTransform="matrix(1 .45 -1 .45 430 0)" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" className="grid-line"/></pattern></defs>
 <ellipse cx="434" cy="505" rx="375" ry="84" className="world-shadow"/>
 <path d="M62 353L418 173l380 191-356 181z" fill="url(#floor-grad)" className="world-floor"/><path d="M62 353l380 192 356-181v18L442 564 62 371z" className="floor-edge"/><path d="M62 353L418 173l380 191-356 181z" fill="url(#world-grid)"/>
 <path className="world-road" d="M120 371l320 158 280-140"/><path className="road-marking" d="M120 371l320 158 280-140"/>
 <path className="connection-under" d="M190 340l111-65 137 67 121-65 96 65-141 105-142-69z"/>
 <path className="connection-route" d="M190 340l111-65 137 67 121-65 96 65-141 105-142-69z"/>
 <g className={`station station-receive ${stage<=1?'station-active':''}`}><Block x={110} y={310} w={97} d={72} h={20}/><Block x={140} y={237} w={80} d={58} h={68}/><path className="dock-door" d="M199 259l64-29v59l-64 29z"/>{[0,1,2].map(i=><path key={i} className="dock-line" d={`M200 ${269+i*15}l62-28`}/>)}<Carton x={145} y={326}/><Carton x={180} y={310}/><Truck x={94} y={369} small/></g>
 <g className={`station station-process ${stage===2?'station-active':''}`}><Block x={293} y={234} w={99} d={62} h={77}/><path className="factory-window" d="M355 262l99-45v41l-99 45z"/>{[0,1,2,3].map(i=><path key={i} d={`M${374+i*20} ${253-i*9}v41`} className="factory-window-frame"/>)}<Block x={337} y={184} w={16} d={15} h={-63}/><Block x={368} y={170} w={16} d={15} h={-57}/><g className="process-motion"><Gear x={389} y={278}/></g><Block x={270} y={293} w={124} d={28} h={12}/>{[0,1,2,3,4,5,6].map(i=><path key={i} d={`M${280+i*16} ${290-i*7.2}l26 12`} className="conveyor-roller"/>)}<g className="conveyor-carton"><Carton x={308} y={269}/></g></g>
 <g className={`station station-stock ${stage===3?'station-active':''}`}><Block x={491} y={242} w={86} d={60} h={70}/><path d="M491 242l60 27v70l-60-27z" className="warehouse-glass"/><path d="M551 269l86-39v70l-86 39z" className="warehouse-glass"/>{[0,1,2].map(i=><path key={i} d={`M551 ${285+i*20}l86-39`} className="warehouse-shelf"/>)}<Carton x={548} y={256}/><Carton x={582} y={240}/><Carton x={560} y={300}/></g>
 <g className={`station station-invoice ${stage===4?'station-active':''}`} transform="translate(570 345)"><Block x={-30} y={22} w={62} d={39} h={18}/><path className="invoice-paper" d="M0-49l56 26v77L0 28z"/><path className="invoice-fold" d="M40-30l16 7v16l-16-7z"/>{[0,1,2,3].map(i=><path key={i} className="invoice-line" d={`M10 ${-23+i*13}l30 14`}/>)}<g className="etims-stamp"><circle cx="39" cy="29" r="18"/><path d="M29 29l7 8 15-17"/></g></g>
 <g className={`station station-payment ${stage===5?'station-active':''}`} transform="translate(390 383)"><Block x={-22} y={20} w={66} d={40} h={18}/><path className="phone-body" d="M0-54l49 23q6 3 6 9v61q0 9-8 5L0 23q-6-3-6-9v-61q0-10 6-7z"/><path className="phone-screen" d="M1-40l45 21v50L1 10z"/><g className="payment-check"><circle cx="24" cy="-3" r="14"/><path d="M16-3l6 7 12-14"/></g><path className="phone-speaker" d="M14-41l18 8"/></g>
 <g className={`station station-delivery ${stage>=6?'station-active':''}`}><Block x={529} y={431} w={92} d={70} h={16}/><Carton x={551} y={408}/><Carton x={583} y={394}/><g className="delivery-motion"><Truck x={583} y={447}/></g></g>
 <g className="shipment-marker"><Carton x={232+Math.min(stage,3)*66} y={332-Math.min(stage,3)*14}/></g>
 <g className="world-annotations"><text x="143" y="212">RECEIVING</text><text x="310" y="102">PROCESSING</text><text x="542" y="204">STOCK</text><text x="627" y="317">INVOICE</text><text x="344" y="349">PAYMENT</text><text x="694" y="448">DELIVERY</text></g>
 </svg>;
}
