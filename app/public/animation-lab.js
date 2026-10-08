'use strict';
const $ = (id) => document.getElementById(id);
const heroEmbed = new URLSearchParams(window.location.search).get('hero') === '1';
const journeyEmbed = new URLSearchParams(window.location.search).get('journey') === '1';
if (heroEmbed || journeyEmbed) document.body.classList.add('hero-embed');
if (journeyEmbed) document.body.classList.add('journey-embed');
const scenes = [
 ['Supply', 'PURCHASING', 'Start at the source.', 'A supplier prepares materials and sends them to the factory. A purchase order connects the supplier, goods and expected arrival.', 'PO-1048 · Supplier order'],
 ['Receive', 'GOODS RECEIPT', 'Every arrival accounted for.', 'The delivery reaches the receiving bay. Materials are checked against the purchase order before entering production.', 'GRN-1048 · Materials received'],
 ['Produce', 'MANUFACTURING', 'Turn inputs into something useful.', 'Materials travel along the conveyor into the processing machine. The work order links the inputs to the finished output.', 'WO-0241 · Production in progress'],
 ['Pack', 'INVENTORY', 'Packed. Counted. Ready.', 'Finished goods move from the line to the warehouse. Stock availability updates before the next customer order.', 'ST-0241 · Finished stock'],
 ['Order', 'SALES', 'The customer starts the next journey.', 'A customer order arrives. Available goods are reserved and the sales team can follow the fulfilment process.', 'SO-0286 · Customer order'],
 ['Invoice', 'INVOICING', 'Give the sale a clear record.', 'The order becomes an invoice. The customer, items and amount stay attached to the same transaction.', 'INV-0286 · Invoice issued'],
 ['Payment', 'PAYMENT & DISPATCH', 'Payment confirmed. Goods released.', 'Payment approval unlocks dispatch. The warehouse loads the reserved packages into the delivery truck.', 'RCT-0286 · Payment approved'],
 ['Deliver', 'LOGISTICS', 'Complete the final handover.', 'The loaded truck travels to the customer. Delivered goods and confirmation close the fulfilment journey.', 'DSP-0286 · Delivery confirmed']
];
let time = 0, playing = false, previous = null, lastScene = -1;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
const between = (start, end) => ease((time - start) / (end - start));
function move(id, x, y, scale = 1) { $(id).setAttribute('transform', `translate(${x} ${y}) scale(${scale})`); }
function opacity(id, value) { $(id).setAttribute('opacity', String(value)); }
function updateScene(stage) {
  const scene = scenes[stage];
  $('scene-number').textContent = `${String(stage + 1).padStart(2, '0')} / 08`;
  $('module').textContent = scene[1]; $('heading').textContent = scene[2]; $('description').textContent = scene[3]; $('record').textContent = scene[4];
  if ($('scenario').value === 'maize') {
    const copy = [
      ['From harvest to the mill.', 'Maize is collected from the farm and prepared for transport to the mill. The purchase order records the supplier and expected consignment.'],
      ['Check the incoming maize.', 'The mill receives and checks the maize before recording it as raw-material stock.'],
      ['Clean. Mill. Transform.', 'Maize moves into the processing line. Cleaning and milling turn the raw grain into flour, linked to a production work order.'],
      ['Flour ready for sale.', 'Flour is packed into bags and counted into finished-goods stock.'],
      ['A flour order arrives.', 'A customer orders packaged flour. Available bags are reserved for fulfilment.'],
      ['Invoice the flour order.', 'The invoice records the customer, flour quantities and order value.'],
      ['Approve payment. Load the bags.', 'The illustrative payment is approved and flour packages are loaded for dispatch.'],
      ['Deliver to the customer.', 'The flour delivery arrives at the customer. Delivery confirmation completes the example.']
    ][stage];
    $('heading').textContent = copy[0]; $('description').textContent = copy[1];
  }
  for (const [index, button] of [...$('stages').children].entries()) button.setAttribute('aria-pressed', String(index === stage));
  $('world-title').textContent = `${$('scenario').value === 'maize' ? 'Maize flour' : 'General manufacturing'}: ${scene[0]}`;
}
function render() {
  const stage = Math.min(7, Math.floor(time / 7));
  if (stage !== lastScene) { updateScene(stage); lastScene = stage; }
  $('scrubber').value = String(time);
  $('elapsed').textContent = `00:${String(Math.floor(time)).padStart(2, '0')} / 00:56`;
  // Every pose is derived from the timeline, so replay and backward seeking stay consistent.
  move('incoming', 95 + between(0, 10) * 130, 415, .72); opacity('incoming', time < 13 ? 1 : 1 - between(13, 14));
  move('material', 228 + between(9, 14) * 87 + between(14, 20) * 168, 313 + (1 - between(9, 14)) * 72, .85);
  opacity('material', between(8, 9) * (1 - between(19, 20)));
  move('finished', 535 + between(20, 27) * 246, 313 + between(23, 27) * 42, .85); opacity('finished', between(20, 21) * (1 - between(27, 28)));
  opacity('stock', between(24, 28));
  const processing = time >= 14 && time < 24;
  $('gear').setAttribute('transform', `rotate(${processing ? (time - 14) * 150 : 0} 488 283)`);
  $('belt-lines').setAttribute('patternTransform', `translate(${processing ? (time * 35) % 24 : 0} 0)`);
  opacity('steam', processing ? .6 : 0); $('steam').setAttribute('transform', `translate(${processing ? Math.sin(time * 2) * 4 : 0} ${processing ? -Math.sin(time) * 5 : 0})`);
  opacity('document', between(28, 29)); $('document').setAttribute('transform', `translate(0 ${(1 - between(28, 29)) * 20})`);
  $('doc-label').textContent = time < 35 ? 'CUSTOMER ORDER' : time < 42 ? 'INVOICE ISSUED' : 'PAYMENT APPROVED';
  $('doc-ref').textContent = time < 35 ? 'SO-0286 · 24 packages' : time < 42 ? 'INV-0286 · Ksh 48,000' : 'RCT-0286 · Approved';
  opacity('approval', between(42, 44));
  move('outgoing', 850 + between(49, 54) * 150, 418, .78); opacity('outgoing', between(41, 42));
  move('loading', 823 + between(44, 47) * 15, 345 + between(44, 47) * 36, .8); opacity('loading', between(43, 44) * (1 - between(47, 48)));
  opacity('delivered', between(54, 55)); opacity('arrival', between(55, 56));
}
function setPlaying(value) { playing = value; previous = null; $('play').textContent = playing ? 'Ⅱ Pause story' : '▶ Play story'; $('play').setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation'); if (playing) requestAnimationFrame(tick); }
function tick(now) {
  if (!playing) return;
  if (previous !== null) time = Math.min(56, time + Math.min((now - previous) / 1000, .1) * Number($('speed').value));
  previous = now; render();
  if (time >= 56 && heroEmbed) { time = 0; previous = now; requestAnimationFrame(tick); }
  else if (time >= 56) setPlaying(false); else requestAnimationFrame(tick);
}
scenes.forEach((scene, index) => {
  const button = document.createElement('button'); const number = document.createElement('span'); number.textContent = String(index + 1).padStart(2, '0'); button.append(number, document.createTextNode(scene[0])); button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => { setPlaying(false); time = index * 7 + (reducedMotion.matches ? 6.5 : 0); render(); }); $('stages').append(button);
});
$('play').addEventListener('click', () => { if (time >= 56) time = 0; setPlaying(!playing); });
$('replay').addEventListener('click', () => { setPlaying(false); time = 0; render(); if (!reducedMotion.matches) setPlaying(true); });
$('scrubber').addEventListener('input', () => { setPlaying(false); time = Number($('scrubber').value); render(); });
$('scenario').addEventListener('change', () => { const maize = $('scenario').value === 'maize'; $('crops').toggleAttribute('hidden', !maize); $('supplier-label').textContent = maize ? 'FARM / SUPPLIER' : 'SUPPLIER'; $('material-art').setAttribute('href', maize ? '#sack' : '#box'); lastScene = -1; render(); });
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) setPlaying(false); });
document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });
render(); // Deliberately waits for Play; reduced-motion users can inspect static stages.

if (heroEmbed && !reducedMotion.matches) setPlaying(true);

window.addEventListener('message', (event) => {
  if (!journeyEmbed || event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'snaperp-journey') return;
  const requestedTime = event.data.time;
  if (typeof requestedTime !== 'number' || !Number.isFinite(requestedTime)) return;
  setPlaying(false);
  const boundedTime = Math.max(0, Math.min(56, requestedTime));
  const chapter = Math.min(7, Math.floor(boundedTime / 7));
  const chapterProgress = Math.min(1, (boundedTime - chapter * 7) / 7);
  window.renderJourneyChapter(chapter, reducedMotion.matches ? 1 : chapterProgress);
});

if (journeyEmbed) window.renderJourneyChapter(0, reducedMotion.matches ? 1 : 0);
