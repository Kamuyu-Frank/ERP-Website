import { expect, test } from 'bun:test';
import * as THREE from '../public/vendor/three/three.module.min.js';
import { makeDeliveryPerson } from '../public/delivery-character.js';

function character() {
  const scene = new THREE.Scene(), geometries = new Map();
  const mat = color => new THREE.MeshStandardMaterial({ color });
  const mesh = (parent, geometry, material, x, y, z) => {
    const node = new THREE.Mesh(geometry, material); node.position.set(x,y,z); parent.add(node); return node;
  };
  const kit = {
    THREE, mat, geometries, mesh,
    group(parent,x=0,z=0) { const g=new THREE.Group();g.position.set(x,0,z);parent.add(g);return g; },
    box(parent,x,y,z,w,h,d,material) { return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z); },
    sphere(parent,x,y,z,r,material) { return mesh(parent,new THREE.SphereGeometry(r,12,8),material,x,y,z); },
  };
  return makeDeliveryPerson(scene,kit);
}

test('both hands reach the carton grip and return to the same pose after paying', () => {
  const person=character();
  const left=new THREE.Vector3(-.23,1.09,.41),right=new THREE.Vector3(.23,1.09,.41);
  person.setHands(left,right,1);
  for(const [index,target] of [left,right].entries()) expect(person.hands[index].position.distanceTo(target)).toBeLessThan(1e-8);
  const before=person.hands.map(hand=>hand.position.toArray());
  person.setHands(left,new THREE.Vector3(.29,1.27,.37),1);
  person.setHands(left,right,1);
  expect(person.hands.map(hand=>hand.position.toArray())).toEqual(before);
  expect(left.toArray()).toEqual([-.23,1.09,.41]);
});

test('unreachable hand targets keep joints finite and inside the arm reach', () => {
  const person=character();
  person.setHands(new THREE.Vector3(-10,20,30),new THREE.Vector3(10,20,30),1);
  for(const [index,hand] of person.hands.entries()) {
    const shoulder=new THREE.Vector3(index===0?-.218:.218,1.37,0);
    expect(hand.position.distanceTo(shoulder)).toBeLessThanOrEqual(.52500001);
  }
  person.g.updateMatrixWorld(true);
  person.g.traverse(node=>{
    expect(node.matrixWorld.elements.every(Number.isFinite)).toBe(true);
    if(node.isMesh)expect([...node.geometry.attributes.position.array].every(Number.isFinite)).toBe(true);
  });
});
