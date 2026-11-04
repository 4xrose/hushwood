import { readFile } from 'node:fs/promises';
const index = JSON.parse(await readFile('mixkit-index.json', 'utf8'));
for (const [category, items] of Object.entries(index)) {
  for (const item of items) {
    if (/footstep|walk|step|creak|wood floor|wooden floor/i.test(item.title) && /footstep/i.test(category + item.title)) {
      console.log(category, '|', item.title, '|', item.url);
    }
  }
}
console.log('\nFull footsteps:');
for (const item of index.footsteps || []) console.log(item.title, '|', item.url);
console.log('\nFull wood:');
for (const item of index.wood || []) console.log(item.title, '|', item.url);
