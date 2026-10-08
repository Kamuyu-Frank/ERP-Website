import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/journey-scenes.js', import.meta.url), 'utf8');
function player(reduced = true) {
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
  const window: any = { matchMedia: () => ({ matches: reduced }), addEventListener() {} };
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
    window.renderJourneyChapter(Math.min(7, Math.floor(time)), time === 8 ? 1 : time % 1);
    settle();
    return JSON.stringify([...nodes].map(([id, element]) => [id, element.attributes]));
  }
  return { pose, nodes, window, callbacks, settle, get mounts() { return mounts; } };
}

test('forward and backward seeking produce the same poses without replacing the scene', () => {
  const p = player();
  const times = [0, .6, 1.5, 2.4, 3.4, 4.5, 5.5, 6.8, 7.4, 8];
  const poses = times.map(t => p.pose(t));
  for (let i = times.length - 1; i >= 0; i--) expect(p.pose(times[i])).toBe(poses[i]);
  expect(p.mounts).toBe(1);
});

test('chapter boundaries preserve the exact same scene pose', () => {
  const p = player();
  for (let stage = 0; stage < 7; stage++) {
    p.window.renderJourneyChapter(stage, 1);
    const before = [...p.nodes].map(([id, n]) => [id, { ...n.attributes }]);
    p.window.renderJourneyChapter(stage + 1, 0);
    expect([...p.nodes].map(([id, n]) => [id, { ...n.attributes }])).toEqual(before);
  }
});

test('scroll smoothing settles and reduced motion renders without scheduling animation', () => {
  const normal = player(false), reduced = player(true);
  normal.pose(0); normal.window.renderJourneyChapter(7, 1);
  expect(normal.callbacks.size).toBe(1);
  normal.settle(); reduced.pose(8);
  expect(normal.nodes.get('#truck').attributes).toEqual(reduced.nodes.get('#truck').attributes);
  expect(reduced.callbacks.size).toBe(0);
  const mounts = normal.mounts;
  normal.window.renderJourneyChapter(NaN, 0);
  expect(normal.mounts).toBe(mounts);
});


test('delivery completes on credit before eTIMS invoice is settled through M-Pesa', () => {
  const p = player();
  const opacity = (id: string) => Number(p.nodes.get(`#${id}`).attributes.opacity);
  p.pose(5.8);
  expect(opacity('tax-stamp')).toBe(1);
  expect(opacity('invoice-unpaid')).toBe(1);
  expect(opacity('payment-success')).toBe(0);
  p.pose(6.98);
  expect(opacity('handover')).toBe(1);
  expect(opacity('invoice-unpaid')).toBe(1);
  expect(opacity('payment-success')).toBe(0);
  p.pose(8);
  expect(opacity('payment-panel')).toBe(1);
  expect(opacity('payment-success')).toBe(1);
  expect(opacity('invoice-unpaid')).toBe(0);
  expect(opacity('handover')).toBe(1);
  p.pose(5.8);
  expect(opacity('payment-success')).toBe(0);
  expect(opacity('invoice-unpaid')).toBe(1);
});
