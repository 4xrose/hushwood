import fs from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const glb = fs.readFileSync('public/assets/characters/suzie.glb');
const jsonLen = glb.readUInt32LE(12);
const gltf = JSON.parse(glb.toString('utf8', 20, 20 + jsonLen));
const glbRest = new Map();
for (const n of gltf.nodes) {
  if (!n.name) continue;
  const r = n.rotation || [0,0,0,1];
  glbRest.set(n.name, new THREE.Quaternion(r[0], r[1], r[2], r[3]));
}
const byUnprefixed = new Map();
for (const name of glbRest.keys()) {
  if (name.startsWith('mixamorig:')) byUnprefixed.set(name.slice('mixamorig:'.length), name);
}
const animations = ['Idle','Walking','Running','Zombie_Walk','Zombie_Run','Zombie_Idle','Zombie_Scream','Crouch_Walk','Look_Around','Praying','Terrified','Sitting_Idle'];
const out = {};
for (const name of animations) {
  const file = `assets_raw/anims/${name}.fbx`;
  if (!fs.existsSync(file)) { console.warn('missing', file); continue; }
  const buf = fs.readFileSync(file);
  const obj = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  const clip = obj.animations?.[0];
  if (!clip) { console.warn('no anim', name); continue; }
  obj.updateMatrixWorld(true);
  const rest = new Map();
  obj.traverse((n) => {
    if (n.name) rest.set(n.name, n.quaternion.clone());
  });
  const groups = new Map();
  let times = [];
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.');
    const bone = track.name.slice(0, dot);
    const prop = track.name.slice(dot + 1);
    const short = bone.replace(/^mixamorig/, '');
    const mapped = byUnprefixed.get(short);
    if (!mapped) continue;
    if (prop === 'quaternion') times = Array.from(track.times);
    if (prop !== 'quaternion' && prop !== 'position') continue;
    if (!groups.has(mapped)) groups.set(mapped, { quat: null, pos: null, fbxName: bone });
    const group = groups.get(mapped);
    if (prop === 'quaternion') group.quat = Array.from(track.values);
    if (prop === 'position') group.pos = Array.from(track.values);
  }
  const bones = {};
  for (const [boneName, group] of groups) {
    if (!group.quat) continue;
    const gRest = glbRest.get(boneName);
    const fRest = rest.get(group.fbxName) || new THREE.Quaternion();
    const offset = gRest.clone().multiply(fRest.clone().invert());
    const q = [];
    for (let i = 0; i < group.quat.length; i += 4) {
      const v = new THREE.Quaternion(group.quat[i], group.quat[i+1], group.quat[i+2], group.quat[i+3]);
      v.premultiply(offset).normalize();
      q.push(+v.x.toFixed(5), +v.y.toFixed(5), +v.z.toFixed(5), +v.w.toFixed(5));
    }
    bones[boneName] = { q };
    if (group.pos) {
      const pos0 = new THREE.Vector3(group.pos[0], group.pos[1], group.pos[2]);
      const p = [];
      for (let i = 0; i < group.pos.length; i += 3) {
        p.push(
          +(group.pos[i] - pos0.x).toFixed(5),
          +(group.pos[i+2] - pos0.z).toFixed(5),
          +(-(group.pos[i+1] - pos0.y)).toFixed(5),
        );
      }
      bones[boneName].p = p;
    }
  }
  out[name] = {
    duration: +clip.duration.toFixed(3),
    times: times.map((t) => +t.toFixed(4)),
    bones,
  };
  console.log(name, clip.duration.toFixed(2), times.length, Object.keys(bones).length, 'bones', (JSON.stringify(out[name]).length/1024).toFixed(0) + 'KB');
}
fs.mkdirSync('public/assets/anims', { recursive: true });
fs.writeFileSync('public/assets/anims/clips.json', JSON.stringify(out));
console.log('total', (fs.statSync('public/assets/anims/clips.json').size/1024/1024).toFixed(2), 'MB');
