import fs from 'node:fs';
const b = fs.readFileSync('public/assets/characters/suzie.glb');
const jsonLen = b.readUInt32LE(12);
const json = JSON.parse(b.toString('utf8', 20, 20 + jsonLen));
const names = (json.nodes||[]).map(n=>n.name).filter(n=>n && /mixamorig/i.test(n));
console.log(names.slice(0,80));
console.log('count', names.length, 'meshes', (json.meshes||[]).length, 'skins', (json.skins||[]).length, 'anims', (json.animations||[]).length);
console.log('skins joints', json.skins?.[0]?.joints?.length);
