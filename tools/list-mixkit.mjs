import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const dir = 'assets_raw/mixkit_pages';
const index = {};
for (const file of await readdir(dir)) {
  if (!file.endsWith('.html')) continue;
  const html = await readFile(join(dir, file), 'utf8');
  const category = file.replace('.html', '');
  const items = [];
  const re = /<div class="item-grid-card[\s\S]*?data-audio-player-preview-url-value="([^"]+)"[\s\S]*?<h2 class="item-grid-card__title">\s*([\s\S]*?)\s*<\/h2>/g;
  let match;
  while ((match = re.exec(html))) {
    items.push({ title: match[2].replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim(), url: match[1] });
  }
  index[category] = items;
}
await writeFile('mixkit-index.json', JSON.stringify(index, null, 2));
for (const [category, items] of Object.entries(index)) {
  console.log(`\n## ${category} (${items.length})`);
  for (const item of items.slice(0, 12)) console.log(item.title, '::', item.url);
}
