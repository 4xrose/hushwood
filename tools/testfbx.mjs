import fs from 'node:fs';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
const buf = fs.readFileSync('assets_raw/anims/Idle.fbx');
const loader = new FBXLoader();
try {
  const obj = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  console.log('ok', obj.animations?.length, obj.animations?.[0]?.name, obj.animations?.[0]?.tracks?.length, obj.animations?.[0]?.duration);
  console.log(obj.animations?.[0]?.tracks?.slice(0,5).map(t=>t.name));
} catch (e) { console.error('ERR', e.message, e.stack); }
