/* The lab and homepage share the same embedded player and twelve-stage journey. */
const $=id=>document.getElementById(id);
const chapters=[
 ['Supplier','Purchase order','Goods are collected from the supplier and loaded for transport.'],
 ['Transport','Incoming consignment','The truck follows the town roads to the receiving dock.'],
 ['Receive','Goods receipt','The receiving team checks and unloads the incoming goods.'],
 ['Manufacture','Work order','Materials move through the processing line and become finished products.'],
 ['Stock','Stock movement','Forklifts move finished goods into warehouse stock.'],
 ['Order','Sales order','The customer order reserves goods for fulfilment.'],
 ['Load','Dispatch','Reserved cartons are loaded into the delivery truck.'],
 ['Invoice','INV-0286','The invoice keeps the customer, goods and amount connected.'],
 ['eTIMS','Tax validation','The illustrative invoice is submitted for validation.'],
 ['Deliver','Customer handover','The delivery arrives and the customer receives the goods.'],
 ['Pay','M-Pesa payment','The customer confirms KSh 48,000 on their phone.'],
 ['Receipt','RCT-0286','Payment is matched and the customer receives a receipt.']
];
let time=0,playing=false,frame=0,previous=0;
const duration=60,reduced=matchMedia('(prefers-reduced-motion: reduce)');
$('scenario').disabled=true;
$('scrubber').max='12';$('scrubber').step='.001';
$('stages').innerHTML=chapters.map((c,i)=>`<button type="button" data-stage="${i}"><span>${String(i+1).padStart(2,'0')}</span>${c[0]}</button>`).join('');
function render(){
 const stage=Math.min(11,Math.floor(time)),c=chapters[stage];
 $('world').contentWindow?.postMessage({type:'snaperp-journey',progress:time},location.origin);
 $('scene-number').textContent=`${String(stage+1).padStart(2,'0')} / 12`;
 $('module').textContent=c[0];$('heading').textContent=c[1];$('description').textContent=c[2];$('record').textContent='Illustrative workflow';
 $('scrubber').value=String(time);$('elapsed').textContent=`${String(Math.floor(time*5/60)).padStart(2,'0')}:${String(Math.floor(time*5%60)).padStart(2,'0')} / 01:00`;
 for(const button of $('stages').children)button.setAttribute('aria-pressed',String(Number(button.dataset.stage)===stage));
}
function pause(){playing=false;previous=0;cancelAnimationFrame(frame);$('play').textContent='Play';$('play').setAttribute('aria-pressed','false');}
function tick(now){
 if(!playing)return;
 const dt=previous?Math.min(100,now-previous):0;previous=now;
 time=Math.min(12,time+dt/1000*12/duration*Number($('speed').value));
 render();if(time>=12)pause();else frame=requestAnimationFrame(tick);
}
$('play').addEventListener('click',()=>{if(playing){pause();return;}if(time>=12)time=0;playing=true;$('play').textContent='Pause';$('play').setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick);});
$('replay').addEventListener('click',()=>{pause();time=0;render();});
$('scrubber').addEventListener('input',event=>{pause();time=Number(event.target.value);render();});
$('stages').addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;pause();time=Number(b.dataset.stage)+(reduced.matches ? .95 : .1);render();});
$('world').addEventListener('load',render);
window.addEventListener('pagehide',pause);
render();
