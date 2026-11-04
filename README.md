# HUSHWOOD — The Quiet Cure

A first-person survival horror game set in the Hushwood Institute, an abandoned 1960s sleep clinic. You are Mara Vale, a research physician who returns to the clinic after a letter arrives in the handwriting of a patient who has been asleep for three years. The doors seal at 3:17 AM. To leave, you must wake the house.

Built with **Three.js + Rapier + Howler.js**, packaged for Android with **Capacitor**.

![Hushwood bell icon](public/icons/icon-512.png)

---

## The game

- **A blind enemy who hunts by sound.** The Matron cannot see you. Walking, sprinting, prying, dropped objects and flashlight clicks all make noise. Learn what the house can hear.
- **Hiding has two verbs.** Step into a wardrobe, beneath a bed or behind a curtain, then **hold your breath** when she leans close.
- **Light is a second predator.** In the basement, Sleepwalkers are deaf but drawn to your flashlight. The tool that keeps you alive upstairs calls something else below.
- **Observation puzzles.** Patient charts set a sleep console. A mirror routes moonlight into a safe. Four childhood notes become the final bell chord.
- **A complete escape chain.** Pry the hatch, restore power, read the charts, wake the console, open the office, solve the mirror safe, climb to the bell loft, ring the Waking Bell, and survive the last hunt.
- **A memory-loop death rule.** Losing composure returns you to the last candle with your keys and puzzle progress intact. Death is a setback, not a reset.
- **Mobile-first controls** with a virtual stick, drag-look, large action buttons, safe-area insets, haptics, fullscreen/orientation lock, and a landscape gate.

Session length: roughly 25–40 minutes. One house, one night.

---

## Quick start

Requirements: **Node.js 18+** and a WebGL 2 capable browser.

```bash
npm install
npm run dev
```

Open the shown local URL (default `http://localhost:5173`). For a phone on the same network, use the host machine's LAN address and the printed port.

Production build:

```bash
npm run build
npm run preview
```

The build is written to `dist/`. The Vite configuration uses a relative base, so `dist/` can be served from a web root or a sub-path.

---

## Controls

### Desktop

| Action | Key |
|---|---|
| Move | `W A S D` / arrow keys |
| Look | Mouse (click to lock the pointer) |
| Interact / read / take / hide | `E` or `Enter` |
| Crouch | `C` or `Ctrl` |
| Sprint | `Shift` |
| Hold breath (while hiding) | `Space` |
| Flashlight | `F` |
| Throw bottle | `Q` |
| Casebook | `Tab` or `J` |
| Map | `M` |
| Pause | `Esc` |

### Mobile (landscape)

- **Left thumb:** virtual stick to move.
- **Right side:** drag anywhere on the look zone to turn.
- **Use:** context action button. It lights up when something is in reach.
- **Run / Crouch:** hold to sprint or crouch. Crouching is slower and quieter.
- **Breath:** appears while hidden. Hold it when the Matron is close.
- **Light:** toggles the flashlight. Drains battery and makes a small click.
- **Pause / Casebook:** top-right buttons.

On the first tap the game requests fullscreen and a landscape orientation lock. If the device refuses the lock (notably iOS Safari), a rotate card covers the game until the phone is turned sideways.

---

## Objective chain (spoilers)

<details>
<summary>Open the full escape route</summary>

1. **Intake → Reception.** Take the flashlight from the reception desk.
2. **Day Room / Archive.** Take the crowbar from beside the day-room hearth.
3. **Archive.** Pry open the brass-rimmed service hatch and climb down.
4. **Basement.** Pry the nailed fuse cabinet, take the ceramic fuse, install it in the generator panel.
5. **Generator.** Prime the fuel line with the hold-and-release pressure gesture (release inside the green band), set the three breakers, then start the generator.
6. **Ward / Treatment.** Read the four patient charts. Their sleep stages set the console dials.
7. **Sleep console.** Set each bed to the stage written on its chart. This reveals the office key.
8. **Office.** Unlock the office, read the mirror warning, and set the four mirror panels to the moonlight pattern. The safe opens.
9. **Safe.** Take the Waking Key. Use it on the attic hatch in the Observation room.
10. **Bell loft.** Ring the children's notes in order, youngest to oldest. The final hunt begins.
11. **Grand Foyer.** Survive the Matron, reach the front doors, and leave.

</details>

---

## Project structure

```text
src/
  core/          State/save system, input, audio, story text
  world/         Architecture, level data, props, doors, lighting,
                 set pieces, static batching, navigation
  player/        Rapier character controller, flashlight, hiding/breath
  enemies/       Matron + Sleepwalker AI, animation retargeting
  ui/            HUD, title, casebook, map, settings, puzzles
  game/          Lifecycle, interactions, saves, endings
  styles.css     All interface and overlay styling
public/
  assets/        GLB props, PBR textures, HDRI, Suzie, animations, SFX
  fonts/         Cormorant Garamond + Special Elite
  icons/         PWA and Android icon source art
  manifest.webmanifest
  sw.js          Offline cache and app-shell strategy
android/         Capacitor Android project (generated, synced)
tools/           Asset fetching/processing and icon generation
```

### Systems

- **Physics:** Rapier kinematic character controller with a 0.6 m radius capsule. Doors, hiding spots and set pieces use trigger volumes.
- **Rendering:** Three.js `WebGLRenderer`, ACES tone mapping, PMREM environment from a Poly Haven HDRI, merged static geometry, instanced rain, a fixed 5/7/10 point-light budget on low/medium/high, and character frustum culling.
- **Audio:** Howler.js with an HRTF-ish positional listener, synthesized room tone, procedural stings, and Mixkit ambience/SFX. Headphones are recommended.
- **Saving:** `localStorage` under `hushwood.save.v1`. Progress is checkpointed after objectives and puzzle steps. New Game erases the current run after confirmation. The boot sequence restores world geometry, doors, pickups and enemy state.
- **AI:** The Matron patrols nav nodes, investigates noise events, searches around the last heard position, and can hear the player's breathing when hidden. Sleepwalkers patrol the cellar and steer toward the flashlight cone. A catch costs composure, triggers a candle respawn, and preserves progress.

---

## Android packaging

The native project is already in `android/`. To build an APK:

### Prerequisites

- **JDK 17** (Android Gradle Plugin 8.x requires it). Android Studio bundles a suitable JDK.
- **Android SDK 34** and platform tools, installed through Android Studio or `sdkmanager`.
- `JAVA_HOME` and `ANDROID_HOME` set.
- Node.js 18+.

### Build

```bash
npm install
npm run build
node node_modules/@capacitor/cli/bin/capacitor sync android
cd android
./gradlew assembleDebug
```

On Windows:

```powershell
npm run build
node node_modules/@capacitor/cli/bin/capacitor sync android
cd android
.\gradlew.bat assembleDebug
```

The debug APK is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a connected device:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Release

Open `android/` in Android Studio and use **Build → Generate Signed Bundle / APK**. Create or select a keystore, choose `release`, and keep the keystore outside the repository. The application ID is `com.hushwood.quietcure`.

The native configuration already:

- locks the activity to **sensor landscape**;
- enters immersive fullscreen and hides system bars;
- uses the Hushwood bell icon and dark splash screen;
- serves the bundled `dist/` over Capacitor's local `https://localhost`;
- keeps the WebView debuggable only in debug builds.

> This workspace does not include a JDK or Android SDK, so the web build and native scaffold were verified here, but the final APK compile must be run on a machine with the Android toolchain installed.

### PWA install

`dist/` is also a complete installable PWA. Serve it over HTTPS (or `localhost`), open it in Chrome/Android, and choose **Install app**. The manifest requests fullscreen, landscape orientation, and a maskable icon. The service worker pre-caches the shell and runtime-caches props, textures, audio and fonts after first use, so an installed copy can launch offline once it has been played through.

---

## Performance notes

The foyer is the heaviest view. On the development machine, the merge pass reduces the static world from ~1,563 objects to ~150 merged meshes. The foyer renders at roughly **700 draw calls / 500k triangles** with all four characters present on high quality, and the light budget is capped at 10 (high), 7 (medium) or 5 (low). Phones default to medium quality on first launch, with a 1.25 pixel-ratio cap and film grain disabled.

If a device struggles:

- Set **Settings → Quality** to `low` (no shadows, 1.0 pixel-ratio cap, 5 lights).
- Turn off **Film grain**.
- Use headphones; the game is designed around directional audio, not visual spotting.

---

## Asset credits

All third-party assets and licenses are documented in [ASSET_LICENSES.md](ASSET_LICENSES.md). In summary:

- **Poly Haven** models, PBR textures and HDRI — CC0 1.0.
- **Mixamo** character (Suzie) and animations — Adobe Mixamo terms; retargeted and modified for this game.
- **Mixkit** sound effects — Mixkit Free Sound Effects License.
- **Cormorant Garamond** — SIL Open Font License 1.1.
- **Special Elite** — Apache License 2.0.
- Architecture, set dressing, puzzle interfaces, story, code and synthesized audio — original work for HUSHWOOD.

---

## QA checklist

- [x] New game → intro → flashlight → crowbar → hatch → basement fuse → prime → breakers → power.
- [x] Save/reload restores hatch, fuse cabinet, installed fuse, generator state, lights and objective.
- [x] Charts, sleep console, office key, office door, mirror safe and Waking Key.
- [x] Attic hatch, bell chord, final hunt, front-door escape and ending.
- [x] Hiding, breath, Sleepwalker light attraction, Matron hearing, catch/respawn.
- [x] Pause, casebook, map, settings, quality switching, touch layout.
- [x] Desktop pointer lock with touch controls auto-hidden, plus forced touch-mode display.
- [x] Production build, installable PWA, service-worker shell and hashed JS/CSS precache.

See [DESIGN.md](DESIGN.md) for the full design bible, level map, lore and puzzle specifications.

## License

The game's source code is released under the MIT License (see [LICENSE](LICENSE)). Third-party art, audio, fonts and character assets remain under their own licenses; see [ASSET_LICENSES.md](ASSET_LICENSES.md).
