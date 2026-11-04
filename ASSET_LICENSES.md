# HUSHWOOD — Asset Licenses & Attribution

This document inventories the third-party assets shipped with HUSHWOOD — The Quiet Cure, the
license each asset is used under, and where it came from. It is provided for players, distributors,
store reviewers and anyone rebuilding the project.

**Summary**

| Source | What was used | License |
|---|---|---|
| Poly Haven | 24 GLB props, 11 PBR texture sets, 1 HDRI | CC0 1.0 Universal (public domain) |
| Mixamo (Adobe) | Suzie character, 12 animation clips | Adobe Mixamo terms (royalty-free use) |
| Mixkit (Envato) | 35 sound effects | Mixkit Free Sound Effects License |
| Google Fonts | Cormorant Garamond, Special Elite | SIL OFL 1.1 / Apache 2.0 |
| Original work | Architecture, set dressing, UI, story, code, synthesized audio | MIT (code) / original project assets |

No third-party asset in this project is used under a "free for personal use only" license. No
attribution is required by Poly Haven or Mixkit; credits are included here as good practice.

---

## 1. Poly Haven — CC0 1.0

Poly Haven releases its models, textures and HDRIs under the
[CC0 1.0 Universal (Public Domain Dedication)](https://creativecommons.org/publicdomain/zero/1.0/).
You may copy, modify, distribute and use them commercially without attribution. Individual authors
are credited on each asset page.

Source: <https://polyhaven.com/>  
License: <https://polyhaven.com/license>

### Models (24)

All models were downloaded at 1K resolution and optimized to GLB (textures resized, geometry
simplified) for mobile rendering. The shipped files are in `public/assets/models/`.

| Asset | Shipped file | Source |
|---|---|---|
| Old Bed Frame | `old_bed_frame.glb` | https://polyhaven.com/a/old_bed_frame |
| Metal Office Desk | `metal_office_desk.glb` | https://polyhaven.com/a/metal_office_desk |
| Gothic Cabinet 01 | `GothicCabinet_01.glb` | https://polyhaven.com/a/GothicCabinet_01 |
| Drawer Cabinet | `drawer_cabinet.glb` | https://polyhaven.com/a/drawer_cabinet |
| Wooden Bookshelf Worn | `wooden_bookshelf_worn.glb` | https://polyhaven.com/a/wooden_bookshelf_worn |
| Wheelchair 01 | `wheelchair_01.glb` | https://polyhaven.com/a/wheelchair_01 |
| Portable Generator | `portable_generator.glb` | https://polyhaven.com/a/portable_generator |
| Vintage Radio Transceiver | `vintage_radio_transceiver.glb` | https://polyhaven.com/a/vintage_radio_transceiver |
| Wall Clock | `wall_clock.glb` | https://polyhaven.com/a/wall_clock |
| Desk Lamp Arm 01 | `desk_lamp_arm_01.glb` | https://polyhaven.com/a/desk_lamp_arm_01 |
| Medical Box | `medical_box.glb` | https://polyhaven.com/a/medical_box |
| Crowbar 01 | `crowbar_01.glb` | https://polyhaven.com/a/crowbar_01 |
| Ornate Mirror 01 | `ornate_mirror_01.glb` | https://polyhaven.com/a/ornate_mirror_01 |
| Vintage Grandfather Clock 01 | `vintage_grandfather_clock_01.glb` | https://polyhaven.com/a/vintage_grandfather_clock_01 |
| Painted Wooden Chair 01 | `painted_wooden_chair_01.glb` | https://polyhaven.com/a/painted_wooden_chair_01 |
| Metal Stool 01 | `metal_stool_01.glb` | https://polyhaven.com/a/metal_stool_01 |
| Wooden Table 01 | `WoodenTable_01.glb` | https://polyhaven.com/a/WoodenTable_01 |
| Vintage Cabinet 01 | `vintage_cabinet_01.glb` | https://polyhaven.com/a/vintage_cabinet_01 |
| Shelf 01 | `Shelf_01.glb` | https://polyhaven.com/a/Shelf_01 |
| School Chair 01 | `SchoolChair_01.glb` | https://polyhaven.com/a/SchoolChair_01 |
| School Desk 01 | `SchoolDesk_01.glb` | https://polyhaven.com/a/SchoolDesk_01 |
| Hanging Industrial Lamp | `hanging_industrial_lamp.glb` | https://polyhaven.com/a/hanging_industrial_lamp |
| Industrial Caged Sconce | `industrial_caged_sconce.glb` | https://polyhaven.com/a/industrial_caged_sconce |
| Vintage Day Bed | `vintage_day_bed.glb` | https://polyhaven.com/a/vintage_day_bed |

### PBR textures (11 sets)

Downloaded as diffuse/normal/roughness/AO maps and converted to 512 px WebP for mobile delivery.
Shipped in `public/assets/textures/`.

| Texture set | Source |
|---|---|
| Decrepit Wallpaper | https://polyhaven.com/a/decrepit_wallpaper |
| Painted Plaster Wall | https://polyhaven.com/a/painted_plaster_wall |
| Dirty Tiles | https://polyhaven.com/a/dirty_tiles |
| Old Wooden Floor 02 | https://polyhaven.com/a/old_wooden_floor_02 |
| Diagonal Parquet | https://polyhaven.com/a/diagonal_parquet |
| Dirty Carpet | https://polyhaven.com/a/dirty_carpet |
| Dark Wood | https://polyhaven.com/a/dark_wood |
| Long White Tiles | https://polyhaven.com/a/long_white_tiles |
| Ceiling Interior | https://polyhaven.com/a/ceiling_interior |
| Painted Metal Shutter | https://polyhaven.com/a/painted_metal_shutter |
| Concrete Floor Damaged 01 | https://polyhaven.com/a/concrete_floor_damaged_01 |

### HDRI (1)

| Asset | Shipped file | Source |
|---|---|---|
| Children's Hospital (1K HDR) | `childrens_hospital_1k.hdr` | https://polyhaven.com/a/childrens_hospital |

Used for image-based lighting and material reflections. The HDRI is not shown as a skybox.

---

## 2. Mixamo (Adobe) — character and animations

**Character:** Suzie, downloaded from [Mixamo](https://www.mixamo.com/).  
**Animations used (12):** Idle, Walking, Running, Zombie Walk, Zombie Run, Zombie Idle, Zombie
Scream, Crouch Walk, Look Around, Praying, Terrified, Sitting Idle.

The character was optimized from the original 49.8 MB GLB to a 2.4 MB skinned GLB. The animations
were retargeted to Suzie's Mixamo rig and baked into `public/assets/anims/clips.json`; no Mixamo
animation files are shipped as standalone assets. The Matron and Sleepwalkers are re-textured,
re-proportioned and accessorized variants of Suzie built for this game.

**License:** Mixamo characters and animations are available for royalty-free use in personal and
commercial projects under Adobe's Mixamo terms. They may not be redistributed as standalone assets
or used to build a competing asset library. This project ships them only as integrated game content.

References:

- Mixamo: <https://www.mixamo.com/>
- Adobe Mixamo FAQ: <https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html>
- Adobe Creative Cloud terms: <https://www.adobe.com/legal/terms.html>

If you fork this project for commercial release, review the current Mixamo/Adobe terms and replace
the character if your distribution model requires it.

---

## 3. Mixkit (Envato) — sound effects

**License:** [Mixkit Free Sound Effects License](https://mixkit.co/license/#sfxFree). Free for
commercial and non-commercial projects, no attribution required. Mixkit assets may not be
redistributed as standalone sound libraries or claimed as original work. Here they are integrated
into the game and, in some cases, trimmed and layered at runtime.

All 35 files are in `public/assets/audio/`.

| Game file | Mixkit SFX ID | Preview source |
|---|---|---|
| `ambience_horror.mp3` | 2482 | https://assets.mixkit.co/active_storage/sfx/2482/2482-preview.mp3 |
| `ambience_heartbeat.mp3` | 497 | https://assets.mixkit.co/active_storage/sfx/497/497-preview.mp3 |
| `bell_hand.mp3` | 931 | https://assets.mixkit.co/active_storage/sfx/931/931-preview.mp3 |
| `bell_church.mp3` | 628 | https://assets.mixkit.co/active_storage/sfx/628/628-preview.mp3 |
| `bell_low.mp3` | 623 | https://assets.mixkit.co/active_storage/sfx/623/623-preview.mp3 |
| `bell_loop.mp3` | 621 | https://assets.mixkit.co/active_storage/sfx/621/621-preview.mp3 |
| `breath_strong.mp3` | 2232 | https://assets.mixkit.co/active_storage/sfx/2232/2232-preview.mp3 |
| `breath_child.mp3` | 2238 | https://assets.mixkit.co/active_storage/sfx/2238/2238-preview.mp3 |
| `breath_demon.mp3` | 2240 | https://assets.mixkit.co/active_storage/sfx/2240/2240-preview.mp3 |
| `clock_tick.mp3` | 1059 | https://assets.mixkit.co/active_storage/sfx/1059/1059-preview.mp3 |
| `floor_creak.mp3` | 337 | https://assets.mixkit.co/active_storage/sfx/337/337-preview.mp3 |
| `floor_creak_long.mp3` | 178 | https://assets.mixkit.co/active_storage/sfx/178/178-preview.mp3 |
| `door_open.mp3` | 195 | https://assets.mixkit.co/active_storage/sfx/195/195-preview.mp3 |
| `door_close.mp3` | 189 | https://assets.mixkit.co/active_storage/sfx/189/189-preview.mp3 |
| `door_scary.mp3` | 190 | https://assets.mixkit.co/active_storage/sfx/190/190-preview.mp3 |
| `heartbeat_slow.mp3` | 494 | https://assets.mixkit.co/active_storage/sfx/494/494-preview.mp3 |
| `heartbeat_fast.mp3` | 493 | https://assets.mixkit.co/active_storage/sfx/493/493-preview.mp3 |
| `glass_break.mp3` | 759 | https://assets.mixkit.co/active_storage/sfx/759/759-preview.mp3 |
| `impact.mp3` | 788 | https://assets.mixkit.co/active_storage/sfx/788/788-preview.mp3 |
| `key_lock.mp3` | 2842 | https://assets.mixkit.co/active_storage/sfx/2842/2842-preview.mp3 |
| `safe_lock.mp3` | 2853 | https://assets.mixkit.co/active_storage/sfx/2853/2853-preview.mp3 |
| `paper.mp3` | 1530 | https://assets.mixkit.co/active_storage/sfx/1530/1530-preview.mp3 |
| `page.mp3` | 1104 | https://assets.mixkit.co/active_storage/sfx/1104/1104-preview.mp3 |
| `phone_ring.mp3` | 1356 | https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3 |
| `radio_static.mp3` | 2561 | https://assets.mixkit.co/active_storage/sfx/2561/2561-preview.mp3 |
| `radio_creepy.mp3` | 2558 | https://assets.mixkit.co/active_storage/sfx/2558/2558-preview.mp3 |
| `switch_click.mp3` | 2585 | https://assets.mixkit.co/active_storage/sfx/2585/2585-preview.mp3 |
| `typewriter.mp3` | 1125 | https://assets.mixkit.co/active_storage/sfx/1125/1125-preview.mp3 |
| `whoosh.mp3` | 2623 | https://assets.mixkit.co/active_storage/sfx/2623/2623-preview.mp3 |
| `horror_transition.mp3` | 2484 | https://assets.mixkit.co/active_storage/sfx/2484/2484-preview.mp3 |
| `terror_sweep.mp3` | 2630 | https://assets.mixkit.co/active_storage/sfx/2630/2630-preview.mp3 |
| `water_bubble.mp3` | 1317 | https://assets.mixkit.co/active_storage/sfx/1317/1317-preview.mp3 |
| `water_splash.mp3` | 1311 | https://assets.mixkit.co/active_storage/sfx/1311/1311-preview.mp3 |
| `footsteps_tunnel.mp3` | 543 | https://assets.mixkit.co/active_storage/sfx/543/543-preview.mp3 |
| `clock_chime.mp3` | 1058 | https://assets.mixkit.co/active_storage/sfx/1058/1058-preview.mp3 |

The 35 files above correspond to the 35 entries in `tools/fetch-audio.mjs`. Runtime-synthesized
tones, drones and sting layers are original WebAudio code in `src/core/Audio.js` and are not
Mixkit assets.

---

## 4. Fonts

### Cormorant Garamond

- Files: `cormorant-latin.woff2`, `cormorant-italic-latin.woff2`
- Designer: Christian Thalmann
- License: **SIL Open Font License 1.1**
- Source: <https://fonts.google.com/specimen/Cormorant+Garamond>
- License text: <https://scripts.sil.org/OFL>

### Special Elite

- File: `special-elite-latin.woff2`
- Designer: Brian J. Bonislawsky / Astigmatic (AOETI)
- License: **Apache License 2.0**
- Source: <https://fonts.google.com/specimen/Special+Elite>
- License text: <https://www.apache.org/licenses/LICENSE-2.0>

Both fonts are subset to the Latin glyphs used by the interface. They are embedded in the game and
are not sold or redistributed as font software.

---

## 5. Original work

The following were created specifically for HUSHWOOD and are not third-party assets:

- Level architecture, room shells, corridors, stairs, basement, attic and bell loft.
- Procedural props and set dressing built from Three.js geometry and Poly Haven materials.
- All puzzle interfaces, mirror safe, sleep console, generator panel, bell mechanism.
- HUD, title screen, casebook, map, modal system, touch controls and rotate card.
- Story, letters, patient charts, objectives, dialogue and endings.
- Matron/Sleepwalker costumes, blindfold, apron, cap, bell and material treatments (derived from the
  licensed Mixamo base mesh).
- Synthesized audio: room drone, stings, bell partials, footsteps and UI tones.
- Game code, build tooling and the Hushwood name/mark.

These original elements are released with the source under the MIT License (see `LICENSE`), except
that the Mixamo-derived character meshes and animations remain subject to Adobe's terms.

---

## 6. Software dependencies

| Package | License | Use |
|---|---|---|
| [three](https://threejs.org/) | MIT | 3D renderer |
| [@dimforge/rapier3d-compat](https://rapier.rs/) | Apache-2.0 | Physics and character controller |
| [howler](https://howlerjs.com/) | MIT | Positional audio playback |
| [vite](https://vitejs.dev/) | MIT | Build tool and dev server |
| [@capacitor/core](https://capacitorjs.com/) / [@capacitor/android](https://capacitorjs.com/) | MIT | Android wrapper |
| [@gltf-transform/cli](https://gltf-transform.dev/) | MIT | Build-time GLB optimization |
| [sharp](https://sharp.pixelplumbing.com/) | Apache-2.0 | Build-time icon/image processing |

Full dependency license texts are available in each package under `node_modules/`.

---

## 7. Attribution text for store listings

If a store or publisher requires a compact credits block:

> HUSHWOOD — The Quiet Cure uses CC0 models, textures and HDRI from Poly Haven; a character and
> animations from Mixamo (Adobe); sound effects from Mixkit (Envato); Cormorant Garamond under the
> SIL Open Font License; and Special Elite under the Apache License 2.0. Architecture, story, UI and
> code are original work.

---

*Last updated: November 2026. If you add or replace an asset, update this file and keep the source
URL and license with the asset.*
