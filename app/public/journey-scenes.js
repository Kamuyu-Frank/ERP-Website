/* Isometric scene renderer. Positions use a shared x/y/z world; SVG stays crisp on mobile. */
(() => {
  const svg = document.getElementById('world');
  const C = { bg:'#101b24',floor:'#17232d',top:'#526e80',left:'#2a4253',right:'#203342',edge:'#6c8b9e',accent:'#00a9d9',light:'#85dfff',white:'#f2f6f8',muted:'#abbcc7',deep:'#0b141c' };
  const names=['Purchase','Receive','Process','Stock','Order','Invoice','Payment','Delivery'];
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
  const wheel=(x,y,z,angle)=>{const p=point(x,y,z);return `<g transform="translate(${p[0]} ${p[1]})"><ellipse rx="10" ry="14" fill="${C.deep}" stroke="${C.edge}" stroke-width="2"/><g transform="rotate(${angle})"><path d="M-5 0h10M0-7v14" stroke="${C.muted}" stroke-width="2"/></g><ellipse rx="3" ry="4" fill="${C.accent}"/></g>`;};
  const truck=(x,y,p,loaded=false)=>{
    let s=shadow(x+55,y+26,100)+cuboid(x,y,23,130,55,12);
    s+=cuboid(x+88,y,35,42,55,44,true);
    s+=poly([point(x+132,y+7,72),point(x+132,y+48,72),point(x+132,y+48,51),point(x+132,y+7,51)],C.light);
    s+=cuboid(x,y,36,84,55,loaded?18:54);
    if(loaded)for(let i=0;i<2;i++)s+=carton(x+8+i*33,y+7,55,24);
    s+=wheel(x+18,y+57,18,p*720)+wheel(x+104,y+57,18,p*720)+line(point(x+5,y+56,60),point(x+76,y+56,60),C.accent,3);
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
  const badge=(x,y,label,p)=>`<g opacity="${smooth(p)}" transform="translate(0 ${14*(1-smooth(p))})"><rect x="${x}" y="${y}" width="205" height="36" rx="18" fill="#007ba1"/>${text(x+17,y+23,label,10,C.white)}</g>`;
  const flow=(a,b,p)=>{const q=[a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p];return line(a,b,C.accent,2,'stroke-dasharray="5 8" opacity=".6"')+`<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="${C.light}" filter="url(#iso-glow)"/>`;};
  const check=(x,y,p)=>`<g opacity="${smooth(p)}"><circle cx="${x}" cy="${y}" r="25" fill="#007ba1"/><path d="M${x-12} ${y}l9 10 18-21" fill="none" stroke="${C.white}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  // Floating panels have thickness and a consistent isometric projection.
  const panel=(x,y,label,ref,p,approved=false)=>{
    const z=50+smooth(p)*12;
    let s=shadow(x+55,y+65,100)+cuboid(x,y,z,125,155,7);
    const a=point(x,y,z+8);
    s+=`<g transform="matrix(.866 .5 -.866 .5 ${a[0]} ${a[1]})"><rect width="125" height="155" rx="4" fill="#d9eaf1"/><rect x="12" y="13" width="5" height="20" fill="${C.accent}"/>${text(23,27,label,8,C.right)}${text(12,47,ref,7,C.left)}<path d="M12 60h99" stroke="#91b3c5"/>${[0,1,2,3].map((i)=>`<g opacity="${clamp((p-i*.12)*5)}"><rect x="12" y="${73+i*14}" width="${75-i*8}" height="3" fill="#91b3c5"/><rect x="100" y="${73+i*14}" width="10" height="3" fill="${C.accent}"/></g>`).join('')}${approved?'<path d="M76 123l9 9 19-22" fill="none" stroke="#007ba1" stroke-width="5"/>':''}</g>`;
    return s;
  };
  const phone=(x,y,p)=>{
    const z=20+p*8;const a=point(x,y,z+7);
    return shadow(x+35,y+65,80)+cuboid(x,y,z,85,145,7)+`<g transform="matrix(.866 .5 -.866 .5 ${a[0]} ${a[1]})"><rect width="85" height="145" rx="12" fill="${C.deep}" stroke="${C.edge}" stroke-width="3"/><rect x="8" y="20" width="69" height="105" rx="5" fill="${C.left}"/><path d="M30 10h25" stroke="${C.muted}" stroke-width="3"/>${text(16,37,'ORDER',8,C.white)}<rect x="17" y="48" width="52" height="44" rx="4" fill="#007ba1"/><path d="M34 59l10-6 11 6v18l-11 6-10-6z" fill="${C.light}"/><rect x="16" y="102" width="53" height="13" rx="3" fill="${C.accent}"/><circle cx="43" cy="135" r="4" fill="${C.edge}"/></g>`;
  };
  const base=()=>{
    let s='<defs><radialGradient id="iso-floor"><stop stop-color="#263d50"/><stop offset="1" stop-color="#101b24"/></radialGradient><filter id="iso-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="900" height="520" fill="#101b24"/><ellipse cx="450" cy="310" rx="420" ry="210" fill="url(#iso-floor)"/>';
    s+=cuboid(-205,-170,-12,410,340,12).replaceAll(C.top,'#203342').replaceAll(C.left,'#17232d').replaceAll(C.right,'#101b24');
    for(let i=-170;i<200;i+=35)s+=line(point(i,-165,.1),point(i,165,.1),C.edge,.5,'opacity=".18"');
    for(let i=-140;i<170;i+=35)s+=line(point(-200,i,.1),point(200,i,.1),C.edge,.5,'opacity=".18"');
    return s;
  };
  const scenes=[
    p=>{let s=building(-170,-125,95,70,85)+panel(65,-105,'PURCHASE ORDER','PO-1048',p);for(let i=0;i<3;i++)s+=carton(-150+i*30,-35,0,23);s+=flow(point(-95,30,12),point(100,30,12),p)+truck(-145+p*135,65,p);return s+badge(575,95,'SUPPLIER CONFIRMED',p*2);},
    p=>building(-10,-115,135,90,115)+truck(-190,75,0)+pallet(70,25)+carton(-55+smooth(p)*140,90-smooth(p)*48,30+Math.sin(p*Math.PI)*30)+badge(545,90,'GOODS RECEIVED',(p-.65)*3),
    p=>{let s=conveyor(-175,15,335,p);const inputX=-160+clamp(p/.55)*145;s+=carton(inputX,23,34,24);s+=cuboid(-10,5,34,90,62,85)+cuboid(5,12,119,55,45,25,true)+cog(80,44,85,p);if(p>.45)s+=carton(85+smooth((p-.45)/.55)*70,23,34,25);return s+badge(565,100,'PRODUCTION RUN',p);},
    p=>{let s=pallet(-60,-25)+pallet(60,5)+conveyor(-170,80,160,p);for(let i=0;i<6;i++){const reveal=smooth((p-i*.1)*3);s+=`<g opacity="${reveal}">${carton(-55+(i%2)*30,-20+Math.floor(i/2)%2*30,6+Math.floor(i/4)*28+(1-reveal)*55,26)}</g>`;}s+=carton(-145+smooth(p)*80,85,34,25)+cuboid(100,-110,0,8,110,145)+cuboid(35,-110,65,80,110,5)+cuboid(35,-110,130,80,110,5);return s+badge(540,100,'FINISHED STOCK +24',p);},
    p=>phone(-145,10,p)+flow(point(-60,25,30),point(45,-5,70),p)+`<g opacity="${smooth(p*2)}">${panel(55,-60,'SALES ORDER','SO-0286',p)}</g>`+carton(80,115,0,36)+badge(565,95,'24 PACKAGES RESERVED',(p-.45)*2),
    p=>panel(-80,-70,'CUSTOMER INVOICE','INV-0286',p)+`<g opacity="${smooth((p-.4)*3)}">${panel(110,-100,'RECORD COPY','KSH 48,000',p)}</g>`+flow(point(5,80,65),point(125,55,70),p)+badge(560,105,'INVOICE ISSUED',(p-.5)*3),
    p=>phone(-155,35,p)+panel(55,-75,'PAYMENT RECEIPT','RCT-0286',p,true)+flow(point(-65,40,50),point(60,-30,75),p)+check(395,130,(p-.35)*3)+badge(550,95,'PAYMENT APPROVED',(p-.5)*3),
    p=>{let s=building(95,-125,85,80,100);s+=flow(point(-180,85,1),point(155,85,1),p)+truck(-190+smooth(p/.8)*250,70,p,true);if(p>.72)s+=`<g opacity="${smooth((p-.72)*4)}">${carton(130,25,0,30)}</g>`;return s+badge(555,90,'DELIVERY CONFIRMED',(p-.82)*6);}
  ];
  let lastStage=-1,lastProgress=-1;
  window.renderJourneyChapter=(stage,progress)=>{
    if(!Number.isFinite(stage)||!Number.isFinite(progress))return;
    stage=Math.max(0,Math.min(7,Math.floor(stage)));progress=clamp(progress);
    if(stage===lastStage&&progress===lastProgress)return;
    svg.setAttribute('viewBox','0 0 900 520');svg.removeAttribute('aria-labelledby');svg.setAttribute('aria-label',`Isometric ${names[stage].toLowerCase()} animation`);
    svg.innerHTML=`<title>${names[stage]} · isometric business workflow</title>${base()}${scenes[stage](progress)}${text(42,45,`${String(stage+1).padStart(2,'0')} / ${names[stage].toUpperCase()}`,12)}${text(42,488,'SNAP ERP / CONNECTED BUSINESS',9)}<rect x="650" y="481" width="200" height="2" fill="#3b4d5a"/><rect x="650" y="481" width="${200*progress}" height="2" fill="#00a9d9"/>`;
    lastStage=stage;lastProgress=progress;
  };
})();
