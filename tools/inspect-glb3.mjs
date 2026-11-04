import fs from 'node:fs';
const b = fs.readFileSync('public/assets/characters/suzie.glb');
const jsonLen = b.readUInt32LE(12);
const json = JSON.parse(b.toString('utf8', 20, 20 + jsonLen));
for (const i of [72, ...(json.nodes[72]?.children||[]).slice(0,10)]) console.log(i, json.nodes[i]?.name, 't', json.nodes[i]?.translation, 'r', json.nodes[i]?.rotation, 's', json.nodes[i]?.scale, 'mesh', json.nodes[i]?.mesh, 'skin', json.nodes[i]?.skin, 'kids', json.nodes[i]?.children?.length);
const hipsIndex = json.nodes.findIndex(n=>n.name==='mixamorig:Hips');
console.log('hips index', hipsIndex, 'parent search', json.nodes.findIndex(n=>n.children?.includes(hipsIndex)), json.nodes[json.nodes.findIndex(n=>n.children?.includes(hipsIndex))]?.name);
