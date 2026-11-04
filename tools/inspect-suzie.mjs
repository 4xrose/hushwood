import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
const io = new NodeIO();
const doc = await io.read('public/assets/characters/suzie.glb');
for (const node of doc.getRoot().listNodes()) {
  if (node.getName().toLowerCase().includes('mixamorig') || node.getName().toLowerCase().includes('hips')) console.log(node.getName());
}
console.log('nodes', doc.getRoot().listNodes().length, 'anims', doc.getRoot().listAnimations().length);
