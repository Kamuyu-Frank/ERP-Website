/* Isometric scene renderer. Positions use a shared x/y/z world; SVG stays crisp on mobile. */
(() => {
  const svg = document.getElementById('world');
  const C = { bg:'#101b24',floor:'#17232d',top:'#526e80',left:'#2a4253',right:'#203342',edge:'#6c8b9e',accent:'#00a9d9',light:'#85dfff',white:'#f2f6f8',muted:'#abbcc7',deep:'#0b141c' };
  const names=['Purchase','Receive','Process','Stock','Order','Invoice','Delivery','Payment'];
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  const point=(x,y,z=0)=>[450+(x-y)*.866,275+(x+y)*.5-z];
  const coord=p=>p.map(v=>v.toFixed(2)).join(',');
  const poly=(points,fill,extra='')=>`<polygon points="${points.map(coord).join(' ')}" fill="${fill}" stroke="${C.edge}" stroke-width=".7" stroke-opacity=".32" ${extra}/>`;
  const line=(a,b,color=C.edge,width=1,extra='')=>`<path d="M${coord(a)} L${coord(b)}" fill="none" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const text=(x,y,label,size=12,color=C.muted)=>`<text x="${x}" y="${y}" fill="${color}" font-family="system-ui" font-size="${size}" letter-spacing="1.3">${label}</text>`;
  const cuboid=(x,y,z,w,d,h,accent=false)=>{
    const a=point(x,y,z+h),b=point(x+w,y,z+h),c=point(x+w,y+d,z+h),e=point(x,y+d,z+h);
    return poly([e,c,point(x+w,y+d,z),point(x,y+d,z)],accent?'#00698b':C.left)+poly([b,c,point(x+w,y+d,z),point(x+w,y,z)],accent?'#0089b0':C.right)+poly([a,b,c,e],accent?C.accent:C.top);
  };
  const carton=(x,y,z=0,size=28)=>cuboid(x,y,z,size,size,size,true)+line(point(x+size/2,y,z+size+.5),point(x+size/2,y+size,z+size+.5),C.light,2)+line(point(x+size/2,y+size,z+size),point(x+size/2,y+size,z+3),C.light,2);
  const pallet=(x,y)=>{let s='';for(let i=0;i<4;i++)s+=cuboid(x+i*17,y,0,12,65,6);return s;};
  const shadow=(x,y,w=70)=>{const p=point(x,y);return `<ellipse cx="${p[0]}" cy="${p[1]+5}" rx="${w}" ry="${w*.32}" fill="${C.deep}" opacity=".65"/>`;};
  // Model stays mounted: wheel rotation follows distance, including reverse seeking.
  const truck=()=>{
    let s=shadow(63,28,96)+cuboid(0,0,21,143,55,10);
    s+=cuboid(0,0,33,87,55,57).replaceAll(C.top,'#d3e1e9').replaceAll(C.left,'#8fa8b9').replaceAll(C.right,'#628298');
    for(let i=0;i<8;i++)s+=line(point(6+i*10,55.5,38),point(6+i*10,55.5,85),'#b6cbd7',.8);
    s+=poly([point(0,55.8,56),point(87,55.8,56),point(87,55.8,68),point(0,55.8,68)],'#008db7');
    const brand=point(13,56,72);
    s+=`<text transform="matrix(.866 .5 0 -1 ${brand[0]} ${brand[1]}) scale(1 -1)" font-family="system-ui" font-size="11" font-weight="700" fill="#f4fbff">SNAP ERP</text>`;
    // Sloped windscreen and roof, with a separate bumper and wheel arches.
    s+=poly([point(92,55,33),point(143,55,33),point(143,55,62),point(131,55,85),point(96,55,85)],'#009bc5');
    s+=poly([point(92,0,33),point(143,0,33),point(143,0,62),point(131,0,85),point(96,0,85)],'#027798');
    s+=poly([point(96,0,85),point(131,0,85),point(131,55,85),point(96,55,85)],'#56d5ee');
    s+=poly([point(131,0,85),point(143,0,62),point(143,55,62),point(131,55,85)],'#123349');
    s+=poly([point(132,5,81),point(141,5,64),point(141,49,64),point(132,49,81)],'#7bc8df');
    s+=line(point(132,8,80),point(139,8,66),'#dcf8ff',2);
    s+=poly([point(100,55.7,79),point(127,55.7,79),point(138,55.7,62),point(100,55.7,62)],'#143e56');
    s+=line(point(102,56,77),point(124,56,77),'#83d5ea',2);
    s+=line(point(97,56,57),point(97,56,38),'#006888',1.4)+line(point(101,56,56),point(110,56,56),'#cff5ff',2);
    s+=poly([point(143,0,33),point(143,55,33),point(143,55,62),point(143,0,62)],'#0088ad');
    s+=cuboid(143,3,28,5,49,7).replaceAll(C.top,'#bccdd8');
    for(let i=0;i<3;i++)s+=line(point(143.5,15,42+i*4),point(143.5,40,42+i*4),'#102c3e',2);
    for(const y of [5,44])s+=poly([point(144,y,48),point(144,y+7,48),point(144,y+7,55),point(144,y,55)],'#fff0b7');
    s+=line(point(128,57,67),point(130,65,65),'#92bbcd',2)+cuboid(126,63,61,7,4,10);
    for(const x of [20,112]){
      const q=point(x,57,20);
      s+=`<g transform="translate(${q[0]} ${q[1]})"><ellipse rx="12" ry="17" fill="#08121b" stroke="#294151" stroke-width="4"/><ellipse rx="7.5" ry="11" fill="#91aaba"/><g data-wheel transform="rotate(0)"><path d="M0-9V9M-6 0H6M-4-6L4 6M-4 6L4-6" stroke="#e2edf3" stroke-width="1.6"/></g><ellipse rx="2.5" ry="3.5" fill="#244458"/></g>`;
    }
    return s;
  };
  const building=(x,y,w=125,d=85,h=100)=>{
    let s=cuboid(x,y,0,w,d,h);
    for(let i=0;i<3;i++){const sx=x+10+i*35;s+=poly([point(sx,y+d+.5,78),point(sx+23,y+d+.5,78),point(sx+23,y+d+.5,52),point(sx,y+d+.5,52)],'#267393');}
    s+=poly([point(x+w+.5,y+20,60),point(x+w+.5,y+65,60),point(x+w+.5,y+65,0),point(x+w+.5,y+20,0)],C.deep);
    return s;
  };
  const conveyor=(x,y,length,p)=>{
    let s=cuboid(x,y,24,length,42,9);
    for(let i=0;i<13;i++){const offset=(i*18+p*100)%length;s+=line(point(x+offset,y,34),point(x+offset,y+42,34),C.edge,3);}
    for(const dx of [12,length-20])s+=cuboid(x+dx,y+6,0,7,30,24);
    return s;
  };
  const cog=(x,y,z,p)=>{const q=point(x,y,z);return `<g transform="translate(${q[0]} ${q[1]}) scale(.866 1)"><g transform="rotate(${p*1080})">${Array.from({length:8},(_,i)=>`<rect x="-4" y="-29" width="8" height="12" rx="2" fill="${C.accent}" transform="rotate(${i*45})"/>`).join('')}<circle r="21" fill="${C.top}" stroke="${C.light}" stroke-width="2"/><circle r="8" fill="${C.deep}"/><path d="M0-16v8M0 8v8M-16 0h8M8 0h8" stroke="${C.light}" stroke-width="3"/></g></g>`;};
  const group=(id,content)=>`<g id="${id}">${content}</g>`;
  const windows=(x,y,w)=>{let result='';for(let i=0;i<3;i++)result+=cuboid(x+8+i*w/3,y,70,18,1,18).replaceAll(C.top,C.light);return result;};
  const sack=(x,y,z=0)=>{const q=point(x,y,z);return `<g transform="translate(${q[0]} ${q[1]})"><path d="M-7-31Q0-27 7-31L6-25Q18-5 10 0Q0 5-10 0Q-18-5-6-25Z" fill="#c8ae78" stroke="#edd5a5" stroke-width="1"/><path d="M-6-25H6M-6-12Q0-7 6-12" fill="none" stroke="#80683f" stroke-width="1.5"/></g>`;};
  const farm=()=>{
    let s=poly([point(-310,-125),point(-180,-125),point(-180,-5),point(-310,-5)],'#354f30');
    for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      const q=point(-299+col*20,-110+row*27);
      s+=`<g transform="translate(${q[0]} ${q[1]})"><path d="M0 0V-30M0-8Q-13-22-13-15Q-7-6 0-5M0-17Q12-30 12-22Q7-14 0-13" fill="#548844" stroke="#85b965" stroke-width="1.5"/><ellipse cx="3" cy="-21" rx="3" ry="7" fill="#e8c263"/></g>`;
    }
    return s+sack(-195,20)+sack(-217,14)+sack(-204,35);
  };
  let mounted=false, target=0, displayed=0, frame=0, previous=0, lastStage=-1;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let nodes, wheels;
  function mount(){
    if(mounted)return;
    mounted=true;
    svg.setAttribute('viewBox',window.innerWidth<=800?'0 0 600 850':'0 0 1400 800');
    svg.removeAttribute('aria-labelledby');
    const floor=poly([point(-350,-145,-5),point(430,-145,-5),point(430,215,-5),point(-350,215,-5)],'url(#campus-floor)');
    let grid='';for(let x=-330;x<430;x+=40)grid+=line(point(x,-140,-4),point(x,210,-4),'#68879a',.5,'opacity=".13"');
    for(let y=-130;y<215;y+=40)grid+=line(point(-345,y,-4),point(425,y,-4),'#68879a',.5,'opacity=".13"');
    const road=poly([point(-345,115,0),point(420,115,0),point(420,198,0),point(-345,198,0)],'#14232f')+line(point(-345,157,1),point(420,157,1),'#7c9baa',1.8,'stroke-dasharray="12 13" opacity=".45"');
    const supplier=farm();
    const warehouse=building(100,-110,115,85,105)+pallet(110,0);
    const customer=building(300,-105,80,70,80);
    const machine=cuboid(-65,-25,33,82,62,73)+cuboid(-53,-18,106,58,48,15,true);
    const label=(x,y,title)=>{const q=point(x,y);return text(q[0],q[1],title,10,C.muted);};
    const records=['PURCHASE ORDER','GOODS RECEIPT','WORK ORDER','FINISHED STOCK','SALES ORDER','CUSTOMER INVOICE','DELIVERY NOTE','PAYMENT RECEIPT'];
    const refs=['PO-1048','GRN-1048','WO-0241','ST-0241','SO-0286','INV-0286','DSP-0286','RCT-0286'];
    const details=['Maize collection','Maize received','Milling maize flour','24 flour packages','Credit sale · reserved','KSh 48,000 · unpaid','Delivered · unpaid','M-Pesa · receipt matched'];
    svg.innerHTML=`<title>One connected business journey</title><defs><linearGradient id="campus-floor" x2="0.8" y2="1"><stop stop-color="#263d4e"/><stop offset="1" stop-color="#14242f"/></linearGradient><radialGradient id="ambient"><stop stop-color="#263f51"/><stop offset="1" stop-color="#101b24"/></radialGradient></defs><rect width="1400" height="850" fill="#17232d"/>
    <g id="campus" transform="translate(40 105) scale(.86)">${floor}${grid}${road}
    ${supplier}${warehouse}${customer}
    ${label(-310,-155,'MAIZE FARM')}${label(100,-125,'WAREHOUSE')}${label(300,-120,'CUSTOMER')}
    ${conveyor(-180,0,290,0)}
    ${group('raw-goods',sack(0,0))}
    ${machine}${group('machine-wheel',cog(0,0,0,0))}
    ${group('finished-goods',carton(0,0,0,24))}
    ${group('stock-goods',carton(115,0,7,24)+carton(142,0,7,24)+carton(115,27,7,24))}
    ${group('supplier-truck',truck().replaceAll('SNAP ERP','FARM SUPPLY').replaceAll('#009bc5','#719456').replaceAll('#56d5ee','#acc784'))}
    ${group('truck',truck())}
    ${group('transfer-goods',sack(0,0))}
    ${group('truck-load',carton(0,0,0,22))}
    ${group('handover',carton(0,0,0,24))}
    ${label(-80,-65,'MAIZE MILL')}
    </g>
    <g visibility="hidden" transform="translate(35 20)"><rect width="244" height="112" rx="12" fill="#142734" stroke="#345164"/><rect x="0" y="20" width="3" height="30" rx="1.5" fill="${C.accent}"/>
    ${records.map((title,i)=>`<g id="record-${i}" opacity="0">${text(18,25,title,9,C.light)}${text(18,53,refs[i],19,C.white)}${text(18,78,details[i],10,C.muted)}</g>`).join('')}
    <path d="M18 96H225" stroke="#355060"/><path id="record-progress" d="M18 96H225" stroke="#00b7df" stroke-width="2" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/></g>
    <g id="tax-panel" transform="translate(310 20)" opacity="0">
      <rect width="655" height="112" rx="12" fill="#f4f7fa"/>
      <svg x="16" y="12" width="128" height="54" viewBox="0 125 512 240"><image href="/assets/integrations/etims.png" width="512" height="512"/></svg>
      ${text(20,92,'KRA eTIMS',10,'#344b59')}
      <path d="M162 52H255" fill="none" stroke="#8ba6b4" stroke-dasharray="5 5"/>
      <circle id="tax-packet" cx="164" cy="52" r="5" fill="#00a9d9"/>
      ${text(275,26,'INV-0286 · KSh 48,000',12,'#203342')}
      <g id="tax-sending">${text(275,52,'Submitting to eTIMS…',13,'#536d7c')}</g>
      <g id="tax-stamp" opacity="0"><rect x="270" y="36" width="206" height="32" rx="5" fill="#e4f2e9" stroke="#388358" stroke-width="2"/>${text(283,57,'✓ eTIMS VALIDATED',12,'#21663e')}</g>
      <g id="invoice-unpaid">${text(275,93,'UNPAID · CREDIT SALE',10,'#926016')}</g>
      <g id="invoice-paid" opacity="0">${text(275,93,'PAID · BALANCE KSh 0',10,'#21663e')}</g>
      ${text(521,94,'DEMO',9,'#728791')}
    </g>
    <g id="payment-panel" transform="translate(310 20)" opacity="0">
      <rect width="655" height="112" rx="12" fill="#f4f7fa"/>
      <image href="/assets/integrations/mpesa.webp" x="17" y="15" width="138" height="77" preserveAspectRatio="xMidYMid meet"/>
      <g transform="translate(182 9)"><rect width="53" height="94" rx="9" fill="#182e3c"/><rect x="5" y="13" width="43" height="66" rx="3" fill="#e8f4e7"/><path d="M18 7H35" stroke="#8ba6b4" stroke-width="2"/><circle cx="27" cy="86" r="3" fill="#8ba6b4"/><g id="payment-check" opacity="0"><path d="M14 46L23 55L39 34" fill="none" stroke="#2e9b45" stroke-width="4"/></g></g>
      ${text(263,26,'M-PESA · INV-0286',12,'#203342')}
      <g id="payment-pending">${text(263,53,'Awaiting customer payment',13,'#536d7c')}${text(263,81,'Delivered · KSh 48,000 unpaid',10,'#926016')}</g>
      <g id="payment-success" opacity="0">${text(263,53,'✓ PAYMENT RECEIVED',13,'#21663e')}${text(263,81,'RCT-0286 · Paid · Balance KSh 0',10,'#21663e')}</g>
      ${text(521,94,'DEMO',9,'#728791')}
    </g>
    <g visibility="hidden" transform="translate(36 638)">${text(0,0,'FARM',9)}<path d="M85-4H805" stroke="#355060" stroke-dasharray="4 7"/><circle id="journey-dot" cx="85" cy="-4" r="4" fill="${C.light}"/>${text(824,0,'PAID',9)}</g>`;
    wheels={delivery:svg.querySelector('#truck').querySelectorAll('[data-wheel]'),supplier:svg.querySelector('#supplier-truck').querySelectorAll('[data-wheel]')};
    nodes=Object.fromEntries(['tax-panel','tax-packet','tax-sending','tax-stamp','invoice-unpaid','invoice-paid','payment-panel','payment-check','payment-pending','payment-success','supplier-truck','campus','raw-goods','finished-goods','stock-goods','truck','transfer-goods','truck-load','handover','machine-wheel','record-progress','journey-dot',...records.map((_,i)=>`record-${i}`)].map(id=>[id,svg.querySelector(`#${id}`)]));
  }
  const phase=(t,a,b)=>smooth((t-a)/(b-a));
  const mix=(a,b,p)=>a+(b-a)*p;
  const alpha=(id,v)=>nodes[id].setAttribute('opacity',clamp(v));
  const position=(id,x,y,z=0,scale=1)=>{const q=point(x,y,z);nodes[id].setAttribute('transform',`translate(${q[0]} ${q[1]}) scale(${scale}) translate(-450 -275)`);};
  // Camera keyframes share the goods timeline: no scene cuts at stage boundaries.
  const cameraStops=[
    [-230,0,1.9],[-145,30,1.8],[-70,0,2.1],[50,0,2],
    [120,5,1.85],[140,10,1.8],[120,60,1.7],[300,60,1.9],[280,40,1.7],
  ];
  function camera(t){
    const mobile=window.innerWidth<=800;
    const i=Math.min(7,Math.floor(t)),p=smooth(t-i),a=cameraStops[i],b=cameraStops[i+1];
    const x=mix(a[0],b[0],p),y=mix(a[1],b[1],p);
    const focus=point(x,y,35);
    const scale=reduced.matches?(mobile?.75:1.15):mix(a[2],b[2],p)*(mobile?.85:1);
    const center=reduced.matches?point(50,30):focus;
    const tx=(mobile?300:950)-center[0]*scale,ty=(mobile?580:430)-center[1]*scale;
    nodes.campus.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);
    const hud=mobile?'translate(25 320) scale(.84)':'translate(730 35) scale(.9)';
    nodes['tax-panel'].setAttribute('transform',hud);nodes['payment-panel'].setAttribute('transform',hud);
    svg.setAttribute('viewBox',mobile?'0 0 600 850':'0 0 1400 800');
  }
  function draw(t){
    mount();camera(t);
    const stage=Math.min(7,Math.floor(t));
    if(stage!==lastStage){svg.setAttribute('aria-label',`Connected business journey: ${names[stage]}`);lastStage=stage;}
    // One absolute timeline preserves every handover when scrubbing backwards.
    const arrival=phase(t,.12,1.05), departure=phase(t,6.38,6.78);
    const supplierX=-310+arrival*130, truckX=55+departure*215;
    position('supplier-truck',supplierX,125,0,.72);
    position('truck',truckX,125,0,.72);
    wheels.delivery.forEach(w=>w.setAttribute('transform',`rotate(${(truckX-55)*5})`));
    wheels.supplier.forEach(w=>w.setAttribute('transform',`rotate(${(supplierX+310)*5})`));
    const unload=phase(t,1.12,1.9);
    position('raw-goods',mix(-180+18,-165,unload),mix(140,7,unload),mix(45,34,unload)+Math.sin(unload*Math.PI)*25);
    alpha('raw-goods',1-phase(t,1.85,1.95));
    const input=phase(t,1.85,2.45), output=phase(t,2.45,3.35);
    position('transfer-goods',mix(-165,-40,input),7,34);
    alpha('transfer-goods',phase(t,1.85,1.95)*(1-phase(t,2.3,2.45)));
    // Incoming shipment follows its vehicle until it is unloaded.
    if(t<1.12)position('raw-goods',supplierX+18,140,45);
    position('finished-goods',mix(22,115,output),mix(7,0,output),mix(34,7,output));
    alpha('finished-goods',phase(t,2.4,2.55)*(1-phase(t,3.25,3.4)));
    alpha('stock-goods',phase(t,3.25,3.4)*(1-phase(t,6.02,6.25)));
    const loading=phase(t,6,6.35);
    position('truck-load',mix(115,73,loading),mix(0,140,loading),mix(7,45,loading)+Math.sin(loading*Math.PI)*35);
    alpha('truck-load',phase(t,6,6.12)*(1-phase(t,6.81,6.96)));
    if(t>=6.35)position('truck-load',truckX+18,140,45);
    const handoff=phase(t,6.8,6.98);
    position('handover',mix(288,320,handoff),mix(140,0,handoff),mix(45,0,handoff)+Math.sin(handoff*Math.PI)*20);
    alpha('handover',phase(t,6.8,6.9));
    const wheel=nodes['machine-wheel'];position('machine-wheel',20,45,78,.8);
    wheel.firstElementChild?.firstElementChild?.setAttribute('transform',`rotate(${clamp((t-2)/1.3)*1080})`);
    // Overlap document states instead of replacing the world at chapter boundaries.
    for(let i=0;i<8;i++)alpha(`record-${i}`,i===0?1-phase(t,.9,1.1):phase(t,i-.1,i+.1)*(i===7?1:1-phase(t,i+.9,i+1.1)));
    const stamping=phase(t,5.38,5.65), payment=phase(t,7.42,7.72);
    alpha('tax-panel',phase(t,4.9,5.1)*(1-phase(t,6.9,7.1)));
    alpha('tax-sending',1-stamping);alpha('tax-stamp',stamping);
    nodes['tax-stamp'].setAttribute('transform',`translate(0 ${-12*(1-stamping)})`);
    nodes['tax-packet'].setAttribute('cx',String(164+phase(t,5.05,5.38)*91));
    alpha('tax-packet',1-stamping);
    alpha('invoice-unpaid',1-payment);alpha('invoice-paid',payment);
    alpha('payment-panel',phase(t,6.9,7.1));
    alpha('payment-pending',1-payment);alpha('payment-success',payment);alpha('payment-check',payment);
    nodes['record-progress'].setAttribute('stroke-dashoffset',String(1-t/8));
    nodes['journey-dot'].setAttribute('cx',String(85+t/8*720));
  }
  function animate(now){
    const dt=previous?Math.min(64,now-previous):16;previous=now;
    displayed+= (target-displayed)*(1-Math.exp(-dt/90));
    if(Math.abs(target-displayed)<.0001)displayed=target;
    draw(displayed);
    if(displayed!==target)frame=requestAnimationFrame(animate);else{frame=0;previous=0;}
  }
  window.renderJourneyChapter=(stage,progress)=>{
    if(!Number.isFinite(stage)||!Number.isFinite(progress))return;
    target=Math.max(0,Math.min(8,Math.floor(stage)+clamp(progress)));
    mount();
    if(reduced.matches){cancelAnimationFrame(frame);frame=0;previous=0;displayed=target;draw(displayed);}
    else if(!frame)frame=requestAnimationFrame(animate);
  };
  window.addEventListener('resize',()=>{if(mounted)draw(displayed);});
  window.addEventListener('pagehide',()=>cancelAnimationFrame(frame));
})();
