/* Industrial scene renderer. The existing journey controller owns time and poses. */
import * as THREE from './vendor/three/three.module.min.js';
import {makeDeliveryPerson} from './delivery-character.js?v=handover2-20261012';

const world = document.getElementById('world');
const paymentStatus=document.createElement('div');paymentStatus.className='customer-status';paymentStatus.setAttribute('aria-live','polite');paymentStatus.hidden=true;
const canvas = document.createElement('canvas');
canvas.className = 'industrial-canvas';
canvas.setAttribute('aria-hidden', 'true');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
} catch {
  // The complete SVG journey remains available when WebGL is unavailable.
}
if (renderer) build();

function build() {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 220);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const sun = new THREE.DirectionalLight(0xffedcf, 3.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25, near: .5, far: 100 });
  sun.shadow.normalBias = .035;
  sun.shadow.bias = -.0002;
  scene.add(sun, sun.target, new THREE.HemisphereLight(0xd9eeff, 0x596052, 2.1));
  const fill = new THREE.DirectionalLight(0xb5dfff, 1.1);
  fill.position.set(18, 12, -30); scene.add(fill);
  const materials = new Map(), geometries = new Map(), textures = new Set();
  const mat = (color, metal = 0, rough = .7) => {
    const key = `${color}/${metal}/${rough}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough }));
    return materials.get(key);
  };
  const steel = mat('#81929b', .72, .32), darkSteel = mat('#344654', .65, .4);
  const rubber = mat('#192027', .02, .94), teal = mat('#087e96', .38, .35);
  const safety = mat('#dfa433', .28, .43), concrete = mat('#c1c5c3', .03, .98);
  const timber = mat('#9c7650', 0, .92), cardboard = mat('#c8a77a', 0, .95);
  const glass = mat('#284551', .5, .16), white = mat('#e2e8e7', .2, .52);
  // Small procedural surface variations keep metal and concrete from looking plastic.
  function surfaceTexture(brushed = false) {
    const c=document.createElement('canvas');c.width=c.height=128;
    const ctx=c.getContext('2d');const data=ctx.createImageData(128,128);let seed=73;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++) {
      seed=(seed*1664525+1013904223)>>>0;
      const value=brushed?170+(y%3)*12+(seed%10):160+seed%65;
      const offset=(y*128+x)*4;data.data[offset]=data.data[offset+1]=data.data[offset+2]=value;data.data[offset+3]=255;
    }
    ctx.putImageData(data,0,0);const texture=new THREE.CanvasTexture(c);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(brushed?2:4,brushed?2:4);textures.add(texture);return texture;
  }
  concrete.bumpMap=surfaceTexture();concrete.bumpScale=.025;
  steel.roughnessMap=surfaceTexture(true);
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  geometries.set('box', boxGeometry);
  function mesh(parent, geometry, material, x, y, z) {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(parent, x, y, z, w, h, d, material) {
    const m = mesh(parent, boxGeometry, material, x, y, z); m.scale.set(w, h, d); return m;
  }
  function cylinder(parent, x, y, z, radius, height, material, segments = 16) {
    const key = `cylinder/${radius}/${height}/${segments}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(radius, radius, height, segments));
    return mesh(parent, geometries.get(key), material, x, y, z);
  }
  function sphere(parent, x, y, z, radius, material) {
    const key = `sphere/${radius}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.SphereGeometry(radius, 12, 8));
    return mesh(parent, geometries.get(key), material, x, y, z);
  }
  function group(parent, x = 0, z = 0) { const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g); return g; }
  const X = x => (x - 500) / 25, Z = y => y / 25;
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const phase = (t, a, b) => ease((t - a) / (b - a));
  const mix = (a, b, p) => a + (b - a) * p;

  function label(parent, value, x, y, z, width = 3.3) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 100;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#183342'; ctx.fillRect(0, 0, 512, 100);
    ctx.fillStyle = '#12aac0'; ctx.fillRect(0, 0, 12, 100);
    ctx.font = '600 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#edf4f5'; ctx.fillText(value, 260, 52, 460);
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
    const material = new THREE.MeshBasicMaterial({ map: texture }); materials.set(`label/${value}`, material);
    const g = new THREE.PlaneGeometry(width, width * 100 / 512); geometries.set(`label/${value}/${width}`, g);
    return mesh(parent, g, material, x, y, z);
  }
  function pallet(parent, x, y, z) {
    const p = group(parent, x, z); p.position.y = y;
    for (const sx of [-.48, 0, .48]) box(p, sx, .09, 0, .12, .18, 1.05, timber);
    for (let i = 0; i < 5; i++) box(p, 0, .21, -.45 + i * .225, 1.18, .065, .16, timber);
    return p;
  }
  function carton(parent, x = 0, z = 0, size = 1) {
    const g = group(parent, x, z); g.scale.setScalar(size);
    box(g, 0, .37, 0, .77, .74, .65, cardboard);
    box(g, 0, .745, 0, .1, .007, .65, mat('#e0c799'));
    box(g, 0, .37, .329, .4, .28, .009, white);
    box(g, -.13, .35, .338, .04, .13, .008, teal);
    for (let i = 0; i < 7; i++) box(g, -.04 + i * .026, .37, .339, .012, .11, .008, rubber);
    box(g, .15, .61, .335, .16, .02, .008, darkSteel);
    return g;
  }
  function palletLoad(parent, x, z) {
    const p = pallet(parent, x, 0, z);
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
      const c = carton(p, -.29 + col * .58, -.25 + row * .5, .65); c.position.y = .25;
    }
    return p;
  }
  // Concrete aprons, raised foundations, and a road matching the existing route.
  box(scene, 0, -.5, 65, 76, .8, 160, mat('#617365', 0, 1));
  box(scene, 0, -.09, 65, 74, .08, 160, mat('#788b78', 0, 1));
  const stops = [[0,520],[350,520],[760,420],[1120,420],[1510,510],[1840,510],[2230,350],[2510,350],[2870,510],[3300,510]];
  function roadAt(y) {
    let i = 0; while (i < stops.length - 2 && y > stops[i + 1][0]) i++;
    const [ya, xa] = stops[i], [yb, xb] = stops[i + 1]; const p = clamp((y - ya) / (yb - ya));
    return { x: mix(xa, xb, ease(p)), angle: -Math.atan((xb - xa) * 6 * p * (1 - p) / (yb - ya)) };
  }
  function roadRibbon(width, height, material) {
    const vertices = [], indices = [];
    for (let i = 0; i <= 330; i++) {
      const y = i * 10, road = roadAt(y);
      vertices.push(X(road.x) - width / 2, height, Z(y), X(road.x) + width / 2, height, Z(y));
      if (i) { const a = i * 2; indices.push(a - 2, a, a - 1, a - 1, a, a + 1); }
    }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setIndex(indices); geometry.computeVertexNormals();
    geometries.set(`road/${width}`, geometry); const m = mesh(scene, geometry, material, 0, 0, 0); m.castShadow = false;
  }
  roadRibbon(7.5, .005, concrete); roadRibbon(5.7, .015, concrete); roadRibbon(4.6, .04, mat('#41494b', 0, .99));
  for (let y = 0; y < 3300; y += 42) {
    const r = roadAt(y); const line = box(scene, X(r.x), .052, Z(y), .07, .012, .72, mat('#dfd5af')); line.rotation.y = r.angle;
  }
  for (const [x, y, w] of [[435,275,190],[525,925,210],[585,1580,150],[590,2960,160]]) box(scene, X(x), .02, Z(y), w / 25, .06, 2.3, concrete);

  function facility(x, y, w, d, title) {
    const g = group(scene, X(x + w / 2), Z(y + d / 2)); const W = w / 25, D = d / 25;
    box(g, 0, .14, 0, W, .28, D, concrete);
    // Open west and south walls expose the equipment to the camera.
    box(g, 0, 1.9, -D / 2, W, 3.5, .15, mat('#bdc7ca', .25, .6));
    box(g, W / 2, 1.9, 0, .15, 3.5, D, mat('#8d9da6', .32, .55));
    for (let z = -D / 2 + .35; z < D / 2; z += .35) box(g, W / 2 + .085, 1.9, z, .03, 3.4, .035, steel);
    for (let z = -D / 2; z <= D / 2; z += 3) {
      box(g, -W / 2, 1.75, z, .12, 3.3, .12, steel);
      box(g, 0, 3.5, z, W, .12, .12, darkSteel);
      box(g, W / 2 - .15, 1.75, z, .12, 3.3, .12, darkSteel);
    }
    box(g, 0, 3.55, -D / 2 + .55, W + .15, .12, 1.1, white);
    for (let x = -W / 2 + .8; x < W / 2; x += 1.2) box(g, x, 2.7, -D / 2 + .09, .9, .5, .025, glass);
    label(g, title, 0, 3.05, -D / 2 + .11, Math.min(W - .5, 7));
    return g;
  }
  facility(85, 98, 255, 258, '01 / SUPPLIER');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) palletLoad(scene, X(116 + c * 70), Z(140 + r * 68));
  facility(610,755,300,425,'02 / PRODUCTION');
  facility(635,1310,290,360,'03 / WAREHOUSE');
  facility(640,1745,270,130,'04 / SALES');
  facility(635,2830,280,225,'05 / CUSTOMER');

  // Floor safety boundaries, bollards, drainage and dock bumpers.
  function dock(x, z) {
    box(scene, x, .1, z, 4, .2, 2.1, concrete);
    for (let i = 0; i < 8; i++) {
      const line = box(scene, x - 1.75 + i * .5, .211, z + .82, .22, .015, .34, i % 2 ? rubber : safety); line.rotation.y = -.35;
    }
    for (const sx of [-1.8, 1.8]) {
      cylinder(scene, x + sx, .45, z, .065, .8, safety);
      cylinder(scene, x + sx, .58, z, .067, .1, rubber);
      box(scene, x + sx, .15, z, .22, .06, .22, darkSteel);
    }
    box(scene, x, .23, z - .8, 2.4, .06, .3, steel);
  }
  dock(X(590), Z(925)); dock(X(600), Z(1580)); dock(X(600), Z(2960));

  const rollers = [];
  function conveyor(x, z, width, length, across = false) {
    const g = group(scene, x, z); if (across) g.rotation.y = Math.PI / 2;
    box(g, 0, .73, 0, width, .1, length, darkSteel);
    for (const side of [-1, 1]) {
      box(g, side * width / 2, .91, 0, .07, .24, length, steel);
      for (const sz of [-length / 2 + .15, length / 2 - .15]) box(g, side * (width / 2 - .08), .37, sz, .09, .74, .09, steel);
    }
    for (let z = -length / 2 + .14; z < length / 2; z += .22) {
      const roller = cylinder(g, 0, .86, z, .075, width - .1, steel, 12); roller.rotation.z = Math.PI / 2; rollers.push(roller);
    }
    cylinder(g, width / 2 + .16, .65, -length / 2 + .2, .16, .4, teal).rotation.x = Math.PI / 2;
    return g;
  }
  conveyor(X(671), Z(978), 1.8, 11.8);
  conveyor(X(805), Z(1100), 1.35, 5, true);
  conveyor(X(862), Z(1230), 1.15, 8);

  // Marked pedestrian routes and pallet staging bays make the handovers readable.
  for (const [x,z,w,d] of [[672,930,80,100],[865,1333,65,55],[600,1528,60,55],[690,2940,110,90]]) {
    const cx = X(x), cz = Z(z), W = w/25, D = d/25;
    for (const sx of [-1,1]) box(scene,cx + sx*W/2,.3,cz,.045,.012,D,safety);
    for (const sz of [-1,1]) box(scene,cx,.3,cz + sz*D/2,W,.012,.045,safety);
  }
  for (const [x,z] of [[919,1115],[925,1590],[905,3025]]) {
    const cabinet = group(scene,X(x),Z(z));
    box(cabinet,0,.7,0,.5,1.4,.35,mat('#a83e35',.3,.5));
    label(cabinet,'FIRE',0,.9,.181,.4);
  }
  const machine = group(scene, X(799), Z(989));
  box(machine, 0, .35, 0, 4.5, .7, 4.7, darkSteel);
  box(machine, 0, 1.85, 0, 4.2, 2.8, 4.35, steel);
  box(machine, 0, 1.8, 2.2, 3.5, 1.9, .08, glass);
  for (const x of [-1.85, 1.85]) box(machine, x, 1.8, 2.25, .13, 2.7, .12, white);
  box(machine, 0, 2.85, 2.25, 4, .15, .12, white);
  const press = box(machine, 0, 2, 1.5, 2.3, .45, .55, darkSteel);
  for (const x of [-.85,.85]) cylinder(machine, x, 1.7, 1.5, .09, 2, steel);
  cylinder(machine, 0, 3.55, -.6, .75, 1.1, steel, 24);
  const hopper = mesh(machine, new THREE.CylinderGeometry(.75, .3, .8, 24), steel, 0, 2.95, -.6); geometries.set('hopper', hopper.geometry);
  for (let i = 0; i < 7; i++) box(machine, 2.16, 1.5 + i * .14, .1, .035, .045, 1.6, rubber);
  label(machine, 'AUTOMATED LINE / 01', 0, 3.05, 2.32, 3.2);
  const controls = group(scene, X(903), Z(1004));
  box(controls, 0, .9, 0, .45, 1.8, .4, steel); box(controls, 0, 1.65, .24, .62, .6, .14, darkSteel);
  box(controls, 0, 1.73, .32, .4, .27, .02, teal);
  cylinder(controls, .18, 1.44, .33, .045, .04, mat('#bf4637')).rotation.x = Math.PI / 2;
  const machineLight = mat('#56ce90', .1, .4); machineLight.emissive = new THREE.Color('#16743c');
  cylinder(machine, 1.85, 3.4, 1.9, .08, .22, machineLight);

  function rack(x, z) {
    const g = group(scene, x, z);
    for (const sx of [-4.1, 0, 4.1]) for (const sz of [-.6, .6]) {
      box(g, sx, 1.5, sz, .1, 3, .1, teal); box(g, sx, .04, sz, .27, .08, .27, darkSteel);
    }
    for (const level of [.28, 1.65, 2.95]) {
      box(g, 0, level, -.6, 8.3, .14, .1, safety); box(g, 0, level, .6, 8.3, .14, .1, safety);
      for (let sx = -4; sx <= 4; sx += .45) box(g, sx, level, 0, .035, .06, 1.2, steel);
    }
    for (const sx of [-4.1, 4.1]) {
      const brace = box(g, sx, 1.55, 0, .04, 2.6, .05, steel); brace.rotation.x = .42;
    }
    for (let i = 0; i < 6; i++) { const c = carton(g, -3.4 + i * 1.3, -.05, .95); c.position.y = 1.73; }
    return g;
  }
  rack(X(782), Z(1407)); rack(X(782), Z(1503));
  // Inspectable desk and dispatch documents, rather than a floating phone icon.
  box(scene, X(783), .9, Z(1818), 5.5, .13, 1.8, timber);
  for (const x of [725, 842]) for (const z of [1800,1835]) box(scene, X(x), .45, Z(z), .12, .9, .12, darkSteel);
  box(scene, X(800), 1.47, Z(1803), 1.2, .75, .09, darkSteel);
  box(scene, X(800), 1.47, Z(1805), 1.05, .6, .025, teal);
  box(scene, X(800), 1.07, Z(1803), .12, .45, .12, steel);
  box(scene, X(770), .99, Z(1830), 1.1, .025, .5, rubber);
  box(scene, X(735), 1, Z(1816), .6, .025, .75, white);

  function truck(color) {
    const g = group(scene), paint = mat(color, .45, .32), wheels = [];
    box(g, 0, .65, 0, 2.45, .23, 6.2, darkSteel);
    box(g, 0, 1, -1.1, 2.5, .18, 4.3, steel);
    // Open cargo deck exposes the actual parcels; ribs and panels are fully modeled.
    box(g, -1.2, 1.45, -1.1, .1, .85, 4.3, white);
    box(g, 1.2, 1.45, -1.1, .1, .85, 4.3, white);
    box(g, 0, 1.45, -3.2, 2.5, .85, .1, white);
    for (let i = 0; i < 12; i++) for (const sx of [-1.25,1.25]) box(g, sx, 1.43, -3.1 + i * .35, .025, .8, .03, steel);
    box(g, 0, 1.65, 2.1, 2.4, 2, 1.9, paint);
    box(g, 0, 2.14, 3.065, 2.15, .75, .03, glass);
    for (const sx of [-1.215,1.215]) box(g, sx, 2.14, 2.15, .025, .7, 1.2, glass);
    box(g, 0, 2.72, 2.1, 2.5, .15, 2.02, paint);
    box(g, 0, 1.04, 3.1, 2.52, .23, .14, steel);
    box(g, 0, 1.34, 3.07, 1.15, .35, .05, rubber);
    for (let i = 0; i < 4; i++) box(g, 0, 1.23 + i * .075, 3.105, 1.12, .022, .01, steel);
    for (const sx of [-.87,.87]) {
      box(g, sx, 1.42, 3.095, .4, .19, .05, mat('#f6e5b6', .1, .2));
      box(g, sx, 1.75, 3.08, .22, .09, .03, safety);
      box(g, sx * 1.55, 2.12, 2.95, .12, .32, .23, darkSteel);
      box(g, sx * 1.4, 2.12, 2.74, .34, .045, .045, steel);
    }
    for (const z of [-2.3,-1.35,2.15]) for (const sx of [-1.2,1.2]) {
      const tire = cylinder(g, sx, .5, z, .49, .27, rubber, 24); tire.rotation.z = Math.PI / 2;
      const hub = cylinder(g, sx * 1.13, .5, z, .26, .02, steel, 16); hub.rotation.z = Math.PI / 2; wheels.push(hub);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sphere(g, sx * 1.15, .5 + Math.sin(a) * .17, z + Math.cos(a) * .17, .025, darkSteel); }
    }
    label(g, 'SNAP ERP', 0, 1.77, 3.105, 1.2);
    return { g, wheels };
  }
  const supplier = truck('#63796b'), outbound = truck('#087e96');

  function forklift() {
    const g = group(scene), lift = group(g), wheels = [];
    box(g, 0, .45, -.2, 1.3, .6, 1.6, safety); box(g, 0, .66, -.7, 1.15, .52, .4, safety);
    box(g, 0, .72, -.1, .62, .15, .55, rubber); box(g, 0, .96, -.36, .6, .6, .12, rubber);
    for (const sx of [-.52,.52]) for (const sz of [-.65,.47]) box(g, sx, 1.36, sz, .055, 1.6, .055, darkSteel);
    box(g, 0, 2.14, -.1, 1.22, .09, 1.5, safety);
    for (let i = 0; i < 6; i++) box(g, -.5 + i * .2, 2.17, -.1, .035, .035, 1.4, darkSteel);
    for (const sx of [-.43,.43]) box(g, sx, 1.1, .85, .12, 2.2, .12, darkSteel);
    cylinder(g, 0, .95, .83, .065, 1.8, steel);
    box(lift, 0, .28, .95, 1.05, .12, .12, darkSteel);
    for (const sx of [-.36,.36]) box(lift, sx, .26, 1.4, .09, .06, 1.1, steel);
    for (const z of [-.55,.52]) for (const sx of [-.65,.65]) {
      const wheel = cylinder(g, sx, .3, z, .3, .17, rubber); wheel.rotation.z = Math.PI / 2; wheels.push(wheel);
      cylinder(g, sx * 1.13, .3, z, .14, .02, steel).rotation.z = Math.PI / 2;
    }
    sphere(g, 0, 1.62, -.1, .16, mat('#b48868'));
    box(g, 0, 1.28, -.12, .34, .45, .25, mat('#d7aa38'));
    cylinder(g, 0, 1.81, -.1, .19, .06, safety);
    return { g, lift, wheels };
  }
  const stockLift = forklift(), loadLift = forklift(), supplierLift = forklift(), receivingLift = forklift();
  function worker(color, hardhat = true) {
    const g = group(scene), legs = [], arms = [];
    box(g, 0, 1.07, 0, .4, .52, .25, mat(color));
    for (const x of [-.14,.14]) {
      const leg = group(g, x); leg.position.y = .78;
      box(leg, 0, -.28, 0, .14, .56, .16, darkSteel); box(leg, 0, -.57, .06, .18, .12, .3, rubber); legs.push(leg);
      const arm = group(g, x * 1.85); arm.position.y = 1.26;
      cylinder(arm, 0, -.22, 0, .065, .45, mat('#b48868')); arms.push(arm);
    }
    sphere(g, 0, 1.47, 0, .17, mat('#b48868'));
    if(hardhat)cylinder(g, 0, 1.64, 0, .2, .07, safety);
    else sphere(g,0,1.58,-.025,.165,mat('#302821'));
    box(g, 0, 1.13, .135, .4, .055, .01, white);
    return { g, legs, arms };
  }
  // A dedicated handover apron keeps both people clear of warehouse columns.
  box(scene,X(675),.14,Z(3090),4.5,.28,3.6,concrete);
  box(scene,X(675),1.11,Z(3096),1.25,.08,.7,timber);
  for(const sx of [-.5,.5])for(const sz of [-.25,.25])box(scene,X(675)+sx,.7,Z(3096)+sz,.055,.8,.055,darkSteel);
  const peopleKit={THREE,mat,box,sphere,mesh,group,geometries};
  const workers = { 'customer-worker': makeDeliveryPerson(scene,peopleKit,{shirt:'#527b79',courier:true}) };
  const courier=makeDeliveryPerson(scene,peopleKit,{shirt:'#295b68',courier:true});
  const customer = makeDeliveryPerson(scene,peopleKit,{shirt:'#35516b'});
  customer.g.position.set(X(680),.28,Z(3085));customer.g.scale.setScalar(1);
  const customerPhone=group(customer.g,.31,.45);customerPhone.position.y=1.23;customerPhone.rotation.x=-.35;
  box(customerPhone,0,0,0,.25,.46,.035,rubber);
  const phoneScreen=box(customerPhone,0,.015,.022,.215,.37,.012,mat('#d8eee4',.05,.35));
  box(customerPhone,0,.19,.032,.07,.012,.005,rubber);
  const phonePending=label(customerPhone,'M-PESA',0,.04,.035,.2);
  const phoneSuccess=label(customerPhone,'PAID',0,.04,.036,.2);
  label(customerPhone,'KSh 48,000',0,.12,.036,.19);
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)box(customerPhone,-.055+col*.055,-.055-row*.043,.035,.027,.023,.006,white);
  const thumb=sphere(customerPhone,.09,-.11,.06,.032,mat('#b48868'));
  const receipt=group(customer.g,.31,.45);receipt.position.y=1.15;
  box(receipt,0,0,0,.34,.48,.012,white);
  for(let i=0;i<5;i++)box(receipt,0,.12-i*.055,.009,.23,.012,.004,darkSteel);
  const receiptCheck=label(receipt,'PAID',0,-.17,.015,.26);
  // The customer's parcel stays in their hands through payment, then enters stock.
  const handoverParcel=carton(scene);handoverParcel.scale.setScalar(.65);

  const inspector = worker('#dfaa38'); inspector.g.position.set(X(705),.28,Z(922));
  box(inspector.g,.34,1.16,.2,.3,.04,.4,darkSteel);
  const raw = palletLoad(scene, 0, 0);
  const cartons = Array.from({ length: 8 }, () => carton(scene));cartons[0].scale.setScalar(.65);
  // Background details use a restrained, repeatable industrial vocabulary.
  for (let y = 50; y < 3250; y += 180) {
    for (const sx of [X(50),X(967)]) {
      cylinder(scene, sx, .6, Z(y), .09, 1.2, timber);
      const foliage = sphere(scene, sx, 1.8, Z(y), .9, mat('#54705b', 0, .95)); foliage.scale.set(1, 1.3, 1);
    }
  }
  for (const y of [780,1130,1670,2870]) {
    const g = group(scene, X(580), Z(y)); cylinder(g, 2, 2.5, 0, .04, 5, darkSteel); box(g, 1.4, 4.95, 0, 1.3, .05, .05, steel); box(g, .8, 4.9, 0, .4, .09, .2, white);
  }

  // Streets, shops and neighboring premises give the journey a town setting.
  const brick=mat('#ad8a74',0,.92),stucco=mat('#d2c7b2',0,.94),roof=mat('#525e64',.25,.7);
  function townBuilding(x,z,w,d,h,title,color=stucco) {
    const g=group(scene,x,z);
    box(g,0,.12,0,w+.5,.24,d+.5,concrete);box(g,0,h/2+.24,0,w,h,d,color);
    box(g,0,h+.3,0,w+.3,.2,d+.3,roof);box(g,0,h+.52,0,w+.1,.25,d+.1,white);
    for(let level=1.15;level<h;level+=1.35)for(let col=-w/2+.8;col<w/2-.4;col+=1.25){
      box(g,col,level,d/2+.025,.8,.7,.04,darkSteel);box(g,col,level,d/2+.052,.65,.56,.015,glass);
      box(g,col,level,d/2+.065,.025,.56,.015,steel);box(g,col,level-.4,d/2+.09,.94,.08,.15,white);
    }
    box(g,-w*.25,.88,d/2+.07,.85,1.3,.08,glass);box(g,-w*.25,.21,d/2+.5,1.3,.16,.8,concrete);
    label(g,title,0,1.95,d/2+.12,Math.min(w-.3,4.5));box(g,0,1.8,d/2+.5,w,.09,1,teal);
    box(g,w*.22,h+.67,0,.85,.55,1,darkSteel);return g;
  }
  for(const [x,z,w,d,h,title,color] of [
    [-28,7,7,6,5,'SUPPLIER STORES',brick],[-16,21,6,5,4.2,'HARDWARE',stucco],
    [27,17,8,6,5.5,'TRADE CENTRE',stucco],[28,34,7,6,4,'ENGINEERING',brick],
    [-14,38,6,5,4.5,'INDUSTRIAL SUPPLIES',stucco],[-14,56,7,5,5,'WHOLESALE MARKET',brick],
    [27,59,7,7,5.8,'LOGISTICS',brick],[27,76,8,6,6.5,'OFFICES',stucco],
    [-14,82,6,5,4,'CAFE',brick],[-14,103,7,6,5.5,'TOWN SHOPS',stucco],
    [27,109,8,6,5,'RETAIL CENTRE',brick],[-14,120,6,5,4.5,'MINI MARKET',stucco],
    [27,130,7,6,6,'APARTMENTS',stucco]])townBuilding(x,z,w,d,h,title,color);
  townBuilding(11,5,7,5,3.6,'LOCAL SUPPLIES',brick);
  townBuilding(15,12,6,5,3.8,'TRADE SHOP',stucco);
  townBuilding(10,25,6,4,3,'DEPOT',brick);
  townBuilding(10,85,6,5,3.6,'TOWN MARKET',stucco);
  townBuilding(9,94,6,4,3.2,'SHOPPING ROW',brick);
  // Infill premises and planted plots break up the empty land between districts.
  for(const [x,z,title] of [[27,5,'WORKSHOPS'],[27,44,'SERVICE CENTRE'],[27,89,'BUSINESS CENTRE'],[27,120,'LOCAL STORES'],[-14,28,'TRADE STORES'],[-14,46,'PARTS'],[-14,65,'DISTRIBUTION'],[-14,93,'BAKERY'],[-14,112,'RETAIL']])townBuilding(x,z,5.5,5,3.2,title,stucco);
  for(const z of [5,26,45,64,85,110,126]){
    const plot=group(scene,20,z);box(plot,0,.035,0,2.2,.09,5,mat('#57755b',0,1));
    for(const edge of [-1.1,1.1])box(plot,edge,.075,0,.09,.1,5,concrete);
    for(const dz of [-1.4,0,1.4]){const shrub=sphere(plot,0,.38,dz,.5,mat('#436d4d',0,.96));shrub.scale.set(1,.7,1.2);}
  }
  for(const z of [20,72,101,132]) {
    box(scene,0,.025,z,100,.04,5.6,concrete);box(scene,0,.051,z,100,.04,4.3,mat('#41494b',0,.99));
    for(let x=-48;x<50;x+=2)box(scene,x,.078,z,.8,.01,.065,white);
  }
  for(const y of [570,1720,2650,3100]) {
    const r=roadAt(y);for(let i=0;i<6;i++)box(scene,X(r.x),.065,Z(y)-.8+i*.3,4.1,.012,.15,white);
    const sign=group(scene,X(r.x)+3.7,Z(y));cylinder(sign,0,1.3,0,.035,2.6,darkSteel);
    label(sign,y<2000?'INDUSTRIAL ROAD':'MARKET STREET',0,2.4,.04,2.2);
  }
  for(let y=30;y<3250;y+=60){const r=roadAt(y);for(const side of [-1,1])box(scene,X(r.x)+side*3.15,.065,Z(y),.95,.01,.018,mat('#9caaa9'));}
  function parkedCar(x,z,color) {
    const g=group(scene,x,z),paint=mat(color,.38,.4);
    box(g,0,.52,0,1.5,.6,3.1,paint);box(g,0,.97,-.1,1.35,.5,1.65,glass);box(g,0,1.24,-.1,1.4,.07,1.75,paint);
    for(const sx of [-.75,.75])for(const sz of [-.9,.95])cylinder(g,sx,.31,sz,.3,.18,rubber).rotation.z=Math.PI/2;
    for(const sx of [-.5,.5])box(g,sx,.62,1.57,.23,.13,.025,white);return g;
  }
  parkedCar(-19,24,'#889ba9');parkedCar(21,80,'#a7836b');parkedCar(-18,109,'#ced3ca');
  for(const z of [23,56,85,107,123]) {
    const g=group(scene,-19,z);box(g,0,.48,0,1.9,.12,.5,timber);box(g,0,.82,-.21,1.9,.6,.08,timber);
    for(const sx of [-.7,.7])box(g,sx,.23,0,.07,.46,.4,darkSteel);cylinder(g,1.65,.35,0,.3,.7,darkSteel);
    const pedestrian=worker('#776e5d',false);pedestrian.g.position.set(-20,.1,z+1.8);pedestrian.g.rotation.y=.5;
  }

  // Batch stationary geometry by material. Moving equipment retains separate meshes.
  for(const root of [supplier.g,outbound.g,stockLift.g,loadLift.g,supplierLift.g,receivingLift.g,raw,press,customer.g,courier.g,handoverParcel,...rollers,...cartons,...Object.values(workers).map(w=>w.g)]) root.userData.dynamic=true;
  scene.updateMatrixWorld(true);
  const batches=new Map();
  scene.traverse(object=>{
    if(!object.isMesh)return;
    for(let ancestor=object;ancestor;ancestor=ancestor.parent)if(ancestor.userData.dynamic)return;
    const key=object.material;
    if(!batches.has(key))batches.set(key,[]);
    batches.get(key).push(object);
  });
  for(const [material,meshes] of batches) {
    const positions=[],normals=[],uvs=[],indices=[];let offset=0;
    for(const object of meshes) {
      const geometry=object.geometry.clone().applyMatrix4(object.matrixWorld);
      positions.push(...geometry.attributes.position.array);normals.push(...geometry.attributes.normal.array);uvs.push(...(geometry.attributes.uv?.array || new Float32Array(geometry.attributes.position.count*2)));
      const index=geometry.index;
      for(let i=0;i<(index?index.count:geometry.attributes.position.count);i++)indices.push(offset+(index?index.getX(i):i));
      offset+=geometry.attributes.position.count;geometry.dispose();object.removeFromParent();
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeBoundingSphere();
    geometries.set(`batch/${geometries.size}`,geometry);mesh(scene,geometry,material,0,0,0);
  }
  let lastPose, size = '', currentTheme = '';
  const pose = (nodes, id) => {
    const v = nodes[id]?.getAttribute('transform')?.match(/translate\(([-\d.e]+) ([-\d.e]+)\) rotate\(([-\d.e]+)\)/);
    return v ? { x: X(Number(v[1])), z: Z(Number(v[2])), angle: -Number(v[3]) * Math.PI / 180 } : { x: 0, z: 0, angle: 0 };
  };
  function place(g, p, height = 0) { g.position.set(p.x, height, p.z); g.rotation.y = p.angle; }
  function render(t, nodes) {
    lastPose = { t, nodes };
    const mobile = innerWidth <= 800, dark = document.documentElement.dataset.theme === 'dark';
    const theme = dark ? 'dark' : 'light';
    if (theme !== currentTheme) {
      currentTheme = theme; scene.background = new THREE.Color(dark ? '#17232d' : '#e5edf0');
      scene.fog = new THREE.Fog(scene.background, 58, 120);
    }
    const nextSize = `${innerWidth}/${innerHeight}`;
    if (size !== nextSize) { size = nextSize; renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
    const inboundPose = pose(nodes, 'supplier-truck'), truckPose = pose(nodes, 'truck');
    place(supplier.g, inboundPose); place(outbound.g, truckPose);
    for (const [truck, p] of [[supplier,inboundPose],[outbound,truckPose]]) for (const wheel of truck.wheels) wheel.rotation.x = p.z * 2;
    for (const [id, w] of Object.entries(workers)) {
      place(w.g, pose(nodes, id)); const node = nodes[`${id}-left`]?.getAttribute('transform');
      const angle = Number(node?.match(/rotate\(([-\d.e]+)\)/)?.[1] || 0) * Math.PI / 180;
      const carrying = nodes[`${id}-arms`]?.getAttribute('d')?.includes('-18');
      w.walk(angle*.65);
      w.setHands(new THREE.Vector3(-.23,carrying?1.06:.89,carrying ? .34 : .03),new THREE.Vector3(.23,carrying?1.06:.89,carrying ? .34 : .03),carrying?1:0);
      w.g.visible=t<9.74||t>=10.06;

    }
    for (const [lift,id,from,to,a,b] of [
      [supplierLift,'farm-worker',[350,280],[487,240],.32,.99],
      [receivingLift,'receiver',[453,885],[671,923],2.04,2.9]
    ]) {
      place(lift.g,pose(nodes,id)); lift.g.rotation.y = Math.atan2(to[0]-from[0],to[1]-from[1]);
      const q=clamp((t-a)/(b-a)); lift.lift.position.y=.4*phase(q,0,.12)*(1-phase(q,.85,1));
      lift.g.visible = id === 'farm-worker' ? t < 1.8 : t >= 1.8 && t < 4;
      for(const wheel of lift.wheels) wheel.rotation.x=(lift.g.position.x+lift.g.position.z)*3;
    }
    const rawPose = pose(nodes,'raw-goods');
    const rawCargo = t >= .99 && t < 2.04;
    place(raw, rawPose, rawCargo ? 1.05 : t >= 3 ? .88 : .18);
    raw.visible = Number(nodes['raw-goods'].getAttribute('opacity')) > .01;
    if (rawCargo) raw.rotation.y = inboundPose.angle;
    for(const [lift,a,b] of [[supplierLift,.32,.99],[receivingLift,2.04,2.9]]) {
      if(t >= a && t < b) {
        const q=clamp((t-a)/(b-a)), attach=phase(q,0,.12)*(1-phase(q,.85,1));
        lift.g.updateMatrixWorld(true);
        const fork=new THREE.Vector3(0,lift.lift.position.y+.32,1.3).applyMatrix4(lift.g.matrixWorld);
        raw.position.lerp(fork,attach); raw.rotation.y=lift.g.rotation.y*attach;
      }
    }
    // Forklift and parcel placement come from the same physical trip as the SVG fallback.
    for (const [lift, id, start, duration] of [[stockLift,'stock-worker',4.02,.12],[loadLift,'loader',6.02,.12]]) {
      const p = pose(nodes,id); const index = Math.min(7, Math.max(0, Math.floor((t - start) / duration)));
      const q = clamp((t - start - index * duration) / duration);
      const from = id === 'stock-worker' ? [862,1322] : [690 + (index % 4) * 47,1384 + Math.floor(index / 4) * 96];
      const to = id === 'stock-worker' ? [690 + (index % 4) * 47,1384 + Math.floor(index / 4) * 96] : [550,1512];
      place(lift.g, p); lift.g.rotation.y = Math.atan2(to[0]-from[0],to[1]-from[1]);
      lift.lift.position.y = .4 * phase(q,0,.16) * (1 - phase(q,.65,.8));
      for (const wheel of lift.wheels) wheel.rotation.x = (p.x + p.z) * 3;
      lift.g.visible = id === 'stock-worker' ? t >= 3.8 && t < 6 : t >= 5.8 && t < 9.74;
    }
    const statusText=t<10.08?'Goods received · Customer handover':t<10.75?'M-Pesa · Confirm KSh 48,000 on phone':t<11.15?'✓ M-Pesa payment received · KSh 48,000':'✓ Receipt issued · Balance KSh 0';
    paymentStatus.hidden=t<9.8;
    if(paymentStatus.textContent!==statusText)paymentStatus.textContent=statusText;
    const receive=phase(t,9.9,10.04), turn=phase(t,10.04,10.22), pay=phase(t,10.18,10.35), paid=phase(t,10.35,10.75),putAway=phase(t,11.25,11.75);
    customer.g.visible=t>=9;customer.g.position.set(X(680),.28,Z(3085));
    customer.g.rotation.y=-Math.PI/2*(1-turn);
    customer.head.rotation.y=-.12*(1-turn)+.12*pay;customer.head.rotation.x=.10*receive;
    const restLeft=new THREE.Vector3(-.25,.89,.03),restRight=new THREE.Vector3(.25,.89,.03);
    const gripLeft=new THREE.Vector3(-.23,1.09,.41),gripRight=new THREE.Vector3(.23,1.09,.41);
    const leftHand=restLeft.clone().lerp(gripLeft,phase(t,9.84,9.96));
    leftHand.y-=.1*putAway;leftHand.lerp(restLeft,phase(t,11.65,11.85));
    const rightHand=restRight.clone().lerp(gripRight,phase(t,9.84,9.96));
    rightHand.lerp(new THREE.Vector3(.29,1.27,.37),pay);
    customer.setHands(leftHand,rightHand,1);customer.walk(0);
    customerPhone.visible=t>=10.18&&t<11.15;customerPhone.position.copy(rightHand).add(new THREE.Vector3(0,.05,.035));
    customerPhone.rotation.x=-.18;phonePending.visible=paid<.5;phoneSuccess.visible=paid>=.5;
    const tap=phase(t,10.2,10.27)*(1-phase(t,10.27,10.35));thumb.position.set(.09-.06*tap,-.11+.08*tap,.06-.015*tap);
    receipt.visible=t>=11.15;receipt.position.copy(rightHand).add(new THREE.Vector3(0,.07,.04));receipt.rotation.x=-.15;receiptCheck.visible=paid>=.99;
    const arrival=phase(t,9.74,9.9),release=phase(t,9.98,10.06);
    const cargoX=truckPose.x-.6,cargoZ=truckPose.z-2.48;
    courier.g.position.set(mix(cargoX-.45,X(680)-1.05,arrival),.28,mix(cargoZ,Z(3085),arrival));
    courier.g.rotation.y=Math.PI/2;courier.g.visible=t>=9.74&&t<10.3;
    const courierLeft=gripLeft.clone().lerp(restLeft,release),courierRight=gripRight.clone().lerp(restRight,release);
    courier.setHands(courierLeft,courierRight,1-release);
    courier.walk(Math.sin(arrival*Math.PI*6)*.20*(1-release));courier.head.rotation.x=.04;
    courier.g.updateMatrixWorld(true);customer.g.updateMatrixWorld(true);
    const courierParcel=new THREE.Vector3(0,1,.43).applyMatrix4(courier.g.matrixWorld);
    const heldParcel=new THREE.Vector3(-.05,1,.43).applyMatrix4(customer.g.matrixWorld);
    handoverParcel.position.copy(courierParcel).lerp(heldParcel,receive);
    handoverParcel.position.lerp(new THREE.Vector3(X(675),1.15,Z(3096)),putAway);
    handoverParcel.position.y=mix(1.1,handoverParcel.position.y,phase(t,9.74,9.77));
    handoverParcel.visible=t>=9.74;handoverParcel.rotation.y=mix(mix(truckPose.angle,Math.PI/2,phase(t,9.74,9.8)),customer.g.rotation.y,receive)*(1-putAway);
    cartons.forEach((c, i) => {
      const id = `stock-${i}`, p = pose(nodes,id), loadStart = 6.02 + i * .12, deliveryStart = 9.74 + i * .07;
      let height = t < 4.02 + i * .12 ? .89 : .32;
      if (t >= loadStart + .096 && t < deliveryStart) height = 1.1;
      for(const [lift,start] of [[stockLift,4.02+i*.12],[loadLift,loadStart]]) {
        if(t >= start && t < start+.096) {
          const q=clamp((t-start)/.12), attach=phase(q,0,.16)*(1-phase(q,.65,.8));
          lift.g.updateMatrixWorld(true);
          const fork=new THREE.Vector3(0,lift.lift.position.y+.32,1.3).applyMatrix4(lift.g.matrixWorld);
          p.x=mix(p.x,fork.x,attach); p.z=mix(p.z,fork.z,attach); height=mix(height,fork.y,attach);
          p.angle=mix(p.angle,lift.g.rotation.y,attach);
        }
      }
      if (t >= deliveryStart && t < deliveryStart + .056) height = .85;
      place(c,p,height); c.visible = Number(nodes[id].getAttribute('opacity')) > .02 && !(i===0&&t>=9.74);
    });
    press.position.y = 1.9 - Math.sin(phase(t,3,4) * Math.PI * 12) * .3;
    for (const roller of rollers) roller.rotation.x = phase(t,3,4) * Math.PI * 24;
    const stage = Math.min(11,Math.floor(t)), cameraY = [220,360,890,995,1420,1470,1550,1550,1550,1650,2940,2940,2940];
    let cy = mix(cameraY[stage],cameraY[stage+1],ease(t-stage));
    if (stage === 9) cy = mix(1650,2940,phase(t,9.02,9.73));
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) cy = cameraY[stage+1];
    if(mobile&&t<1)cy-=120*(1-ease(t));
    const focusX = mobile ? mix(520,630,phase(t,1,2)) : stage === 0 ? 400 : stage === 1 ? mix(400,630,ease(t-1)) : 630;
    const closeup=phase(t,9.68,9.9);
    const target = new THREE.Vector3(mix(X(focusX),X(668),closeup),mix(.7,1.15,closeup),mix(Z(cy),Z(3085),closeup));
    camera.position.copy(target).add(new THREE.Vector3(mix(mobile?-19:-16,-4.5,closeup),mix(mobile?24:19,3.2,closeup),mix(mobile?24:20,5.4,closeup)));
    camera.lookAt(target);
    sun.position.copy(target).add(new THREE.Vector3(-18,32,12)); sun.target.position.copy(target); sun.target.updateMatrixWorld();
    renderer.render(scene,camera);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.version='handover2-20261012';
    canvas.dataset.stage = String(stage);
    canvas.dataset.progress = t.toFixed(4);
    canvas.dataset.customerAction=t<9.8?'awaiting-delivery':t<10.08?'receiving':t<10.75?'paying':t<11.15?'paid':'receipt';
  }
  document.body.insertBefore(canvas, world);document.body.appendChild(paymentStatus);
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); document.body.classList.remove('industrial-ready'); });
  canvas.addEventListener('webglcontextrestored', () => { if(lastPose) { render(lastPose.t,lastPose.nodes); document.body.classList.add('industrial-ready'); } });
  window.renderIndustrialJourney = render;
  if (window.journeyPose) render(window.journeyPose.t, window.journeyPose.nodes);
  document.body.classList.add('industrial-ready');
  const themeObserver = new MutationObserver(() => { if(lastPose) render(lastPose.t,lastPose.nodes); });
  themeObserver.observe(document.documentElement,{ attributes:true,attributeFilter:['data-theme'] });
  window.addEventListener('pageshow', () => { if(lastPose) render(lastPose.t,lastPose.nodes); });
  window.addEventListener('pagehide', event => {
    if(event.persisted)return;
    window.renderIndustrialJourney = undefined;
    themeObserver.disconnect();
    renderer.dispose();
    for (const geometry of geometries.values()) geometry.dispose();
    for (const material of materials.values()) material.dispose();
    for (const texture of textures) texture.dispose();
  });
}
