# Mr. Toasty: Toasty Bros — Worlds 1-3 (v0.5 TOASTER PIT)
Original platformer by Coty Lake. SMB is a mechanics reference only; all art, audio, names and layouts are original and
procedural (pixel arrays + canvas + WebAudio). No external assets, no CDN, no build step. Jam is grape purple.

## Run
Open `index.html` directly (file:// works), or `python3 -m http.server` in this folder.
- Keyboard: Arrows/WASD move · Z/Space/K jump · X/Shift/J run + fire (hold = auto-fire) · F fire only · C/L special ·
  V/I melee · Down crouch / enter pipe · Enter start/pause.
- Gamepad (standard mapping): D-pad/left stick, A jump, B run+fire, X special, Y melee, Start.
- Touch (v0.5 hardened, see **Mobile controls** below): left 8-way D-pad, right A (jump) / B (run+fire) / S (special) / M (melee)
  + START, only on touch devices (force with `?touch`).
- Title menu: NEW GAME · CONTINUE x-x · BRO ROSTER · LEVEL SELECT (only with `?debug`).
- Save: `localStorage['toastyBros.save.v1']` = { furthest, hi, worldsCleared, unlocked, startBro } (older saves load fine).

## v0.5 TOASTER PIT
- **World 3 "Toaster Pit"** (3-1 → 3-4, boss THE BREADLORD), built with bros, cages, destructibles and explosions from the
  start. See the World 3 section below.
- **Mobile controls hardening pass** (see Mobile controls below).
- Fixes: (a) explosion popup labels no longer overlap or garble: popups that would land on top of each other stack upward,
  and repeated labels merge into one with a count ("CHAIN X4"). (b) The 1-4 firebar spots (tiles ~18, 27, 74, 111, 115): the 76 and 113 bars moved one tile
  (77 / 114) to clear the block row and the falling-plat landing. The autopilot cuts a jump short instead of rising into a
  sweep and never backs up into a firebar or beam. (c) The `G.deathCause` stack-trace capture only runs with
  `?debug`. (d) World 1's `shots/w1/boss.mp4` was re-recorded against the current 1-4 (warp tx 122).
- World 2 fairness tweaks found by the new per-bro runs: the 2-3 Rival Truck gunner moved off the gap's landing spot (now
  guards the flag at tile 191), and a stepping plank (35-37) sits under the 2-3 lift.
- Autopilot: the bot waits out a Jam Skull mid-hop, hops or outruns ground shockwaves, outruns bullets that chase it, can take
  a jump over an edge when a landing is within 5 tiles, and avoids coils, forks and spike reels with a shared `danger()` check.

## Mobile controls (v0.5)
- **Layout**: left 8-way virtual D-pad (one zone with a knob: slide your thumb between directions). On the right are
  A = jump, B = run/fire (hold = auto-fire), S = special and M = melee, plus START (pause). Every control is at least 44 CSS
  px (D-pad 132–176 px, A/B 60–76 px, S/M ≥ 48 px, START 72x44). They are semi-transparent with a pressed state.
- **True multi-touch**: each finger is tracked by its touch identifier. The whole control state is rebuilt from the live touch
  list on every event, so nothing sticks. A finger on the action side can roll from B onto A (run-jump). Taps shorter than a
  frame still register: there is a one-frame latch, so a tap is a short hop and a held A is a full jump (variable jump).
- **No browser gestures**:
  - The viewport meta has `user-scalable=no, maximum-scale=1, viewport-fit=cover`.
  - `touch-action:none` is set on html/body/canvas/controls. Touch callout, text selection, tap highlight and overscroll are off.
  - touchstart/move/end listeners are `passive:false` and call `preventDefault()`.
  - The dblclick, gesturestart/gesturechange, contextmenu and selectstart events are blocked.
- **Audio** unlocks on the first tap: `resume()` runs inside the gesture (also on touchend for iOS) and also recovers from
  'interrupted'. A one-time silent buffer plays.
- **Fit**:
  - Landscape centres the screen between the thumb gutters. Scaling is an integer when it's within 84% of the available space,
    otherwise quarter steps (844x390 → 1.5x). Pixels stay square.
  - Portrait puts the screen on top and the controls below, with a "ROTATE FOR A BIGGER SCREEN" hint.
  - Layout respects safe-area insets (`env(safe-area-inset-*)`) and re-lays out on resize, orientationchange and
    visualViewport resize.
- **Lifecycle**: the game auto-pauses when the page is hidden or on pagehide ("PAUSED / TAP START TO RESUME"). All touches and
  keys are released on blur, pagehide, visibilitychange and touchcancel. The title screen shows touch control hints on touch
  devices.

## v0.4 BRO EDITION (Worlds 1 + 2)
The platformer core stays: stomping, "?" blocks, skullz (coins) and the Channel Pole all work as before. On top of that:
- **8 original bros** (`js/bros.js`, data + pixel frames, same 12x15 hitbox): each has a gun, a melee move and a special
  (3 per life; an **ammo crate** dropped by gun enemies refills them).

| Bro | Gun | Melee | Special |
|---|---|---|---|
| Mr. Toasty | toast-rocket gun (small blast) | toaster jab | crumb burst (ring blast) |
| Fat Coty | snack spray (short, rapid) | bite (heals: gives Toast Armor) | body slam (jump + ground pound blast) |
| Toaster Truck Skeleton | butter blaster (5-pellet spread, breaks bricks) | bony jab | truck-ram dash (smashes through terrain) |
| Acid | long shot (piercing sniper) | elbow | jetpack hover |
| Breadlord Jr. | IOU spread (3 paper notes) | loaf slap | debt curse (freezes every enemy on screen, "IOU ALL OF YOU") |
| Chrome Screamer | shriek cone (passes through enemies, breaks bricks/crates/barrels) | crystal bonk | mirror shield (reflects bolts and bullets) |
| Cal the Repairman | static zapper (fast) | wrench (breaks ground) | TV turret (auto-fires for 10 s) |
| Skulrz Skull | roll dash (bonks enemies) | headbutt | bone bomb (thrown, big blast) |

- **Rescue cages** (2–4 per level, 'C' tiles): shoot, punch or blow one up → "BRO FREED!" banner, you swap into a random other
  bro, +1 life and +1 reserve bro. Freeing a cage unlocks the next locked bro permanently (saved). When you die you come back
  as the next reserve bro (or a random unlocked one). **BRO ROSTER** (title menu) shows unlocks and sets your starting bro.
- **Destructible terrain**: ground/bricks/stone/crates take damage with 3 crack stages (TILE_HP: ground 3, brick 2, stone 4,
  crates/barrels 1). The bottom row is bedrock, the level borders, the Channel Pole area and boss arenas can't break.
  Collision updates live (dig a crater, fall in).
- **Explosions** (one radius system): grape-jam barrels, propane-style tanks and gas cans chain-react with a short delay; screen
  shake + hit-stop; sparks, crumbs, smoke and grape-purple jam (no gore). Your own blasts don't hurt you; barrel blasts do.
- **Wall-slide + wall-jump**: press into a wall in the air to slide slowly; jump to kick off. Grabbing a ledge just above you
  pops you up onto it.
- **Run-and-gun enemies**: World 1 **Antenna Skull riflemen** (red band, laser sight, 3-round burst); World 2 **Rival Truck
  gunners** (roof turret, 4-round burst). Enemies have HP, flash when hit and get knocked back. **Toast Armor** (the old grow
  power-up) is now an extra hit instead of growing.
- **TOASTED! castle escape**: after THE GLITCH (1-4) and THE GRAND TOASTER (2-4) a sealed wall blows open, a wall of
  explosions chases you from the left ("RUN! EXIT >>>"), and you sprint to the green EXIT door for the world-clear card.
- **Autopilot combat mode** (`?autoplay`): the bot still navigates the platforming, and now aims (never fires rockets/shrieks
  toward nearby barrels), shoots cages, melees, uses safe specials, wall-jumps out of pits and runs the escape.
- URL flags: `?debug` level select (worlds 1–3 playable, 4–10 listed as COMING SOON; X cycles starting size) · `?autoplay` demo bot ·
  `?test` stepped mode for headless tests (`window.TT` hooks) · `?touch` force touch UI.

## World 1 — No Signal Skullz
| Level | Name | Theme / new stuff |
|---|---|---|
| 1-1 | Skull Wall Office | v0.1 level + 40-tile cubicle section (246 tiles), bonus pipe room, Channel Pole |
| 1-2 | Toast Factory | underground: conveyors, butter barrels, Antenna Skull (slow signal bolts), Butter Bomber (dive → slippery butter patch), hidden Spare Play Card, secret no-hint pipe at tile 120 → WARP ZONE (2/3/4) |
| 1-3 | Acid Rain Alley | night rooftops: moving + falling platforms, wide gaps, acid puddles, Mimic blocks (fake CRT "?" blocks that bite) |
| 1-4 | Broadcast Tower | castle: rotating static bars, static beams, glitch void floor, v0.3 extra gauntlet before the boss bridge (falling plats, firebar roof, moving plat, beam), boss THE GLITCH |

Progression 1-1 → 1-4 carries score, skullz, lives and power-up size; every level opens with a "WORLD 1-x" card + lives.
Warp zone: pipe 2 → "CHANNEL 2: TOASTER KART / SIGNAL FOUND!" → 2-1. Pipes to unbuilt worlds show COMING SOON and retune to the
first level of the latest built world (2-1). Clearing 1-4 → World 1 clear card → START → 2-1.

**THE GLITCH**: crossing onto the bridge freezes play for Mr. Toasty's line "I AM THE INSIDER THREAT TO THE GLITCH!!!", the
camera locks, then a readable loop: walk (hops) → charge (eyes flash) → volley (alternating LOW bolts = jump, HIGH bolts =
duck or stay small; 3 shots, 5 when HP ≤ 2) → leap toward you (run underneath) → recover. Win by touching the UNPLUG switch
behind it (bridge collapses into the void, boss falls) or by 5 toast-rocket hits (then unplug to end). World-clear card
teases "TOASTER KART: NEXT CHANNEL…".

## World 2 — Toaster Kart (lore: ../lore/kart.md)
Saturday-morning cartoon look (`js/toon.js`): thick navy outlines, flat bright colors, 3-step shading. Surf-rock chiptune per
level (`w2_suburb`, `w2_tide`, `w2_under`, `w2_grave`, `w2_castle`) + rumbly `w2_boss` (tremolo lead, spring echo, tom fills).
Coty's truck is "the Toaster Truck" (original wedge pickup) and its plate always reads THERAPY TOASTER. Surf City shops are
parodies (CRUMB CORNER, JAM DROP CLEANERS, CRUST WASH, BUTTER UP BARBER, BAIT 'N' TOAST, TIDE TOWER).

| Level | Name | Theme / new stuff |
|---|---|---|
| 2-1 | Monday Errands | suburb, sky shifts day → sunset; Rival Trucks (rev + honk, then charge; stomp the cab or dodge; they stall on walls); puddles (slide); boost pads (speed burst) |
| 2-2 | Toaster Tide Run | boardwalk over the marsh: pastel stilt cottages, water tower, bait shack; Crumble Pier (one-way planks you can drop through with DOWN, crumble planks that fall ~0.5 s after you stand on them and grow back); butter slicks; broken pier → pipe to the under-pier section |
| 2-3 | Skullz Graveyard | purple graveyard under a pink sky; ground platforming + a sky section; Graveyard Skeletons (stomp → bone pile → reassemble), crossover Crumblings, homing Toast Rocket launchers (stomp a rocket to pop it) |
| 2-4 | Toaster Fortress | junkyard on a high-rise bridge, flame vents, trucks, launchers; boss THE GRAND TOASTER |

Optional **850HP Lightbar** item (blocks in 2-1, 2-2 under-pier, 2-3, 2-4): long speed boost + lightbar on Mr. Toasty's head.

**THE GRAND TOASTER**: intro line "NICE CHROME, BIG GUY. / TIME FOR A RECALL!!!", camera locks, then a loop of pop (flaming
toast arcs that burn where they land) → rev + ram the lane (revs up over ~20 frames; jump onto its roof) → butter the deck →
ram. Win 3 ways: 3 bounces on the lever on its roof (it bucks you off and immediately revs), reflected Toast Rockets (at 1 HP it
fires one before the butter run; stomp it: RETURN TO SENDER), or Toast Launcher rockets (3 dents = 1 HP). Defeat animation
(sparks, smoke, DING) → World 2 clear card teasing "TOASTER PIT: NEXT CHANNEL...". All boss behaviour is deterministic.

## World 3 — Toaster Pit (lore: ../lore/pit.md)
A grimy PS1-ish basement translated to pixel art (`js/pit.js`):
- Look: wet concrete, pipes and graffiti tags (TOASTY, PIT, CRUMBS, BREADLORD), posters ('FEED THE BREADLORD', 'ITS ART THERAPY')
  and neon magenta/cyan trim.
- Post-fx: bloom (a blurred 'lighter' pass), glitch bands, scanlines and a vignette that turns red during the curse.
- Jam is always grape purple (#8a3fd1). There are no slot/gambling names, no cash and no wallets. The "reels" are art-therapy
  symbol wheels (skull / jam / crumb / burnt toast).

Music is D-minor lo-fi:
- `w3_basement`: 84 bpm, vinyl crackle, pad
- `w3_wiring`: 112 bpm, mains-hum ostinato, clanks
- `w3_reels`: 124 bpm walking bass, arp
- `w3_vault`: 96 bpm, drone and tremolo
- Boss `w3_boss`: 150 bpm, tritone bass D/G#, rumble

| Level | Name | Theme / new stuff |
|---|---|---|
| 3-1 | Graffiti Basement | Jam Skulls (hop, drip grape jam), Butter Skulls (slide, leave butter), mini fridges (explosive, chain into tanks), Crumb Tray "?" block, exit pipe → fridge bonus room (camera-locked, pipe back to tile 124), 4 cages |
| 3-2 | Toaster Wiring | toaster coils in the floor (dark → orange WARN → glowing ON on a fixed cycle), fork-and-outlet sparks (an arcing spark jumps between outlets; one vertical ceiling→floor zap), 4 cages |
| 3-3 | Reel Tunnels | low tunnel ceiling; spinning reel platforms (stop on SAFE = stand, BOUNCE = spring up, SPIKE = hurt); ceiling Smoke Detectors (beep, then drop a shock pulse that makes a floor wave); Rubber Skulls (bounce toward you); Crust Goons (gun variant: aim, then two 3-way spreads; drop ammo) |
| 3-4 | Breadlord's Crumb Vault | everything mixed, crumb piles, boss THE BREADLORD, TOASTED! escape |

- **Crumb Tray** (new item): 9 s skull(coin) magnet with a cyan/magenta orbit; it flashes "TRAY FADING" near the end.
- **THE BREADLORD**: Mr. Toasty's line "MY DEBT IS ART THERAPY, / AND THERAPY IS FREE!!!", then the camera locks. He sits
  behind a ledger table (6 HP; hit him with guns, rockets or specials).
  - Phase 1 cycles: slices (arcing toast that bounces), IOU notes (alternating low = jump, high = stay low), table slam (a floor
    shockwave to hop).
  - Phase 2 (HP ≤ 3, "THE REELS ARE SPINNING"): adds the reels window. Three symbols resolve into effects: a skull spawns a Jam
    Skull, jam drops a puddle, crumbs rain and burnt toast fires a slice.
  - The first phase-2 spin (and every third after) is **three Burnt Toasts → "BURNT x3: CURSED!"**: the arena dims red and two
    waves of crumb lanes fall (gaps are telegraphed).
  - At 0 HP the screen reads **"DEBT PAID"**. The ledger burns and pages fly, and the Breadlord crumbles to crumbs. Then the
    sealed wall blows and the **TOASTED!** escape runs to the EXIT door.
  - The World 3 clear card shows the burnt table + PAID stamp and teases **"TOASTER CARDS: NEXT CHANNEL..."** (World 4).
- Progression: clearing 2-4 → World 2 card → START → 3-1. Warp-zone pipe 3 → "CHANNEL 3" → 3-1 (pipe 4 shows COMING SOON
  and retunes to 3-1). Level select lists 3-1..3-4. Saves record `furthest`/`worldsCleared` for World 3.

World 10 is named **THERAPYTOASTER TO MARS** (display "TherapyToaster to Mars"), set only in `js/worlds.js`.

## Code layout (data-driven, ready for 10 worlds)
- `js/font.js` pixel font · `js/touch.js` touch controls · `js/audio.js` WebAudio songs (`w1_over`, `w1_under`, `w1_sky`,
  `w1_castle`, `w1_boss`) + SFX; `startMusic(name)` is the per-world music hook.
- `js/worlds.js` — `WORLDS[1..10]` (name, built flag, level ids, palette, enemy roster, boss, music) and `THEMES`
  (tileset palettes + background kind). Worlds 2–10 are stubbed with their lore palettes/rosters/bosses.
- `js/sprites.js` — sprites + `buildTileset(theme)` (themed ground/brick/CRT/conveyor/barrel/acid/bridge tiles).
- `js/levels/common.js` — tile legend + `newArea()` / `areaTools()` builders (pipes, stairs, platforms, firebars, beams, signs).
- `js/toon.js` — World 2 cartoon tiles/sprites (trucks, skeletons, launchers, Toaster Truck + plate font, Grand Toaster).
- `js/pit.js` — World 3 palette, tiles (coils, outlets, fridges, neon trim), sprites (skulls, smoke detector, goon, tray, IOU, slice, Breadlord), ledger table, graffiti/poster/background layers.
- `js/levels/w1.js`, `js/levels/w2.js`, `js/levels/w3.js` — `LEVELS[...]`, pushed onto `LEVEL_ORDER` (defined in common.js). Add a world = new `js/levels/wN.js` + `built: true` in worlds.js
  + a `<script>` tag.
- `js/bros.js` — `BROS` / `BRO_IDS` roster data + `buildBroSprites()` (bro frames, portraits, cage, tank, gas can).
- `js/game.js` — engine (v0.4 bro system block: terrain HP, booms, shots, melee, specials, cages, escape): physics, multi-area runtime (each area keeps its own enemies/items/platforms, so the main level is
  unchanged when you come back from a bonus room), entities, boss, states, rendering, autopilot, `window.TT` test hooks.

## Tests (Playwright, from ../tests, server on 127.0.0.1:18923)
- `test_w3.py` — 42 v0.5 checks:
  - The autopilot clears 3-1 → 3-4 → World 3 clear; the fridge bonus room is visited.
  - THE BREADLORD: 6 HP → 0 by the autopilot, phase 2, reels, curse, DEBT PAID, TOASTED! escape, world-clear tease.
  - A direct boss run checks the dialog, phase 2 and that the first phase-2 spin gives the curse.
  - Mechanics: coil cycle, fork spark, reel faces (safe/bounce/spike), the three skulls, smoke pulse, goon spread + ammo,
    Crumb Tray magnet, explosive mini fridge chain.
  - Progression: 2-4 clear → 3-1, warp pipe 3 → 3-1, level select, save.
  - Content rules: grape jam, no banned words in level/UI text, local scripts only. No console errors.
  - Writes shots/w3/.
- `test_mobile.py` — 119 checks over iPhone-13-ish 844x390 / 390x844 and Pixel-7-ish 915x412 / 412x915 (`hasTouch`, `isMobile`):
  - Setup: viewport meta, touch-action, select and tap-highlight CSS; ≥44 px controls that don't overlap; integer/quarter scaling;
    landscape gutters; portrait layout and hint.
  - Audio is running after the first tap, and after an iOS-style suspend + tap.
  - CDP `Input.dispatchTouchEvent` multi-touch holds right + run + jump at once, keeps right+run after lifting the jump finger,
    and slides the D-pad from right to left.
  - Variable jump on touch: tap 19 px < short press 25 px < hold 62 px.
  - Release: touchcancel and blur release everything.
  - No scroll or zoom after swipe, pinch, double-tap and synthesized pinch/scroll gestures. Every touch event is cancelable and
    defaultPrevented.
  - START pauses and resumes; the game auto-pauses when hidden.
  - Rotation re-lays out; safe-area insets are respected (CDP `Emulation.setSafeAreaInsetsOverride`). No console errors.
  - Writes shots/mobile/ (landscape.png, portrait.png, paused.png, pixel-*.png).
- `test_bro.py` — 42 v0.4 checks: roster data + 8 distinct sprites/weapons/specials, every bro's gun/melee/special, 3 specials
  + ammo refill, auto-fire, hit flash + knockback, cages (swap, +life, reserve, save, reload, respawn as next bro), tile HP/cracks,
  craters, bedrock + borders, chain reaction, shake/hit-stop, own-blast safety, wall-slide/jump, riflemen + gunners + ammo drop,
  Toast Armor, roster screen, TOASTED! escape, combat autopilot clears all 8 W1/W2 levels, no console errors; writes shots/bro/.
- `test_game.py` — 27 core-feel checks (physics, blocks, items, pipes, damage, autopilot 1-1 clear).
- `test_w2.py` — 42 checks: autopilot 2-1 → 2-4 → world clear (≤3 deaths), Grand Toaster → TOASTED! escape, under-pier visit, Grand Toaster cycle +
  all three win paths + autopilot 3/3, planks, crumbles (+ regrow), puddles, butter, boost, Lightbar, trucks, skeletons,
  launchers/rockets, W1 → 2-1, warp pipe 2 → 2-1, level select, World 10 name, local scripts only, no console errors.
- `test_w1.py` — 47 checks (incl. ammo crate, Glitch → escape → world clear, combat autopilot): autopilot title → world clear, intro cards, carry-over, save/continue/hi score, debug select,
  Glitch Filter / Spare Play Card / Toast Launcher collected in-game, bonus persistence, conveyors, butter, new enemies,
  warp zone, acid, platforms, mimic, hazards, boss both ways (+ autopilot with rockets), touch on/off, no console errors.
- `autoplay.py [levels]` per-level bot runs · `boss_clip.py [size] [out] [level] [warpTx]` real-time boss recording (`0 boss.mp4 2-4 136` → shots/w2/boss.mp4, `0 boss.mp4 3-4 140` → shots/w3/boss.mp4) · `realtime_and_clip.py`.
