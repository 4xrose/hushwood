import fs from 'node:fs';
const b = fs.readFileSync('public/assets/characters/suzie.glb');
const jsonLen = b.readUInt32LE(12);
const json = JSON.parse(b.toString('utf8', 20, 20 + jsonLen));
for (const n of json.nodes) if (/mixamorig:(Hips|Spine|Head|LeftArm)$/.test(n.name||'')) console.log(n.name, 't', n.translation, 'r', n.rotation, 's', n.scale);
const mesh = json.meshes?.[0]; console.log('mesh', mesh?.name, 'prim', mesh?.primitives?.[0]?.attributes);
console.log('scenes', json.scenes, 'scene', json.scene);
