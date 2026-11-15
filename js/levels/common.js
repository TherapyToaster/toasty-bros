// Level-building helpers shared by every world. Levels are data: areas made of a tile grid plus entity lists.
'use strict';
// Tiles: . empty  G ground  B brick  ? CRT block  U used  S solid block  p pipe  H hidden block  o coin  D dark wall
//        > < conveyor (push right/left)  R butter barrel  A acid puddle (hurts)  M mimic block  b bridge
//        = one-way plank (land from above, hold DOWN to drop through)  K crumble plank (drops after you stand on it)
//        X tombstone / junk block (solid, themed)
//        C rescue cage (break it to free a bro)  T toaster tank / F gas can (explosive, chain-react)
//        Q hot coil floor (World 3, glows on a cycle and burns)  O wall outlet (Fork in the Outlet sparks jump between them)
//        W mini fridge (World 3 explosive)
const SOLID_TILES = new Set(['G', 'B', '?', 'U', 'S', 'p', 'D', '>', '<', 'R', 'M', 'b', 'K', 'X', 'C', 'T', 'F', 'Q', 'O', 'W']);
// Level registry: each world file adds its levels and appends to LEVEL_ORDER in play order.
const LEVELS = {};
const LEVEL_ORDER = [];
function newArea(name, w, theme, opts){
  const A = Object.assign({ name, w, h: 15, theme, t: Array.from({ length: 15 }, () => Array(w).fill('.')),
    contents: {}, pipes: [], spawns: [], plats: [], firebars: [], beams: [], signs: [], bumps: {}, multi: {},
    pole: null, booth: null, boss: null, music: null, camLock: false, patchesInit: [], boosts: [], decor: [],
    coils: [], forks: [], reels: [] }, opts || {});
  return A;
}
function areaTools(A){
  const set = (x, y, c) => { if (x >= 0 && x < A.w && y >= 0 && y < A.h) A.t[y][x] = c; };
  const T = {
    set,
    ground: (a, b) => { for (let x = a; x <= b; x++){ set(x, 13, 'G'); set(x, 14, 'G'); } },
    roof: (a, b, top) => { for (let x = a; x <= b; x++) for (let y = top; y <= 14; y++) set(x, y, 'G'); },
    fill: (a, b, y0, y1, c) => { for (let x = a; x <= b; x++) for (let y = y0; y <= y1; y++) set(x, y, c); },
    q: (x, y, c) => { set(x, y, '?'); A.contents[x + ',' + y] = c || 'coin'; },
    br: (x, y, c) => { set(x, y, 'B'); if (c) A.contents[x + ',' + y] = c; },
    row: (a, b, y, c) => { for (let x = a; x <= b; x++) set(x, y, c || 'B'); },
    hid: (x, y, c) => { set(x, y, 'H'); A.contents[x + ',' + y] = c; },
    coin: (x, y) => set(x, y, 'o'),
    coins: (a, b, y) => { for (let x = a; x <= b; x++) set(x, y, 'o'); },
    pipe: (x, hgt, opt, base) => { const bottom = base === undefined ? 12 : base; const top = bottom - hgt + 1; for (let y = top; y <= bottom; y++){ set(x, y, 'p'); set(x + 1, y, 'p'); } A.pipes.push(Object.assign({ x, y: top, h: hgt, dir: 'up' }, opt || {})); },
    stairs: (x, n, up, base) => { const b = base === undefined ? 12 : base; for (let i = 0; i < n; i++){ const hh = up ? i + 1 : n - i; for (let y = b - hh + 1; y <= b; y++) set(x + i, y, 'S'); } },
    col: (x, hh, base) => { const b = base === undefined ? 12 : base; for (let y = b - hh + 1; y <= b; y++) set(x, y, 'S'); },
    en: (type, x, y, extra) => A.spawns.push(Object.assign({ type, x, y: y === undefined ? 12 : y, done: false }, extra || {})),
    conv: (a, b, y, dir) => { for (let x = a; x <= b; x++) set(x, y, dir > 0 ? '>' : '<'); },
    barrel: (x, y) => set(x, y, 'R'),
    acid: (a, b, y) => { for (let x = a; x <= b; x++) set(x, y, 'A'); },
    mimic: (x, y) => set(x, y, 'M'),
    // moving platform: tx,ty top-left in tiles, w in tiles, axis 'x'|'y', range in tiles, speed (radians/frame)
    mplat: (tx, ty, w, axis, range, speed, phase) => A.plats.push({ kind: 'move', tx, ty, w, axis, range, speed, phase: phase || 0 }),
    fplat: (tx, ty, w) => A.plats.push({ kind: 'fall', tx, ty, w }),
    firebar: (tx, ty, len, speed, phase) => { set(tx, ty, 'U'); A.firebars.push({ tx, ty, len, speed, phase: phase || 0 }); },
    beam: (tx, y0, y1, period, phase) => A.beams.push({ tx, y0, y1, period: period || 180, phase: phase || 0 }),
    sign: (tx, ty, text, color) => A.signs.push({ tx, ty, text, color }),
    // World 2 helpers
    plank: (a, b, y) => { for (let x = a; x <= b; x++) set(x, y, '='); },
    crumble: (a, b, y) => { for (let x = a; x <= b; x++) set(x, y, 'K'); },
    puddle: (a, b, row) => A.patchesInit.push({ kind: 'puddle', a, b, row: row === undefined ? 13 : row }),
    butter: (a, b, row) => A.patchesInit.push({ kind: 'butter', a, b, row: row === undefined ? 13 : row }),
    boost: (tx, row) => A.boosts.push({ tx, row: row === undefined ? 13 : row }),
    decor: (kind, tx, row, extra) => A.decor.push(Object.assign({ kind, tx, row: row === undefined ? 13 : row }, extra || {})),
    stone: (x, y) => set(x, y, 'X'),
    // v0.4 Bro helpers
    surface: (x) => { for (let y = 3; y < A.h; y++) if (A.t[y][x] !== '.' && A.t[y][x] !== 'o') return y; return A.h; },
    cage: (x, y) => { if (y === undefined){ y = T.surface(x) - 1; } set(x, y, 'C'); (A.cages = A.cages || []).push({ x, y }); },
    tank: (x, y) => set(x, y === undefined ? T.surface(x) - 1 : y, 'T'),
    gas: (x, y) => set(x, y === undefined ? T.surface(x) - 1 : y, 'F'),
    keg: (x, y) => set(x, y === undefined ? T.surface(x) - 1 : y, 'R'),
    // v0.5 World 3 helpers
    fridge: (x, y) => set(x, y === undefined ? T.surface(x) - 1 : y, 'W'),
    // hot coil floor run a..b on row (default 13); burns while glowing. period/phase in frames
    coil: (a, b, row, phase, period) => { const r = row === undefined ? 13 : row; for (let x = a; x <= b; x++) set(x, r, 'Q'); A.coils.push({ a, b, row: r, phase: phase || 0, period: period || 210 }); },
    // Fork in the Outlet: two outlets; a spark rests on one, then jumps along an arc to the other
    fork: (ax, ay, bx, by, period, phase) => { set(ax, ay, 'O'); set(bx, by, 'O'); A.forks.push({ ax, ay, bx, by, period: period || 150, phase: phase || 0 }); },
    // slot-reel platform (2 tiles wide) at tile tx,ty: shows a face, spins, lands on the next face
    reel: (tx, ty, faces, phase, show) => A.reels.push({ tx, ty, faces: faces || ['safe', 'bounce', 'safe', 'spike'], phase: phase || 0, show: show || 150 }),
  };
  return T;
}
