# HUSHWOOD — The Quiet Cure
### Game & Level Design Bible (v1.0)

> Hushwood Institute treated insomnia with silence.  
> Tonight, the silence is treating you.

**Genre:** First-person survival horror  
**Platform:** Android (installable PWA / Chrome), desktop supported  
**Engine:** Three.js + WebAudio, all visual/audio assets generated in-project  
**Session:** 25–40 minutes, one house, one night  
**Target:** Complete and finishable, not a systems demo

---

## 1. Original identity

### Narrative

Hushwood Institute, 1961. A private sleep clinic built around **the Quiet Cure**: an experimental
therapy that used sensory deprivation, low-frequency resonance, and "waking chords" to force the
brain out of intractable insomnia.

You are **Mara Vale**, a research physician who returned after receiving a letter in the
handwriting of a patient who has been asleep for three years. The front doors seal behind you at
**3:17 AM**. The staff are gone. The patients are not.

The **Matron** still performs her rounds. Her eyes are sewn shut. She wears a brass bell so the
children can hear her coming. She cannot see you, but she hears the shape of everything you do.

The house is caught in the final night of the trial. To leave, you must give the children back
their **waking chord** and ring the bell that was never rung.

### What makes this different from Granny / Slendrina

- **You are not being seen. You are being heard.** The primary enemy is blind. Noise is the real
  light meter, and the player learns to read sound.
- **Hiding has a second verb: breathing.** In a wardrobe, being invisible is not enough. When the
  Matron leans close, hold your breath until she leaves.
- **A light-vs-dark enemy with the opposite rule.** Basement Sleepwalkers are blind to sound but
  drawn to the flashlight. The same tool that helps you navigate draws a second predator.
- **A looping sleep clinic, not a house of gore.** The horror is institutional, musical, and
  pediatric. Bells, moths, lullabies, and the fear of waking something that wants to stay asleep.
- **Puzzles are observation puzzles.** Patient charts set a sleep console. A mirrored safe routes
  moonlight. Four childhood music notes become the final bell chord.

### Visual direction

- **Palette:** oxidized seafoam, nicotine cream, dried oxblood, moth-wing brown, blue-black dark.
- **Motifs:** moths, bells, stitched eyes, lullaby notation, childish drawings, clock hands at 3:17.
- **Materials:** peeling institutional wallpaper, dark wood, chipped enamel, black water, brass,
  rusted iron, heavy fog and dust.
- **Camera:** low, grounded FOV 70°, strong flashlight cone, deep shadow pools, 0.6 m player radius.
- **Post:** CSS vignette + film grain, no expensive bloom. Occasional picture-frame "memory bleed"
  and chromatic flash on damage.
- **Audio:** procedural drone, room tone, distant bells, wet footsteps, breathing, bells that ring
  when nothing is moving. Original synthesized audio; no licensed music.

---

## 2. Player loop

1. **Listen.** Read the room. Follow signposting and the casebook.
2. **Move quietly.** Crouch-walk is slow and silent. Walking is normal. Sprinting is loud and
   costs stamina. Flashlight clicks are audible.
3. **Observe.** Charts, drawings, door signs, patient belongings, and confession reels hide the
   information needed for each lock.
4. **Solve.** Three environmental systems plus a final musical ritual.
5. **Survive.** Break line of sight, close doors, throw bottles as noise decoys, hide, hold breath.
6. **Escape.** Ring the Waking Bell, survive the last descent, and open the front doors.

### Resources

| Resource | Rules |
|---|---|
| **Composure** | 3 points. Matron catch = 2, Sleepwalker touch = 1. At 0, return to the last safe candle. Puzzle progress is kept. |
| **Flashlight battery** | Starts at 72%. Drains while on (~9 min). Batteries restore 28%. Clicks make small noise. |
| **Stamina** | Sprint drains; walking restores. The Matron outlasts you in a straight line. |
| **Bottles** | Start with 1, maximum 5. Throw to create a 20 m noise beacon. |
| **Breath** | Only while hiding. Hold to suppress breathing noise, release to recover. |
| **Casebook** | Auto-records objectives, discovered clues, chart data, inventory, and lore letters. |

Death is never a full reset. It is a **memory loop**: the screen folds, the last candle relights,
and you lose a little battery and one bottle. Objectives, keys, and puzzle solutions persist.

---

## 3. Controls

### Mobile (landscape, primary target)

- **Left half:** dynamic virtual stick — walk. Push to edge while the sprint toggle is on.
- **Right half:** drag to look.
- **Context button:** interact / read / take / hide / use key. Label is always shown.
- **Crouch:** toggle. Halves speed and noise, lowers camera.
- **Sprint:** hold or toggle (setting). Drains stamina.
- **Flashlight:** toggle; battery meter.
- **Throw bottle:** quick toss along view direction.
- **Hide:** contextual; inside, replace movement with **Hold breath** and **Leave**.
- **Casebook / Pause:** top-right; objectives, notes, hints, settings.
- Large 56–76 px touch targets, safe-area inset support, haptics for danger events.

### Desktop

WASD move, mouse look (pointer lock), E interact, C/Ctrl crouch, Shift sprint, F flashlight,
Q throw, Tab casebook, Esc pause.

**Orientation:** request fullscreen + landscape lock on first tap. Portrait shows a rotate card.

---

## 4. The house

A compact, looping 1960s sleep clinic. Every objective is reachable by at least two routes, and all
doors are signposted. The map is intentionally readable: **two wings, a central foyer, a back archive,
and an east service corridor**.

### Ground floor (y = 0)

```
                 NORTH (back)
   ┌──────────────┬──────────────┬───────────────┐
   │              │   ARCHIVE    │               │
   │  TREATMENT   │  + basement  │  RECORDS      │
   │  (hydro)     │    stair     │  / storage    │
   ├──────────────┴──────┬───────┴───────────────┤
   │                     │                       │
   │      DAY ROOM       │   EAST CORRIDOR       │
   │  piano / fireplace  │   long looping hall   │
   │                     │                       │
   ├───────┬─────────────┤  ┌─────────┬────────┤
   │INTAKE │ RECEPTION   │  │ DINING  │ KITCHEN│
   │ spawn │  desk/map   │  │         │        │
   └───────┴──────┬──────┴──┴─────────┴────────┘
                  │ GRAND FOYER / FRONT DOOR
                  │ staircase up on east wall
                 SOUTH (entrance)
```

Rooms and purpose:

| Room | Purpose | Hiding | Points of interest |
|---|---|---|---|
| **Intake** | Tutorial spawn | Under cot | Admission form, dead phone, first battery |
| **Reception** | Navigation hub | Behind desk | Building map, flashlight, staff memo, candle |
| **Grand Foyer** | Vertical hub / exit | Curtained alcove | Front door maglock, frozen clock 3:17, staircase |
| **Day Room** | Environmental story + tool | Piano alcove | Crowbar in fireplace, piano, patient drawings, reel 1 |
| **Treatment** | Dread set-piece | Curtain | Hydrotherapy tubs, ECT chair, reel 2, salt |
| **Archive** | Route to basement | Filing alcove | Warped service door, obituary board, bottle |
| **East Corridor** | Stealth loop | Linen closet | Signs, gurney, nurses' route board |
| **Dining** | Patrol space | Under table | Place settings, moth centerpiece, bottle |
| **Kitchen** | Loop + supplies | Pantry | Dumbwaiter, batteries, note |
| **Matron's Office** | Puzzle reward room | Tall cabinet | Locked door, mirror safe, confession, candle |
| **Records** | Lore + map clarity | Cabinet | Patient files, optional reel 3, back route |

### Upper floor (y = 3.8)

- **Balcony landing** over the foyer; one railing gap where the staircase arrives.
- **Patient Ward** — four beds with colored blankets, bedside music boxes, patient charts, curtains,
  lockers. This is the observation puzzle clue room.
- **Observation Room** — one-way glass over the Ward, the sleep console, projector, chalkboard with
  the Waking Chord protocol, and the **attic hatch**.
- **Upper east corridor** — staff access, Matron's quarters, nursery.
- **Nursery** — cribs, mobiles, children's drawings, a safe candle.
- **Matron's Quarters** — optional lore, a cot, and a photograph. Not required for progression.

The grand staircase runs up the foyer's east wall from z = 10 to z = 5. A broken balcony rail on the
south edge is a visual threat, but invisible collision rails prevent accidental falls.

### Basement (y = −3.6, entered through the Archive service door)

- **Service landing** — fuse warning placard; the door locks behind you (reopens automatically after
  power is restored).
- **Generator Room** — the generator puzzle; fuse socket; breaker panel; deafening startup.
- **Workshop** — fuse cabinet nailed shut (crowbar), workbench, spare batteries, candle.
- **Central cellar corridor** — the Sleepwalkers' loop; pipes and hanging bulbs.
- **Laundry** — optional lore, salt, a place to hide under a folding table.
- **Boiler Room** — environmental noise; optional confession reel.
- **Morgue/Cold Room** — drawer labels, one scare, optional battery. No gore.

Basement access uses a short blackout transition at the service door (stair geometry is visible but
not traversed), keeping mobile collision robust. A return door at the landing does the same in
reverse. Upper floor is fully walkable.

### Vertical connections summary

| From | To | Gate |
|---|---|---|
| Intake | Reception | Door |
| Reception | Foyer / Day Room | Arches |
| Foyer | East Corridor / Day / Archive | Arches and doors |
| East Corridor | Dining / Kitchen / Office / Records | Doors |
| Foyer | Upper balcony | Walkable staircase |
| Ward | Observation | Door |
| Balcony | Upper east corridor | Door |
| Observation | Bell loft | Attic hatch, **Waking Key** |
| Archive | Basement landing | Warped door + **Crowbar** |
| Basement landing | Main basement | Door |

---

## 5. Escape progression and dependency graph

```
[START: Intake]
   │
   ├─ take FLASHLIGHT (Reception)
   ├─ take CROWBAR (Day Room fireplace)
   │
   ▼
[ARCHIVE] pry warped service door ──────────────┐
   │                                           │
   ▼                                           │
[BASEMENT WORKSHOP] pry nailed fuse cabinet    │
   │  → CERAMIC FUSE                          │
   ▼                                           │
[GENERATOR] install fuse, prime fuel,          │
  throw breakers in order, start               │
   │  → POWER ON (loud; Matron investigates)   │
   │                                           │
   ▼                                           │
[WARD] read all four patient charts            │
   │  (colors + sleep stages + comfort notes)  │
   ▼                                           │
[OBSERVATION] set console to chart stages      │
   │  → BRASS OFFICE KEY                       │
   ▼                                           │
[GROUND OFFICE] unlock door                    │
   │                                           │
   ▼                                           │
[OFFICE SAFE] route moonbeam with mirrors      │
   │  → WAKING KEY                            │
   ▼                                           │
[OBSERVATION] unlock attic hatch               │
   │                                           │
   ▼                                           │
[BELL LOFT] play the Waking Chord              │
   │  A A C C E E G G (youngest → eldest)      │
   ▼                                           │
POWER SURGE + FRONT DOOR MAGLOCK RELEASES      │
   │  → final descent under pursuit            │
   ▼
[FRONT DOOR] escape → ending
```

**Anti-softlock rules**

- Every key item has an unambiguous inventory entry and a casebook objective.
- The office key is a puzzle reward, never randomly placed.
- If the Matron catches you, solved puzzles, keys, and objectives do not reset.
- Wrong puzzle inputs are noisy and cost time, never resources or item loss.
- A free hint is always available in the casebook for the active objective.
- The bell will not accept input until power is on and the Waking Key has opened the hatch.
- All required clue text is also written into the casebook when discovered.

---

## 6. Puzzles

### A. The Generator — "Wake the House"

**Location:** Basement generator room.  
**Requires:** Ceramic fuse (Workshop), crowbar, observation.

1. **Fuse cabinet (Workshop):** nailed shut; pry with crowbar. Loud. Contains fuse + battery.
2. **Install fuse** in generator socket.
3. **Prime the fuel line:** hold the prime lever; a pressure needle climbs. Release inside the green
   band (55–70 PSI). Over-prime vents fuel; retry.
4. **Breaker order:** three labeled breakers. A maintenance plate reads
   `SERVICE ORDER — THEATRE → WARD → BELL`. Switch them in that order. Wrong order sparks loudly.
5. **Start.** The house wakes. Lights stutter on; the observation console powers; the bell motor
   hums; the Matron hears the startup from wherever she is and heads toward the basement stairs.

Failure only makes noise. The fuse is consumed only on success; it cannot be lost.

### B. The Sleep Console — "Read the Children"

**Location:** Observation room.  
**Requires:** Power, four Ward charts.

Each Ward bed has a colored blanket, name card, and chart:

| Bed | Patient | Age | Stage | Comfort note |
|---|---|---|---|---|
| Red | **Elsie Wren** | 8 | REM | A |
| Blue | **Jonah Pike** | 12 | II | G |
| Yellow | **Ada Rook** | 10 | I | C |
| Green | **Tobias Finch** | 11 | III | E |

The observation console has four colored stage selectors. Set each color to the patient's stage:
**Red REM · Blue II · Yellow I · Green III.** A brass drawer opens with the **Office Key**.
Wrong submission sounds a ward bell (noise, no penalty). A chalkboard states the console process;
nothing must be guessed.

### C. The Mirror Safe — "Moonlight Remembers"

**Location:** Matron's Office.  
**Requires:** Brass office key.

A wall safe has a moon sigil and a four-mirror cabinet. A live beam preview shows the path. Rotate
the four brass mirrors (tap to turn 90°) to guide the moonbeam into the moth sigil. The puzzle is
pure spatial logic, resettable, with no death penalty. Opening it reveals the **Waking Key** and a
confession note.

### D. The Waking Bell — "Youngest First, Each Note Twice"

**Location:** Bell loft above Observation.  
**Requires:** Power, Waking Key.

The chalkboard protocol (Observation) and the four bedside music boxes establish the chord. Order
is youngest to eldest; each note is struck twice:

**A · A · C · C · E · E · G · G**

Six pull-keys (A, C, D, E, F, G) are present. Wrong notes clang and alert the Matron, then the
sequence resets. Success rings the great bell. The front doors unlock, and the Matron begins her
final hunt. The player must descend the staircase and cross the foyer. The doors remain unlocked
even if the player is caught.

---

## 7. Enemies

### The Matron — *the listening thing*

**Look:** 2.15 m, starched nurse's cap and apron gone grey, elongated arms, brass hand bell, black
blindfold stitched with a moth. No gore; she is wrong in the silhouette and the stillness.

**Behavior states**

| State | Behavior |
|---|---|
| **Patrol** | Follows nav-graph routes across ground + upper floor. Stops at doorways to listen. Rings bell at intervals. |
| **Listen** | Pauses, tilts head toward the loudest recent noise. A false "all clear" beat before moving. |
| **Investigate** | Walks to last heard position, then searches nearby nodes. May open doors and cabinets. |
| **Hunt** | Triggered by very close movement, sprint noise, or seeing you leave a hiding spot. Faster; loses track after 7 s without new noise. |
| **Search** | Sweeps rooms near the last target. Occasionally double-backs — an unpredictable false exit. |
| **Reset** | Teleports to a far patrol node after a catch, off-camera. |

**Hearing model:** movement state generates noise pulses (crouch 2.5 m, walk 6 m, sprint 12 m).
Doors, pickups, flashlight clicks, bottle breaks, and wrong puzzle inputs produce one-shot noise up
to 20 m. Sound passes through walls for tension; range is clearly visualized by a noise ring.

**Hiding:** entering a wardrobe/cabinet is safe unless she heard you enter or is already searching
that spot. When she is close, an on-screen **HOLD BREATH** action appears. Breathing while she
searches the spot reveals you. Once she leaves, release and recover.

**Fairness:** she is always audible before she is lethal (bell, footsteps, drone). She never spawns
inside the player's room. Catches trigger a memory-loop respawn, not lost progress.

### The Sleepwalkers — *the light-eaters*

**Look:** Three small, barefoot figures in grey gowns, heads tilted, eyes stitched. They move in
stop-motion twitches.

**Behavior**

- Patrol basement waypoints. Blind to sound.
- If the **flashlight beam** touches them, or their cone test sees the lit player within 9 m, they
  turn and advance at a slow, relentless pace.
- If the flashlight is off for 2 s, they lose interest and drift back to patrol.
- They cannot follow the player up the service stairs.
- Touch = 1 composure and a violent blackout; player is pushed to the landing.
- They are avoided by moving through darkness and reading their dry, whispering audio cue.

**Why two enemies:** the Matron punishes noise above ground; the Sleepwalkers punish light below.
The flashlight becomes a resource with two opposed meanings.

---

## 8. Environment, story, and scares

### Environmental storytelling

- Staff memo: "No bells after lights out."
- Patient drawing: "THE LADY WITH THE BELL HAS NO EYES."
- Ward charts and four personal music boxes.
- Place settings in the dining room for five children and one adult. The adult's chair is at the head
  and has scratch marks.
- Hydrotherapy tub full of black water; a handprint on the inside.
- Nursery mobile of moths with one empty hook.
- The frozen clock in the foyer always reads 3:17.
- The mirror in Matron's office is covered; if the player uncovers it, a silhouette appears behind
  them for one frame (pure scripted scare, no enemy spawn).
- Three optional confession reels reveal who designed the Quiet Cure.

### Scripted scares (used sparingly)

1. **The chair:** in the Day Room, patient chairs face the wall. After the player crosses the room,
   one chair faces the door. (No jump sound — just wrongness.)
2. **Hydrotherapy:** the black water ripples and a handprint surfaces when the flashlight touches it.
3. **Nursery:** a music box starts on its own after reading Elsie's chart; a child's whisper says
   "don't ring it."
4. **Generator:** startup kills the lights; the Matron's bell rings from the darkness behind you.
5. **Mirror:** the covered mirror reveal.
6. **Final bell:** every light in the house goes out except the front-door EXIT sign.

Scares are placed between puzzles, not during precise interactions. Subtitles and reduced-motion
settings cover accessibility.

---

## 9. Save, checkpoints, accessibility

- **Autosave** to localStorage at each objective milestone and each lit candle.
- **Candles:** Reception, Ward nurses' station, Workshop, Nursery, Office. Interacting restores
  composure to 3 and sets spawn. Visual warm light is a trustworthy safe cue.
- **Death:** fade → lounge memory loop → reload at latest candle/milestone; items and solved states
  persist; lose 12% battery and one bottle.
- **Settings:** look sensitivity, invert Y, quality (auto/high/low), shadows, film grain, motion
  reduction, subtitles, master volume, haptics, left-handed layout, sprint hold/toggle.
- **Accessibility:** no color-only clues (all charts pair color with names and symbols), scalable
  text, clear audio captions, optional hint in casebook, no timed puzzle failure states.

---

## 10. Technical plan

### Stack

- **Three.js** (MIT) rendering, custom first-person controller.
- **Vite** build; ES modules; no runtime CDN dependency.
- **WebAudio** procedural sound: drones, footsteps, bells, music-box notes, stingers.
- **CanvasTexture** procedural materials and decals: wallpaper, tile, wood, plaster, rust, charts.
- **Procedural low-poly props:** beds, wardrobes, piano, generator, hydrotherapy tubs, bell, moths.
- **No external asset downloads.** Everything is original or generated in-repo, so the project is
  legally clean and visually consistent. Third-party license: Three.js (MIT) only.
- **PWA:** manifest, service worker, installable full-screen on Android, orientation hint.

### Architecture

```
src/
  main.js                 boot, screens, lifecycle
  core/
    Game.js               main loop, progression, checkpoints, events
    Input.js              touch + keyboard + look + actions
    Player.js             movement, collision, camera, noise, hiding
    NavGraph.js           A* graph for the Matron
    Interaction.js        proximity prompts and interactables
  world/
    Layout.js             room, wall, door, nav, prop placement data
    WorldBuilder.js       geometry, floors, stairs, doors, batching
    Textures.js           canvas material library
    Props.js              procedural furniture and set dressing
    Lighting.js           baked pools, flashlight, fog, moth particles
  entities/
    Matron.js             state machine, pathing, hearing, hiding checks
    Sleepwalker.js        light-based basement enemy
  systems/
    AudioSystem.js        procedural audio engine
    SaveSystem.js         localStorage + checkpoint data
    Objectives.js         goals, clues, hints, progression flags
    UI.js                 HUD, casebook, pause, touch layout
    Notes.js              story notes/charts/reels
  puzzles/
    PuzzleUI.js           modal shell
    GeneratorPuzzle.js
    SleepConsolePuzzle.js
    MirrorSafePuzzle.js
    BellPuzzle.js
  styles.css
public/
  manifest.webmanifest
  icons/
  sw.js
```

### Performance budget (Android mid-range)

- Cap renderer pixel ratio at 1.5 (auto downscale if sustained FPS < 45).
- Batch static geometry per material → target < 90 draw calls.
- One shadow-casting spotlight max; 512² shadow map; low quality disables shadows.
- 4–6 non-shadow point lights; everything else is emissive + fake light pools.
- Textures 256–512 px, compressed as runtime canvas; no 4K assets.
- Fog culls distant detail; no post-processing composer; CSS grain/vignette only.
- LOD is unnecessary at this scale; prop count kept low and merged.
- Touch input sampled via pointer events; no per-frame allocations in the hot loop.
- AI pathfinding only on state changes, not per frame.
- Sleep/visibility culling by room bounds for dynamic props.
- Target: 60 fps high, 30 fps minimum on low-end.

---

## 11. QA / completion checklist

- [ ] New game → front door → full escape can be completed without debug tools.
- [ ] Desktop and touch controls both work.
- [ ] No input trap after hiding, puzzle, pause, or death.
- [ ] Matron cannot soft-lock progress: office/attic edges gated correctly.
- [ ] All four charts, console, office key, safe, attic, chord, door reachable.
- [ ] Any catch preserves keys, fuse, solved puzzles, and bell state.
- [ ] No missing textures or console errors.
- [ ] Audio starts only after user gesture; can be muted.
- [ ] Save/continue restores objectives and inventory.
- [ ] PWA installs and reloads offline.
- [ ] Portrait rotate hint, landscape layout, safe-area insets.
- [ ] No critical clue relies on color alone.
- [ ] End credits and replay path work.

---

## 12. Post-launch ideas (explicitly out of scope for v1.0)

- Second playable night with remixed patrols.
- Alternate ending if all three reels found (v1.0 will show an extended epilogue instead).
- Cosmetics, achievements, leaderboards.
- Voice acting.
- Procedural annex beyond the main house.

**v1.0 ships one house, two enemies, four puzzle systems, a complete ending, and no dead ends.**
