import fs from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
const buf = fs.readFileSync('assets_raw/anims/Idle.fbx');
const obj = new FBXLoader().parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
obj.updateMatrixWorld(true);
const names = ['mixamorigHips','mixamorigSpine','mixamorigSpine1','mixamorigSpine2','mixamorigNeck','mixamorigHead','mixamorigLeftArm','mixamorigLeftForeArm','mixamorigLeftUpLeg','mixamorigLeftLeg'];
for (const n of names) {
  const b = obj.getObjectByName(n);
  console.log(n, 'pos', b?.position.toArray(), 'quat', b?.quaternion.toArray(), 'scale', b?.scale.toArray());
}
const anim = obj.animations[0];
for (const tr of anim.tracks.slice(0,12)) {
  console.log(tr.name, tr.values.length, Array.from(tr.values.slice(0,8)).map(v=>+v.toFixed(3)));
}
