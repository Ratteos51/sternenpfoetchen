#!/usr/bin/env node
/*
 * Level-Generator für Sternenpfötchen.
 * Erzeugt zufällige Räume je Welt-Mechanik, löst sie per BFS und bewertet sie.
 * Aufruf: node tools/generate.js <welt 1-5> [anzahl=4000] [seed=1] [variante]
 * Ausgabe: tools/out/world-<n>.json (beste Kandidaten, nach Schwierigkeit sortiert)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const E = require('../js/engine.js');

const world = +process.argv[2] || 1;
const tries = +process.argv[3] || 4000;
let seed = +process.argv[4] || 1;
const variant = process.argv[5] || '';

function rnd() { // mulberry32
  seed |= 0; seed = seed + 0x6D2B79F5 | 0;
  let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = arr => arr[Math.floor(rnd() * arr.length)];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function makeGrid(W, H) {
  const g = [];
  for (let y = 0; y < H + 2; y++) {
    const row = [];
    for (let x = 0; x < W + 2; x++) row.push(x === 0 || y === 0 || x === W + 1 || y === H + 1 ? '#' : '.');
    g.push(row);
  }
  return g;
}
const inner = g => { const c = []; for (let y = 1; y < g.length - 1; y++) for (let x = 1; x < g[0].length - 1; x++) c.push([x, y]); return c; };
const walkable = ch => ch !== '#' && ch !== ' ' && ch !== '~';

function connected(g) {
  // alle begehbaren Felder (inkl. Tore) müssen verbunden sein; Wasser zählt als verbindend,
  // weil es überbrückt werden kann
  const H = g.length, W = g[0].length;
  const cells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] !== '#' && g[y][x] !== ' ') cells.push([x, y]);
  if (!cells.length) return false;
  const seen = new Set([cells[0].join()]);
  const st = [cells[0]];
  while (st.length) {
    const [x, y] = st.pop();
    for (const [dx, dy] of E.DIRS) {
      const nx = x + dx, ny = y + dy;
      if (g[ny][nx] === '#' || g[ny][nx] === ' ') continue;
      const k = nx + ',' + ny;
      if (!seen.has(k)) { seen.add(k); st.push([nx, ny]); }
    }
  }
  return seen.size === cells.length;
}

function sprinkleWalls(g, density) {
  const cells = shuffle(inner(g));
  const n = Math.floor(cells.length * density);
  for (let k = 0; k < n; k++) {
    const [x, y] = cells[k];
    g[y][x] = '#';
    if (!connected(g)) g[y][x] = '.';
  }
}

function voidify(g) {
  const H = g.length, W = g[0].length;
  const out = g.map(r => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] !== '#') continue;
    let near = false;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const r = g[y + dy];
      if (r && r[x + dx] !== undefined && r[x + dx] !== '#' && r[x + dx] !== ' ') near = true;
    }
    if (!near) out[y][x] = ' ';
  }
  // leere Außenzeilen/-spalten entfernen
  let rows = out.map(r => r.join(''));
  while (rows.length && !rows[0].trim()) rows.shift();
  while (rows.length && !rows[rows.length - 1].trim()) rows.pop();
  let minX = Infinity, maxX = 0;
  for (const r of rows) { const m = r.match(/^ */)[0].length; if (r.trim()) { minX = Math.min(minX, m); maxX = Math.max(maxX, r.replace(/ +$/, '').length); } }
  rows = rows.map(r => r.slice(minX, maxX).replace(/ +$/, ''));
  return rows;
}

function fillDeadEnds(g) {
  // leere Sackgassen-Felder (3 Wände drumherum) zuschütten → aufgeräumtere Level
  let changed = true;
  while (changed) {
    changed = false;
    for (const [x, y] of inner(g)) {
      if (g[y][x] !== '.') continue;
      let walls = 0;
      for (const [dx, dy] of E.DIRS) if (g[y + dy][x + dx] === '#') walls++;
      if (walls >= 3) { g[y][x] = '#'; changed = true; }
    }
  }
}

function freeCells(g, pred) {
  return inner(g).filter(([x, y]) => pred ? pred(g[y][x], x, y) : g[y][x] === '.');
}

function place(g, ch, n, pred) {
  const c = shuffle(freeCells(g, pred));
  if (c.length < n) return false;
  for (let k = 0; k < n; k++) g[c[k][1]][c[k][0]] = ch;
  return true;
}

// ---------- Welt-spezifische Erzeugung ----------
const CFG = {
  1: () => {
    const W = ri(5, 7), H = ri(5, 7);
    const g = makeGrid(W, H);
    sprinkleWalls(g, 0.12 + rnd() * 0.16);
    const k = ri(2, 3);
    if (!place(g, 'o', k) || !place(g, '$', k) || !place(g, '@', 1)) return null;
    return g;
  },
  2: () => {
    const W = ri(5, 7), H = ri(5, 7);
    const g = makeGrid(W, H);
    sprinkleWalls(g, 0.06 + rnd() * 0.12);
    const mode = rnd();
    if (mode < 0.55) {
      // Bach quer durch den Raum
      const vertical = rnd() < 0.5;
      const len = vertical ? H : W;
      let pos = ri(2, (vertical ? W : H) - 1);
      for (let t = 1; t <= len; t++) {
        const [x, y] = vertical ? [pos, t] : [t, pos];
        if (g[y][x] === '.') g[y][x] = '~';
        if (rnd() < 0.2) { // kleiner Knick
          const np = Math.max(2, Math.min((vertical ? W : H) - 1, pos + (rnd() < 0.5 ? -1 : 1)));
          const [x2, y2] = vertical ? [np, t] : [t, np];
          if (g[y2][x2] === '.') g[y2][x2] = '~';
          pos = np;
        }
      }
    } else {
      const k = ri(2, 5);
      place(g, '~', k);
    }
    const stars = ri(1, 2);
    const rocks = ri(1, 3);
    if (!place(g, 'o', stars) || !place(g, '$', stars) || !place(g, 'b', rocks) || !place(g, '@', 1)) return null;
    return g;
  },
  3: () => {
    const W = ri(5, 7), H = ri(5, 7);
    const g = makeGrid(W, H);
    sprinkleWalls(g, 0.08 + rnd() * 0.14);
    // Eisflächen als Rechtecke
    const patches = ri(1, 3);
    for (let p = 0; p < patches; p++) {
      const pw = ri(2, 4), ph = ri(1, 3);
      const px = ri(1, W - pw + 1), py = ri(1, H - ph + 1);
      for (let y = py; y < py + ph; y++) for (let x = px; x < px + pw; x++) if (g[y][x] === '.') g[y][x] = '_';
    }
    const stars = ri(1, 3);
    if (!place(g, 'o', stars) || !place(g, '$', stars) || !place(g, '@', 1)) return null;
    if (variant === 'mix' && rnd() < 0.6) { place(g, 'b', 1); }
    return g;
  },
  4: () => {
    const W = ri(5, 7), H = ri(6, 8);
    const g = makeGrid(W, H);
    // Trennhecke mit Tor
    const vertical = W > H ? true : rnd() < 0.35;
    const lim = vertical ? W : H;
    const line = ri(3, lim - 2);
    const len = vertical ? H : W;
    const gatePos = ri(1, len);
    for (let t = 1; t <= len; t++) {
      const [x, y] = vertical ? [line, t] : [t, line];
      g[y][x] = t === gatePos ? '|' : '#';
    }
    if (rnd() < 0.3) { // zweites Tor
      const t2 = ri(1, len);
      const [x, y] = vertical ? [line, t2] : [t2, line];
      g[y][x] = '|';
    }
    sprinkleWalls(g, 0.04 + rnd() * 0.1);
    const plates = ri(1, 2);
    const stars = ri(1, 2);
    if (!place(g, '^', plates) || !place(g, 'o', stars) || !place(g, '$', stars) || !place(g, '@', 1)) return null;
    if (rnd() < 0.6) place(g, 'b', ri(1, 2));
    if (variant === 'mix' && rnd() < 0.5) {
      const c = shuffle(freeCells(g)).slice(0, ri(2, 4));
      for (const [x, y] of c) g[y][x] = '_';
    }
    return g;
  },
  5: () => {
    const W = ri(5, 7), H = ri(4, 6);
    const g = makeGrid(W, H);
    sprinkleWalls(g, 0.06 + rnd() * 0.14);
    const stars = ri(1, 2);
    if (!place(g, 'o', stars) || !place(g, '$', stars) || !place(g, '@', 1) || !place(g, '&', 1)) return null;
    if (variant === 'mix') {
      const f = rnd();
      if (f < 0.4) { const c = shuffle(freeCells(g)).slice(0, ri(2, 5)); for (const [x, y] of c) g[y][x] = '_'; }
      else if (f < 0.7) { place(g, '~', ri(1, 2)); place(g, 'b', ri(1, 2)); }
    }
    return g;
  }
};

function mechanicOk(stats, L) {
  switch (world) {
    case 2: return stats.sinks >= 1;
    case 3: return stats.slides >= 2;
    case 4: return stats.gatePasses >= 1;
    case 5: return stats.noxPushes >= 1 && stats.pushes - stats.noxPushes >= 1;
    default: return true;
  }
}

function pushSegments(L, moves) {
  // wie oft wechselt das geschobene Objekt bzw. die Schieberichtung
  let st = L.start, last = null, seg = 0;
  for (const d of moves) {
    const r = E.step(L, st, d, true);
    for (const e of r.events) if (e.k === 'push') {
      const sig = e.obj + e.id + ':' + e.d;
      if (sig !== last) { seg++; last = sig; }
    }
    st = r.state;
  }
  return seg;
}

const results = [];
const seenMaps = new Set();
const t0 = Date.now();
for (let i = 0; i < tries; i++) {
  const g = CFG[world]();
  if (!g) continue;
  fillDeadEnds(g);
  const rows = voidify(g);
  const key = rows.join('/');
  if (seenMaps.has(key)) continue;
  seenMaps.add(key);
  let L;
  try { L = E.parse(rows); } catch (e) { continue; }
  if (L.nests.length !== L.start.s.length) continue;
  const res = E.solve(L, L.start, { path: true, maxStates: 250000 });
  if (!res.solved) continue;
  const stats = E.replay(L, res.moves);
  if (!stats.won || !mechanicOk(stats, L)) continue;
  const par = res.moves.length;
  if (par < 6) continue;
  const segs = pushSegments(L, res.moves);
  const score = segs * 4 + stats.pushes + par * 0.4 + Math.log2(res.explored) * 1.5;
  results.push({ rows, par, pushes: stats.pushes, segs, explored: res.explored, score: +score.toFixed(1), stars: L.nests.length, sol: res.moves.join('') });
}
results.sort((a, b) => a.score - b.score);
// in Bänder aufteilen und je Band die besten nehmen
const out = [];
const bands = 12;
for (let b = 0; b < bands; b++) {
  const lo = Math.floor(results.length * b / bands), hi = Math.floor(results.length * (b + 1) / bands);
  const band = results.slice(lo, hi).sort((a, c) => (c.segs / c.rows.join('').length) - (a.segs / a.rows.join('').length));
  out.push(...band.slice(0, 4));
}
out.sort((a, b) => a.score - b.score);
fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
const file = path.join(__dirname, 'out', 'world-' + world + (variant ? '-' + variant : '') + '.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(`Welt ${world}: ${results.length} lösbare Kandidaten aus ${tries} Versuchen in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${file}`);
for (const r of out) {
  console.log(`\nscore ${r.score}  par ${r.par}  pushes ${r.pushes}  segs ${r.segs}  explored ${r.explored}  stars ${r.stars}`);
  console.log(r.rows.map(x => '   ' + x).join('\n'));
}
