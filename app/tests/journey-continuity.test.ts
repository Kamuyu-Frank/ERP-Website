import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/journey-scenes.js', import.meta.url), 'utf8');
function player(reduced = true, width = 1400) {
  const nodes = new Map<string, any>();
  const callbacks = new Map<number, (time: number) => void>();
  let sequence = 0, mounts = 0, now = 0;
  function node(id: string): any {
    if (!nodes.has(id)) nodes.set(id, {
      attributes: {} as Record<string, string>,
      setAttribute(key: string, value: unknown) { this.attributes[key] = String(value); },
      removeAttribute(key: string) { delete this.attributes[key]; },
      querySelector(selector: string) { return node(selector); },
      querySelectorAll() { return [node('wheel-one'), node('wheel-two')]; },
      get firstElementChild() { return node(`${id}-child`); },
      set innerHTML(value: string) { expect(value).not.toContain('NaN'); mounts++; },
    });
    return nodes.get(id);
  }
  const window: any = { innerWidth: width, matchMedia: () => ({ matches: reduced }), addEventListener() {} };
  runInNewContext(source, {
    document: { getElementById: () => node('svg') }, window,
    requestAnimationFrame(callback: (time: number) => void) { callbacks.set(++sequence, callback); return sequence; },
    cancelAnimationFrame(id: number) { callbacks.delete(id); },
  });
  function settle() {
    let ticks = 0;
    while (callbacks.size && ticks++ < 200) {
      const pending = [...callbacks.values()]; callbacks.clear(); now += 16;
      pending.forEach(callback => callback(now));
    }
    expect(callbacks.size).toBe(0);
  }
  function pose(time: number) {
    window.renderJourneyChapter(Math.min(11, Math.floor(time)), time === 12 ? 1 : time % 1);
    settle();
    return JSON.stringify([...nodes].map(([id, element]) => [id, element.attributes]));
  }
  return { pose, nodes, window, callbacks, settle, get mounts() { return mounts; } };
}

test('forward and backward seeking produce the same poses without replacing the scene', () => {
  const p = player();
  const times = [0, .6, 1.5, 2.4, 3.4, 4.5, 5.5, 6.8, 7.4, 8.6, 9.4, 10.7, 11.5, 12];
  const poses = times.map(t => p.pose(t));
  for (let i = times.length - 1; i >= 0; i--) expect(p.pose(times[i])).toBe(poses[i]);
  expect(p.mounts).toBe(1);
});

test('chapter boundaries preserve the exact same scene pose', () => {
  const p = player();
  for (let stage = 0; stage < 11; stage++) {
    p.window.renderJourneyChapter(stage, 1);
    const before = [...p.nodes].map(([id, n]) => [id, { ...n.attributes }]);
    p.window.renderJourneyChapter(stage + 1, 0);
    expect([...p.nodes].map(([id, n]) => [id, { ...n.attributes }])).toEqual(before);
  }
});

test('scroll smoothing settles and reduced motion renders without scheduling animation', () => {
  const normal = player(false), reduced = player(true);
  normal.pose(0); normal.window.renderJourneyChapter(11, 1);
  expect(normal.callbacks.size).toBe(1);
  normal.settle(); reduced.pose(12);
  expect(normal.nodes.get('#truck').attributes).toEqual(reduced.nodes.get('#truck').attributes);
  expect(reduced.callbacks.size).toBe(0);
  const mounts = normal.mounts;
  normal.window.renderJourneyChapter(NaN, 0);
  expect(normal.mounts).toBe(mounts);
});


test('delivery completes on credit before eTIMS invoice is settled through M-Pesa', () => {
  const p = player();
  const opacity = (id: string) => Number(p.nodes.get(`#${id}`).attributes.opacity);
  p.pose(8.8);
  expect(opacity('tax-stamp')).toBe(1);
  expect(opacity('invoice-unpaid')).toBe(1);
  expect(opacity('payment-success')).toBe(0);
  p.pose(9.98);
  expect(opacity('handover')).toBe(1);
  expect(opacity('invoice-unpaid')).toBe(1);
  expect(opacity('payment-success')).toBe(0);
  p.pose(12);
  expect(opacity('receipt-panel')).toBe(1);
  expect(opacity('receipt-lines')).toBe(1);
  expect(opacity('payment-success')).toBe(1);
  expect(opacity('invoice-unpaid')).toBe(0);
  expect(opacity('handover')).toBe(1);
  p.pose(8.8);
  expect(opacity('payment-success')).toBe(0);
  expect(opacity('invoice-unpaid')).toBe(1);
});


test('camera follows the route on desktop and mobile and reverses deterministically', () => {
  for (const width of [390, 1400]) {
    const p = player(false, width);
    const farm = p.pose(.3);
    const farmCamera = p.nodes.get('#campus').attributes.transform;
    p.pose(7.5);
    expect(p.nodes.get('#campus').attributes.transform).not.toBe(farmCamera);
    expect(p.nodes.get('#campus').attributes.transform).not.toMatch(/NaN|Infinity/);
    expect(p.pose(.3)).toBe(farm);
    expect(p.mounts).toBe(1);
  }
  const reduced = player(true);
  reduced.pose(0);
  expect(reduced.callbacks.size).toBe(0);
  reduced.pose(12);
  expect(reduced.callbacks.size).toBe(0);
});


test('delivery vehicle travels down the road, steers around bends, then unloads before payment', () => {
  const p = player();
  const positions = [9.02, 9.2, 9.38, 9.55, 9.73].map(t => {
    p.pose(t);
    return p.nodes.get('#truck').attributes.transform.match(/-?[\d.]+/g).map(Number);
  });
  for (let i = 1; i < positions.length; i++) expect(positions[i][1]).toBeGreaterThan(positions[i - 1][1]);
  expect(positions.some(pose => Math.abs(pose[2]) > 5)).toBe(true);
  p.pose(9.98);
  expect(Number(p.nodes.get('#handover').attributes.opacity)).toBe(1);
  expect(Number(p.nodes.get('#payment-success').attributes.opacity)).toBe(0);
  expect(Number(p.nodes.get('#receipt-panel').attributes.opacity)).toBe(0);
  p.pose(10.8);
  expect(Number(p.nodes.get('#payment-success').attributes.opacity)).toBe(1);
  expect(Number(p.nodes.get('#receipt-panel').attributes.opacity)).toBe(0);
});


test('the opening truck continues into transport on one timeline without resetting', () => {
  const p = player(false);
  const y = () => Number(p.nodes.get('#supplier-truck').attributes.transform.match(/translate\([^ ]+ ([^)]+)\)/)[1]);
  p.pose(0);const initial=y();
  p.pose(.1);expect(y()).toBeGreaterThan(initial);
  p.pose(.38);expect(y()).toBe(295);
  p.pose(.99);const atFarm=y();
  p.pose(1);expect(y()).toBe(atFarm);
  p.pose(1.1);expect(y()).toBeGreaterThan(atFarm);
  p.pose(0);expect(y()).toBe(initial);
  expect(p.mounts).toBe(1);
});

test('packages stay in workers hands during each carrying leg and ride with the truck', () => {
  const p = player();
  const position = (id: string) => p.nodes.get(`#${id}`).attributes.transform.match(/-?[\d.]+/g).map(Number);
  for (const [time, parcel, person] of [[.65, 'raw-goods', 'farm-worker'], [2.4, 'raw-goods', 'receiver'], [4.07, 'stock-0', 'stock-worker'], [6.07, 'stock-0', 'loader'], [9.77, 'stock-0', 'customer-worker']] as const) {
    p.pose(time);
    const cargo = position(parcel), hands = position(person);
    expect(cargo[0]).toBeCloseTo(hands[0], 6);
    expect(cargo[1] - hands[1]).toBeCloseTo(7, 6);
  }
  for (const time of [7, 9.2, 9.55]) {
    p.pose(time);
    const cargo = position('stock-0'), truck = position('truck');
    expect(Math.hypot(cargo[0] - truck[0], cargo[1] - truck[1])).toBeCloseTo(Math.hypot(15, 62), 6);
    expect(cargo[2]).toBe(truck[2]);
    expect(Number(p.nodes.get('#stock-0').attributes.opacity)).toBe(1);
  }
  p.pose(10.31);
  const delivered = position('stock-7');
  p.pose(12);
  expect(position('stock-7')).toEqual(delivered);
});
