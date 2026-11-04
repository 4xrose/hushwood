import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const TRACKS = {
  ambience_horror: 'https://assets.mixkit.co/active_storage/sfx/2482/2482-preview.mp3',
  ambience_heartbeat: 'https://assets.mixkit.co/active_storage/sfx/497/497-preview.mp3',
  bell_hand: 'https://assets.mixkit.co/active_storage/sfx/931/931-preview.mp3',
  bell_church: 'https://assets.mixkit.co/active_storage/sfx/628/628-preview.mp3',
  bell_low: 'https://assets.mixkit.co/active_storage/sfx/623/623-preview.mp3',
  bell_loop: 'https://assets.mixkit.co/active_storage/sfx/621/621-preview.mp3',
  breath_strong: 'https://assets.mixkit.co/active_storage/sfx/2232/2232-preview.mp3',
  breath_child: 'https://assets.mixkit.co/active_storage/sfx/2238/2238-preview.mp3',
  breath_demon: 'https://assets.mixkit.co/active_storage/sfx/2240/2240-preview.mp3',
  clock_tick: 'https://assets.mixkit.co/active_storage/sfx/1059/1059-preview.mp3',
  floor_creak: 'https://assets.mixkit.co/active_storage/sfx/337/337-preview.mp3',
  floor_creak_long: 'https://assets.mixkit.co/active_storage/sfx/178/178-preview.mp3',
  door_open: 'https://assets.mixkit.co/active_storage/sfx/195/195-preview.mp3',
  door_close: 'https://assets.mixkit.co/active_storage/sfx/189/189-preview.mp3',
  door_scary: 'https://assets.mixkit.co/active_storage/sfx/190/190-preview.mp3',
  heartbeat_slow: 'https://assets.mixkit.co/active_storage/sfx/494/494-preview.mp3',
  heartbeat_fast: 'https://assets.mixkit.co/active_storage/sfx/493/493-preview.mp3',
  glass_break: 'https://assets.mixkit.co/active_storage/sfx/759/759-preview.mp3',
  impact: 'https://assets.mixkit.co/active_storage/sfx/788/788-preview.mp3',
  key_lock: 'https://assets.mixkit.co/active_storage/sfx/2842/2842-preview.mp3',
  safe_lock: 'https://assets.mixkit.co/active_storage/sfx/2853/2853-preview.mp3',
  paper: 'https://assets.mixkit.co/active_storage/sfx/1530/1530-preview.mp3',
  page: 'https://assets.mixkit.co/active_storage/sfx/1104/1104-preview.mp3',
  phone_ring: 'https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3',
  radio_static: 'https://assets.mixkit.co/active_storage/sfx/2561/2561-preview.mp3',
  radio_creepy: 'https://assets.mixkit.co/active_storage/sfx/2558/2558-preview.mp3',
  switch_click: 'https://assets.mixkit.co/active_storage/sfx/2585/2585-preview.mp3',
  typewriter: 'https://assets.mixkit.co/active_storage/sfx/1125/1125-preview.mp3',
  whoosh: 'https://assets.mixkit.co/active_storage/sfx/2623/2623-preview.mp3',
  horror_transition: 'https://assets.mixkit.co/active_storage/sfx/2484/2484-preview.mp3',
  terror_sweep: 'https://assets.mixkit.co/active_storage/sfx/2630/2630-preview.mp3',
  water_bubble: 'https://assets.mixkit.co/active_storage/sfx/1317/1317-preview.mp3',
  water_splash: 'https://assets.mixkit.co/active_storage/sfx/1311/1311-preview.mp3',
  footsteps_tunnel: 'https://assets.mixkit.co/active_storage/sfx/543/543-preview.mp3',
  clock_chime: 'https://assets.mixkit.co/active_storage/sfx/1058/1058-preview.mp3',
};

const dir = join(process.cwd(), 'public', 'assets', 'audio');
await mkdir(dir, { recursive: true });
for (const [name, url] of Object.entries(TRACKS)) {
  const path = join(dir, `${name}.mp3`);
  try {
    const info = await stat(path);
    if (info.size > 1000) { console.log('  ✓', name); continue; }
  } catch {}
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HushwoodAssetFetcher/1.0' } });
      if (!res.ok) throw new Error(`${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(path, buf);
      console.log('  ↓', name, `${(buf.length / 1024).toFixed(0)} KB`);
      ok = true;
    } catch (error) {
      if (attempt === 2) console.log('  ! failed', name, error.message);
      else await new Promise((r) => setTimeout(r, 800));
    }
  }
}
console.log('Audio done.');
