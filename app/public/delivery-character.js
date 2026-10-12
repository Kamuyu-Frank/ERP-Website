/* Proportioned, jointed people for the customer handover close-up. */
export function makeDeliveryPerson(parent, kit, { shirt = '#35516b', courier = false } = {}) {
  const { THREE, mat, box, sphere, mesh, group, geometries } = kit;
  const g = group(parent), skin = mat('#a77b59', 0, .86), cloth = mat(shirt, 0, .92);
  const trousers = mat('#28343d', 0, .94), shoes = mat('#242625', .02, .8);
  const hair = mat('#302923', 0, .96);
  const geometry = (name, create) => {
    if (!geometries.has(name)) geometries.set(name, create());
    return geometries.get(name);
  };
  const jointGeometry = geometry('person-joint', () => new THREE.SphereGeometry(1, 16, 12));
  const limbGeometry = geometry('person-limb', () => new THREE.CylinderGeometry(.86, 1, 1, 16));
  function ellipsoid(root, x, y, z, sx, sy, sz, material) {
    const m = mesh(root, jointGeometry, material, x, y, z); m.scale.set(sx, sy, sz); return m;
  }
  function bone(root, a, b, radius, material) {
    const m = mesh(root, limbGeometry, material, 0, 0, 0);
    const update = (start, end) => {
      const delta = end.clone().sub(start);
      m.position.copy(start).add(end).multiplyScalar(.5);
      m.scale.set(radius, delta.length(), radius);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
    };
    update(a, b); return { m, update };
  }
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  const bodyGeometry = geometry('person-shirt', () => new THREE.LatheGeometry([
    new THREE.Vector2(.14,0),new THREE.Vector2(.17,.035),new THREE.Vector2(.175,.15),
    new THREE.Vector2(.205,.34),new THREE.Vector2(.225,.41),new THREE.Vector2(.16,.475),
    new THREE.Vector2(.065,.50)
  ], 24));
  const torso = mesh(g, bodyGeometry, cloth, 0, .94, 0); torso.scale.z = .62;
  ellipsoid(g,0,.93,0,.165,.09,.11,trousers);
  box(g,0,.96,.002,.32,.025,.21,mat('#323331'));
  box(g,0,.96,.112,.035,.025,.015,mat('#92938a',.65,.3));
  // Shirt placket, collar and a breast pocket replace the flat block torso.
  box(g,0,1.23,.133,.012,.32,.008,mat('#263e52'));
  for(const y of [1.08,1.17,1.26,1.35])sphere(g,.005,y,.14,.007,mat('#bec6c8'));
  box(g,.12,1.30,.124,.075,.06,.012,cloth);
  bone(g,v(0,1.43,0),v(0,1.53,0),.043,skin);
  for(const side of [-1,1]) {
    const collar=box(g,side*.044,1.45,.04,.055,.022,.075,mat('#bfcbd0'));
    collar.rotation.z=side*.3;
  }
  const head = group(g); head.position.y = 1.65;
  const headGeometry = geometry('person-head', () => new THREE.SphereGeometry(1, 32, 24));
  const face = mesh(head,headGeometry,skin,0,0,0);face.scale.set(.102,.142,.096);
  ellipsoid(head,0,.103,-.012,.105,.044,.092,hair);
  ellipsoid(head,0,.033,-.075,.095,.11,.034,hair);
  for(const side of [-1,1]) {
    ellipsoid(head,side*.104,-.002,0,.014,.031,.017,skin);
    ellipsoid(head,side*.039,.027,.083,.024,.010,.010,mat('#c9b7a2'));
    ellipsoid(head,side*.039,.027,.093,.008,.007,.004,mat('#332c27'));
    const brow=box(head,side*.039,.052,.09,.041,.006,.007,hair);brow.rotation.z=side*-.08;
  }
  ellipsoid(head,0,-.004,.098,.013,.029,.017,skin);
  ellipsoid(head,0,-.052,.084,.025,.004,.006,mat('#7c4e3b'));
  if(courier) {
    ellipsoid(head,0,.113,-.009,.111,.04,.097,cloth);
    const visor=box(head,0,.10,.095,.17,.012,.10,cloth);visor.rotation.x=-.12;
    for(const side of [-1,1])box(g,side*.12,1.23,.137,.025,.33,.007,mat('#c5c9a6'));
  }
  const legs=[];
  for(const side of [-1,1]) {
    const hip=group(g,side*.10);hip.position.y=.91;
    bone(hip,v(0,0,0),v(0,-.40,.018),.073,trousers);
    const knee=group(hip,0,.018);knee.position.y=-.40;
    bone(knee,v(0,0,0),v(0,-.39,0),.056,trousers);
    ellipsoid(knee,0,-.405,.05,.063,.047,.135,shoes);
    legs.push({ hip,knee });
  }
  const arms=[];
  function hand() {
    const root=group(g);
    ellipsoid(root,0,0,0,.036,.051,.021,skin);
    for(let i=0;i<4;i++) {
      const x=-.026+i*.017;
      bone(root,v(x,-.035,.002),v(x,-.065,.008),.007,skin);
      bone(root,v(x,-.065,.008),v(x,-.075,.027),.0065,skin);
      ellipsoid(root,x,-.075,.027,.0065,.008,.007,skin);
    }
    bone(root,v(.032,.012,.005),v(.044,-.018,.025),.009,skin);
    return root;
  }
  for(const side of [-1,1]) {
    const shoulder=v(side*.218,1.37,0);
    const elbow=v(side*.25,1.12,.025),wrist=v(side*.25,.88,.03);
    ellipsoid(g,shoulder.x,shoulder.y,shoulder.z,.079,.082,.076,cloth);
    const upper=bone(g,shoulder,elbow,.069,cloth);
    const joint=ellipsoid(g,elbow.x,elbow.y,elbow.z,.048,.048,.048,skin);
    const lower=bone(g,elbow,wrist,.042,skin),palm=hand();
    arms.push({ side,shoulder,upper,joint,lower,palm });
  }
  function setHands(left,right,grip=0) {
    for(const [i,target] of [left,right].entries()) {
      const arm=arms[i],start=arm.shoulder;
      const delta=target.clone().sub(start),distance=Math.min(.525,Math.max(.03,delta.length()));
      const direction=delta.normalize(),end=start.clone().addScaledVector(direction,distance);
      const along=(.28*.28-.26*.26+distance*distance)/(2*distance);
      const bend=v(arm.side,-.6,-.1);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
      const elbow=start.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,.28*.28-along*along)));
      arm.upper.update(start,elbow);arm.joint.position.copy(elbow);arm.lower.update(elbow,end);
      arm.palm.position.copy(end);arm.palm.rotation.set(-.2*grip,arm.side*Math.PI/2*grip,arm.side*.12);
    }
  }
  function walk(stride=0) {
    legs[0].hip.rotation.x=stride;legs[1].hip.rotation.x=-stride;
    legs[0].knee.rotation.x=Math.max(0,-stride)*.55;legs[1].knee.rotation.x=Math.max(0,stride)*.55;
  }
  setHands(v(-.25,.88,.03),v(.25,.88,.03));
  return {g,head,hands:arms.map(arm=>arm.palm),setHands,walk};
}
