/* Persistent SVG landscape. All business action is a reversible function of scroll progress. */
(() => {
  const svg = document.getElementById('world');
  const names = ['Supplier', 'Transport', 'Receive', 'Process', 'Stock', 'Order', 'Load', 'Invoice', 'eTIMS', 'Deliver', 'Pay', 'Receipt'];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = v => Math.max(0, Math.min(1, v));
  const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const phase = (t, a, b) => ease((t - a) / (b - a));
  const mix = (a, b, p) => a + (b - a) * p;
  const roadStops = [[0, 520], [350, 520], [760, 420], [1120, 420], [1510, 510], [1840, 510], [2230, 350], [2510, 350], [2870, 510], [3300, 510]];
  function roadAt(y) {
    let i = 0;
    while (i < roadStops.length - 2 && y > roadStops[i + 1][0]) i++;
    const [ya, xa] = roadStops[i], [yb, xb] = roadStops[i + 1];
    const p = clamp((y - ya) / (yb - ya));
    const slope = (xb - xa) * 6 * p * (1 - p) / (yb - ya);
    return { x: mix(xa, xb, ease(p)), y, angle: -Math.atan(slope) * 180 / Math.PI };
  }
  const text = (x, y, value, size = 13, fill = '#bdd0d8', extra = '') => `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" font-family="system-ui,sans-serif" ${extra}>${value}</text>`;
  const group = (id, markup, extra = '') => `<g id="${id}" ${extra}>${markup}</g>`;
  const sack = '<path d="M-8-19Q0-16 8-19L7-13Q19 12 10 17Q0 22-10 17Q-19 12-7-13Z" fill="#d8bd86" stroke="#f1dcad"/><path d="M-7-13H7M-8 5Q0 11 8 5" fill="none" stroke="#947741" stroke-width="2"/>';
  const pack = '<path d="M-14-13L8-17L17-10V15L-5 19L-14 12Z" fill="#e3e6dc" stroke="#8ba1a6"/><path d="M-14-13L-5-6L17-10M-5-6V19" fill="none" stroke="#fff"/><path d="M-5 2L17-2V7L-5 11Z" fill="#208b9d"/><text x="-1" y="6" font-family="system-ui" font-size="5" fill="white">GOODS</text>';
  function tree(x, y, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cy="14" rx="23" ry="13" fill="#0d1c20" opacity=".35"/><path d="M0 10V-19" stroke="#8a7960" stroke-width="6"/><circle cy="-18" r="24" fill="#345f4c"/><circle cx="-9" cy="-27" r="15" fill="#4d775b"/><circle cx="9" cy="-21" r="14" fill="#406f51"/></g>`;
  }
  function person(id, color = '#e6ac51', carrying = false) {
    return group(id, `<ellipse cy="24" rx="15" ry="6" fill="#07171d" opacity=".4"/>
      <g id="${id}-left"><path d="M-5 5L-7 23" stroke="#234152" stroke-width="7" stroke-linecap="round"/></g>
      <g id="${id}-right"><path d="M5 5L7 23" stroke="#234152" stroke-width="7" stroke-linecap="round"/></g>
      <rect x="-10" y="-17" width="20" height="27" rx="7" fill="${color}"/>
      <path d="M-6-14V6M6-14V6" stroke="#eee9b9" stroke-width="2"/>
      <path d="M-10-9L-16 5M10-9L16 5" fill="none" stroke="#bd8c64" stroke-width="6" stroke-linecap="round"/>
      <circle cy="-22" r="9" fill="#bd8c64"/><path d="M-10-23Q-9-36 0-34Q9-34 10-23Z" fill="#f0c466"/>
      ${carrying ? `<g id="${id}-cargo" transform="translate(0 7) scale(.65)">${sack}</g>` : ''}`);
  }
  function vehicle(id, green = false) {
    const body = green ? '#678e63' : '#0796b0';
    return group(id, `<ellipse cy="12" rx="48" ry="88" fill="#06171e" opacity=".35"/>
      <rect x="-36" y="-53" width="9" height="25" rx="4" fill="#08131c"/><rect x="27" y="-53" width="9" height="25" rx="4" fill="#08131c"/>
      <rect x="-37" y="43" width="10" height="24" rx="4" fill="#08131c"/><rect x="27" y="43" width="10" height="24" rx="4" fill="#08131c"/>
      <rect x="-31" y="-76" width="62" height="115" rx="5" fill="#8098a6"/>
      <rect x="-29" y="-78" width="58" height="108" rx="4" fill="url(#cargo-metal)"/>
      ${Array.from({ length: 10 }, (_, i) => `<path d="M-25 ${-69 + i * 9}H25" stroke="#a8becb" stroke-width="1"/>`).join('')}
      <path d="M-29 31V70Q-27 81-17 83H17Q27 81 29 70V42L22 30Z" fill="${body}" stroke="#82ced9"/>
      <path d="M-23 47H23L20 65H-20Z" fill="#143c50"/>
      <path d="M-20 49H20L17 55H-17Z" fill="#8bcad9"/>
      <path d="M-25 70H25M-11 78H11" stroke="#c0d9dd" stroke-width="3"/>
      <rect x="-28" y="71" width="10" height="6" rx="2" fill="#fff0bd"/><rect x="18" y="71" width="10" height="6" rx="2" fill="#fff0bd"/>
      <path d="M-29 47H-39M29 47H39" stroke="#a2b6c1" stroke-width="3"/>
      <rect x="-42" y="43" width="7" height="12" rx="2" fill="#213d4b"/><rect x="35" y="43" width="7" height="12" rx="2" fill="#213d4b"/>
      <rect x="-29" y="-21" width="58" height="20" fill="${body}"/>
      ${text(0, -7, green ? 'SUPPLY' : 'SNAP ERP', 9, '#fff', 'text-anchor="middle" font-weight="700"')}
      <path d="M-21 83L-29 120M21 83L29 120" stroke="#ffeeae" stroke-width="12" opacity=".055"/>`);
  }
  function building(x, y, w, h, title, interior = '') {
    return `<g transform="translate(${x} ${y})"><rect x="9" y="12" width="${w}" height="${h}" rx="9" fill="#0a1b23" opacity=".45"/>
      <rect width="${w}" height="${h}" rx="7" fill="#304957" stroke="#60808e" stroke-width="2"/>
      <path d="M0 25V0H${w}V25" fill="#5e7987"/>
      ${text(16, 17, title, 10, '#e2eef1', 'letter-spacing="2"')}
      <rect x="12" y="36" width="${w - 24}" height="${h - 48}" rx="3" fill="#203540"/>
      ${interior}</g>`;
  }
  function shelf(x, y) {
    return `<g transform="translate(${x} ${y})"><rect width="220" height="62" rx="3" fill="#172b35" stroke="#66808b"/>
    <path d="M0 25H220M0 56H220M8 0V62M212 0V62" stroke="#a5a68c" stroke-width="4"/></g>`;
  }
  const belt = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#142a36" stroke="#7695a2" stroke-width="4"/>${Array.from({ length: Math.floor(h / 13) }, (_, i) => `<path d="M${x + 5} ${y + 7 + i * 13}H${x + w - 5}" stroke="#4d6978" stroke-width="3"/>`).join('')}`;
  let mounted = false, target = 0, displayed = 0, frame = 0, previous = 0, lastStage = -1;
  let nodes;
  const ids = ['campus', 'supplier-truck', 'truck', 'farm-worker', 'receiver', 'stock-worker', 'loader', 'customer-worker', 'raw-goods', 'finished-goods', 'truck-load', 'handover', 'machine-wheel', 'order-call', 'order-signal', 'invoice-panel', 'tax-panel', 'tax-packet', 'tax-sending', 'tax-stamp', 'invoice-unpaid', 'payment-panel', 'payment-check', 'payment-pending', 'payment-success', 'receipt-panel', 'receipt-lines', ...Array.from({ length: 8 }, (_, i) => `stock-${i}`)];
  const workerIds = ['farm-worker', 'receiver', 'stock-worker', 'loader', 'customer-worker'];
  function mount() {
    if (mounted) return;
    mounted = true;
    svg.removeAttribute('aria-labelledby');
    let road = '';
    for (let y = 0; y <= 3300; y += 10) { const p = roadAt(y); road += `${y ? 'L' : 'M'}${p.x.toFixed(2)} ${y} `; }
    let materials = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) materials += `<g transform="translate(${105 + c * 60} ${135 + r * 60})"><path d="M-21 18H22M-21 23H22" stroke="#9b8969" stroke-width="4"/>${pack}</g>`;
    let trees = '';
    for (let i = 0; i < 30; i++) { const y = 100 + i * 108; trees += tree(i % 2 ? 40 : 970, y, .7 + (i % 3) * .15); }
    const invoice = `<rect width="520" height="185" rx="10" fill="#f0f4f4"/>${text(24, 30, 'CUSTOMER INVOICE', 12, '#476472', 'letter-spacing="2"')}${text(24, 62, 'INV-0286', 25, '#193340')}${text(24, 91, '24 packages · Credit sale', 13, '#59717d')}<path d="M24 111H490" stroke="#beced3"/>${text(24, 141, 'TOTAL  KSh 48,000', 18, '#193340')}<g id="invoice-unpaid">${text(340, 141, 'UNPAID', 13, '#997136', 'font-weight="700"')}</g>${text(24, 166, 'ILLUSTRATIVE RECORD', 9, '#71858b')}`;
    svg.innerHTML = `<title>From the supplier to the final receipt</title><defs><linearGradient id="cargo-metal" x2="1" y2="0"><stop stop-color="#c3d2db"/><stop offset=".5" stop-color="#edf3f4"/><stop offset="1" stop-color="#b0c3ce"/></linearGradient></defs>
    <rect width="1600" height="1400" fill="#17232d"/>
    <g id="campus"><rect x="0" y="-180" width="1010" height="3650" rx="80" fill="#1b3035"/>
      <path d="${road}" fill="none" stroke="#0e2029" stroke-width="132"/><path d="${road}" fill="none" stroke="#49606a" stroke-width="118"/><path d="${road}" fill="none" stroke="#263944" stroke-width="110"/>
      <path d="${road}" fill="none" stroke="#c7be92" stroke-width="2" stroke-dasharray="18 20"/>
      ${trees}
      <path d="M345 275H520M420 925H615M510 1580H650M510 2960H640" fill="none" stroke="#52666a" stroke-width="48"/>
      <rect x="65" y="92" width="272" height="264" rx="14" fill="#34454b" stroke="#667d85"/>${materials}
      ${building(95, 385, 190, 95, 'SUPPLIER COLLECTION', `<path d="M20 45H165M20 68H165" stroke="#678477" stroke-width="3"/>`)}
      ${text(75, 69, '01 / SUPPLIER', 17, '#dae5d7', 'letter-spacing="3"')}
      <g transform="translate(340 250)">${sack}</g><g transform="translate(355 280)">${sack}</g>
      ${building(610, 755, 300, 425, 'FACTORY / PROCESSING', `${belt(32, 80, 58, 305)}<rect x="115" y="135" width="147" height="151" rx="12" fill="#66818b"/><rect x="130" y="150" width="117" height="75" rx="5" fill="#14323f"/><path d="M170 70V135M206 70V135" stroke="#8ca5ac" stroke-width="18"/>${text(137, 254, 'LINE / 01', 13, '#ecf0e9')}<path d="M90 345H252V408" fill="none" stroke="#698692" stroke-width="30"/>`)}
      <path d="M862 1163V1320" stroke="#66828e" stroke-width="30"/><path d="M862 1163V1320" stroke="#263f4c" stroke-width="20" stroke-dasharray="6 6"/>
      ${building(635, 1310, 290, 360, 'FINISHED GOODS', shelf(34, 70) + shelf(34, 166) + `<path d="M0 286H68" stroke="#a6b5b6" stroke-width="24"/>`)}
      ${building(640, 1745, 270, 130, 'SALES DESK', '<rect x="30" y="65" width="170" height="35" rx="5" fill="#8d9c92"/><rect x="115" y="44" width="50" height="32" rx="4" fill="#88b6bf"/>')}
      ${group('order-call', `<rect x="0" y="0" width="46" height="74" rx="8" fill="#dae4e4"/><rect x="5" y="10" width="36" height="50" rx="3" fill="#237b76"/><path d="M13 22Q9 43 29 49L34 40L25 35L20 38L18 31L21 28Z" fill="#ecf4ed"/><g id="order-signal"><path d="M-9 15Q-24 35-9 54M55 15Q70 35 55 54" fill="none" stroke="#75d5b6" stroke-width="3"/></g>`, 'transform="translate(690 1803)"')}
      ${text(280, 2160, 'DISPATCH ROUTE', 12, '#9db3b9', 'letter-spacing="3"')}
      ${building(635, 2830, 280, 225, 'CUSTOMER / RETAIL STORE', '<path d="M15 40H264" stroke="#83a89b" stroke-width="19"/><rect x="32" y="77" width="89" height="91" fill="#75939c"/><rect x="159" y="77" width="89" height="91" fill="#172e3a"/><path d="M180 80V162M159 118H245" stroke="#496772" stroke-width="4"/>')}
      ${vehicle('supplier-truck', true)}${vehicle('truck')}
      ${person('farm-worker', '#bba55d', true)}${person('receiver', '#d4a456', true)}${person('stock-worker', '#70aab4')}${person('loader', '#d4a456')}${person('customer-worker', '#739e8b')}
      ${group('raw-goods', sack)}${group('finished-goods', pack)}${group('truck-load', pack)}${group('handover', pack)}
      ${Array.from({ length: 8 }, (_, i) => group(`stock-${i}`, pack, `transform="translate(${690 + (i % 4) * 47} ${1407 + Math.floor(i / 4) * 96})"`)).join('')}
      ${group('machine-wheel', '<circle r="27" fill="#294754" stroke="#8cc0c8" stroke-width="5"/><path d="M0-23V23M-23 0H23M-16-16L16 16M-16 16L16-16" stroke="#91b8bf" stroke-width="5"/><circle r="8" fill="#122b38"/>')}
    </g>
    ${group('invoice-panel', invoice)}
    ${group('tax-panel', `<rect width="520" height="185" rx="10" fill="#f0f4f4"/><svg x="24" y="15" width="136" height="65" viewBox="0 125 512 240"><image href="/assets/integrations/etims.png" width="512" height="512"/></svg>${text(24, 112, 'KRA eTIMS', 15, '#193340')}${text(24, 143, 'INV-0286', 12, '#59717d')}<path d="M182 66H236" stroke="#8da8b0" stroke-dasharray="5 5"/><circle id="tax-packet" cy="66" r="5" fill="#2e9daa"/><g id="tax-sending">${text(258, 66, 'Submitting invoice…', 15, '#59717d')}</g><g id="tax-stamp"><rect x="246" y="36" width="250" height="62" rx="6" fill="#e4efe6" stroke="#447956" stroke-width="3"/>${text(270, 62, '✓ eTIMS VALIDATED', 16, '#315e3f', 'font-weight="700"')}${text(270, 82, 'Electronic validation', 11, '#447956')}</g>${text(256, 132, 'UNPAID · CREDIT SALE', 12, '#997136')}${text(24, 166, 'ILLUSTRATIVE SUBMISSION', 9, '#71858b')}`)}
    ${group('payment-panel', `<rect width="520" height="185" rx="10" fill="#f0f4f4"/><image href="/assets/integrations/mpesa.webp" x="22" y="12" width="143" height="83"/><g transform="translate(70 100)"><rect width="38" height="66" rx="7" fill="#193744"/><rect x="4" y="9" width="30" height="45" rx="3" fill="#e4f2df"/><g id="payment-check"><path d="M9 30L17 37L30 19" fill="none" stroke="#3b8f48" stroke-width="3"/></g></g>${text(204, 32, 'M-PESA PAYMENT', 14, '#193340', 'letter-spacing="1"')}<g id="payment-pending">${text(204, 76, 'Awaiting customer', 20, '#476472')}${text(204, 108, 'KSh 48,000 · Delivered', 14, '#59717d')}</g><g id="payment-success">${text(204, 76, '✓ Payment received', 20, '#315e3f')}${text(204, 108, 'KSh 48,000 matched', 14, '#315e3f')}</g>${text(204, 154, 'ILLUSTRATIVE PAYMENT', 9, '#71858b')}`)}
    ${group('receipt-panel', `<path d="M0 0H520V180L507 185L494 180L481 185L468 180L455 185H0Z" fill="#f0f4f4"/>${text(24, 30, 'PAYMENT RECEIPT', 12, '#476472', 'letter-spacing="2"')}${text(24, 62, 'RCT-0286', 25, '#193340')}<g id="receipt-lines">${text(24, 91, 'Invoice INV-0286 · M-Pesa', 14, '#59717d')}<path d="M24 111H490" stroke="#beced3"/>${text(24, 141, 'BALANCE  KSh 0', 19, '#315e3f')}${text(402, 141, '✓ PAID', 16, '#315e3f', 'font-weight="700"')}</g>${text(24, 167, 'DELIVERED. PAID. RECORDED.', 10, '#71858b')}`)}
    `;
    nodes = Object.fromEntries([...ids, ...workerIds.flatMap(id => [`${id}-left`, `${id}-right`, `${id}-cargo`])].map(id => [id, svg.querySelector(`#${id}`)]));
  }
  const alpha = (id, value) => nodes[id]?.setAttribute('opacity', clamp(value));
  const move = (id, x, y, angle = 0) => nodes[id]?.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`);
  function worker(id, x, y, activity) {
    move(id, x, y);
    const stride = Math.sin(activity * Math.PI * 6) * 22;
    nodes[`${id}-left`]?.setAttribute('transform', `rotate(${stride})`);
    nodes[`${id}-right`]?.setAttribute('transform', `rotate(${-stride})`);
  }
  const cameraY = [220, 360, 890, 995, 1420, 1470, 1550, 1550, 1550, 1650, 2940, 2940, 2940];
  function draw(t) {
    mount();
    const stage = Math.min(11, Math.floor(t));
    if (stage !== lastStage) { svg.setAttribute('aria-label', `Supplier to receipt: ${names[stage]}`); lastStage = stage; }
    const collect = phase(t, .38, .94), arriving = phase(t, 1, 1.94);
    const inbound = roadAt(mix(40, 295, phase(t, 0, .38)) + 615 * arriving);
    const outbound = roadAt(mix(1580, 2960, phase(t, 9.02, 9.73)));
    move('supplier-truck', inbound.x, inbound.y, inbound.angle);
    move('truck', outbound.x, outbound.y, outbound.angle);
    worker('farm-worker', mix(350, 487, collect), mix(280, 240, collect), collect);
    alpha('farm-worker-cargo', 1 - phase(t, .84, .96));
    const unload = phase(t, 2.08, 2.83);
    worker('receiver', mix(453, 662, unload), mix(885, 930, unload), unload);
    alpha('receiver-cargo', 1 - phase(t, 2.72, 2.86));
    const milling = phase(t, 3.02, 3.62);
    move('raw-goods', 671, mix(930, 1070, milling));
    alpha('raw-goods', phase(t, 2.72, 2.86) * (1 - phase(t, 3.5, 3.65)));
    move('machine-wheel', 799, 947, phase(t, 3, 4) * 1440);
    const flour = phase(t, 3.55, 4.18);
    move('finished-goods', mix(821, 862, phase(t, 3.55, 3.78)), mix(1100, 1345, flour));
    alpha('finished-goods', phase(t, 3.55, 3.68) * (1 - phase(t, 4.08, 4.22)));
    const stacking = phase(t, 4.05, 4.9);
    worker('stock-worker', mix(860, 744, stacking), mix(1358, 1480, stacking), stacking);
    const loading = phase(t, 6.06, 6.88);
    for (let i = 0; i < 8; i++) {
      const placed=phase(t,4.05+i*.08,4.32+i*.08);
      move(`stock-${i}`,mix(862,690+(i%4)*47,placed),mix(1345,1407+Math.floor(i/4)*96,placed));
      alpha(`stock-${i}`,phase(t,4.05+i*.08,4.12+i*.08)*(1-phase(t,6.05+i*.08,6.28+i*.08)));
    }
    worker('loader', mix(674, 555, loading), mix(1590, 1532, loading), loading);
    move('truck-load', mix(674, 510, loading), mix(1590, 1532, loading));
    alpha('truck-load', phase(t, 6.02, 6.16) * (1 - phase(t, 6.85, 6.98)));
    const handoff = phase(t, 9.75, 9.98);
    worker('customer-worker', mix(550, 670, handoff), mix(2920, 2960, handoff), handoff);
    move('handover', mix(550, 670, handoff), mix(2926, 2966, handoff));
    alpha('handover', phase(t, 9.75, 9.83));
    const call = phase(t, 5, 5.3) * (1 - phase(t, 5.75, 6));
    nodes['order-call'].setAttribute('transform', `translate(690 1803) rotate(${Math.sin((t - 5) * 28) * call * 7} 23 37)`);
    alpha('order-signal', call);
    const stamp = phase(t, 8.35, 8.66), paid = phase(t, 10.35, 10.75);
    alpha('invoice-panel', phase(t, 6.92, 7.08) * (1 - phase(t, 7.92, 8.08)));
    alpha('invoice-unpaid', 1 - paid);
    alpha('tax-panel', phase(t, 7.92, 8.08) * (1 - phase(t, 8.92, 9.08)));
    alpha('tax-sending', 1 - stamp); alpha('tax-stamp', stamp); alpha('tax-packet', 1 - stamp);
    nodes['tax-stamp'].setAttribute('transform', `translate(0 ${-18 * (1 - stamp)})`);
    nodes['tax-packet'].setAttribute('cx', 182 + phase(t, 8.08, 8.35) * 54);
    alpha('payment-panel', phase(t, 9.94, 10.08) * (1 - phase(t, 10.94, 11.08)));
    alpha('payment-pending', 1 - paid); alpha('payment-success', paid); alpha('payment-check', paid);
    alpha('receipt-panel', phase(t, 10.94, 11.15)); alpha('receipt-lines', phase(t, 11.15, 11.65));
    const mobile = window.innerWidth <= 800;
    let cy = mix(cameraY[stage], cameraY[stage + 1], ease(t - stage));
    if (stage === 9) cy = mix(1650, 2940, phase(t, 9.02, 9.73));
    // Reduced motion keeps a fixed scale and steps the camera instead of panning.
    if (reduced.matches) cy = cameraY[Math.min(12, stage + 1)];
    const scale = mobile ? .84 : 1.03;
    const focusX = stage === 0 ? 400 : stage === 1 ? mix(400, 590, ease(t - 1)) : 630;
    const tx = (mobile ? 300 : 1010) - focusX * scale;
    const ty = (mobile ? 565 : 470) - cy * scale;
    nodes.campus.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale})`);
    const hud = mobile ? 'translate(28 315) scale(1.04)' : 'translate(750 28) scale(1.02)';
    for (const id of ['invoice-panel', 'tax-panel', 'payment-panel', 'receipt-panel']) nodes[id].setAttribute('transform', hud);
    svg.setAttribute('viewBox', mobile ? '0 0 600 850' : '0 0 1400 800');
  }
  function animate(now) {
    const dt = previous ? Math.min(64, now - previous) : 16; previous = now;
    displayed += (target - displayed) * (1 - Math.exp(-dt / 95));
    if (Math.abs(target - displayed) < .0001) displayed = target;
    draw(displayed);
    if (displayed !== target) frame = requestAnimationFrame(animate); else { frame = 0; previous = 0; }
  }
  window.renderJourneyChapter = (stage, progress) => {
    if (!Number.isFinite(stage) || !Number.isFinite(progress)) return;
    target = Math.max(0, Math.min(12, Math.floor(stage) + clamp(progress)));
    if (reduced.matches) { cancelAnimationFrame(frame); frame = 0; previous = 0; displayed = target; draw(displayed); }
    else if (!frame) frame = requestAnimationFrame(animate);
  };
  window.addEventListener('resize', () => { if (mounted) draw(displayed); });
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
})();
