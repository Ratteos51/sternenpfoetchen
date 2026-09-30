/*
 * Sternenpfötchen – Spiel-Engine
 * Reine Logik ohne DOM: Level parsen, Züge ausführen, Sieg prüfen, Lösen (BFS).
 * Läuft im Browser (window.SPEngine) und in Node (require) für die Level-Tools.
 */
(function (root, factory) {
  const E = factory();
  if (typeof module === 'object' && module.exports) module.exports = E;
  else root.SPEngine = E;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const T = { VOID: 0, FLOOR: 1, WALL: 2, WATER: 3, ICE: 4, NEST: 5, PLATE: 6, GATE: 7, BRIDGE: 8 };

  // 0 hoch, 1 rechts, 2 runter, 3 links
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  // Nox spiegelt links/rechts
  const MIRROR = [0, 3, 2, 1];

  // Belegung (occ): 0 leer, 1 Luma, 2 Nox, 10+k Sternchen k, 1000+k Stein k
  const LUMA = 1, NOX = 2, STAR0 = 10, ROCK0 = 1000;

  const LEGEND = {
    ' ': [T.VOID], '#': [T.WALL], '.': [T.FLOOR], '~': [T.WATER], '_': [T.ICE],
    'o': [T.NEST], '^': [T.PLATE], '|': [T.GATE],
    '@': [T.FLOOR, 'l'], '+': [T.NEST, 'l'], '&': [T.FLOOR, 'n'],
    '$': [T.FLOOR, 's'], '*': [T.NEST, 's'], 'b': [T.FLOOR, 'r'],
    'S': [T.ICE, 's'], 'R': [T.ICE, 'r'], 'P': [T.PLATE, 's'], 'B': [T.PLATE, 'r']
  };

  function parse(rows) {
    const h = rows.length;
    const w = Math.max.apply(null, rows.map(r => r.length));
    const n = w * h;
    const terrain = new Uint8Array(n);
    const start = { l: -1, n: -1, s: [], r: [], b: [] };
    const nests = [], plates = [], gates = [], water = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x] || ' ';
        const def = LEGEND[ch];
        if (!def) throw new Error('Unbekanntes Zeichen "' + ch + '" in Zeile ' + y);
        const i = y * w + x;
        terrain[i] = def[0];
        if (def[0] === T.NEST) nests.push(i);
        if (def[0] === T.PLATE) plates.push(i);
        if (def[0] === T.GATE) gates.push(i);
        if (def[0] === T.WATER) water.push(i);
        switch (def[1]) {
          case 'l': start.l = i; break;
          case 'n': start.n = i; break;
          case 's': start.s.push(i); break;
          case 'r': start.r.push(i); break;
        }
      }
    }
    if (start.l < 0) throw new Error('Level ohne Luma (@)');
    return {
      w, h, n, terrain, start, nests, plates, gates, water,
      hasIce: terrain.includes(T.ICE),
      hasNox: start.n >= 0
    };
  }

  function cloneState(st) {
    return { l: st.l, n: st.n, s: st.s.slice(), r: st.r.slice(), b: st.b.slice() };
  }

  function neighbor(level, i, d) {
    const x = (i % level.w) + DIRS[d][0];
    const y = ((i / level.w) | 0) + DIRS[d][1];
    if (x < 0 || y < 0 || x >= level.w || y >= level.h) return -1;
    return y * level.w + x;
  }

  function buildOcc(level, st) {
    const occ = new Int16Array(level.n);
    occ[st.l] = LUMA;
    if (st.n >= 0) occ[st.n] = NOX;
    for (let k = 0; k < st.s.length; k++) occ[st.s[k]] = STAR0 + k;
    for (let k = 0; k < st.r.length; k++) if (st.r[k] >= 0) occ[st.r[k]] = ROCK0 + k;
    return occ;
  }

  function gatesOpenFor(level, occ) {
    const p = level.plates;
    for (let k = 0; k < p.length; k++) if (occ[p[k]] !== 0) return true;
    return false;
  }

  /**
   * Führt einen Zug aus. Luma bewegt sich in Richtung dir, danach (falls vorhanden)
   * Nox in die gespiegelte Richtung – auf dem bereits aktualisierten Feld.
   * Gibt { state, changed, events } zurück; state ist ein neues Objekt.
   */
  function step(level, st, dir, collect) {
    let tt = level.terrain;
    let ttOwned = false;
    if (st.b.length) {
      tt = tt.slice(); ttOwned = true;
      for (let k = 0; k < st.b.length; k++) tt[st.b[k]] = T.BRIDGE;
    }
    const occ = buildOcc(level, st);
    const ns = cloneState(st);
    const events = collect ? [] : null;
    const hasPlates = level.plates.length > 0;

    function blocked(i) {
      // Gelände, das weder Figuren noch Objekte betreten können
      if (i < 0) return true;
      const t = tt[i];
      if (t === T.VOID || t === T.WALL) return true;
      if (t === T.GATE && occ[i] === 0 && !(hasPlates && gatesOpenFor(level, occ))) return true;
      return false;
    }

    function sink(i) {
      if (!ttOwned) { tt = tt.slice(); ttOwned = true; }
      tt[i] = T.BRIDGE;
      let k = 0;
      while (k < ns.b.length && ns.b[k] < i) k++;
      ns.b.splice(k, 0, i);
    }

    function push(at, d) {
      const o = occ[at];
      const isRock = o >= ROCK0;
      const id = isRock ? o - ROCK0 : o - STAR0;
      const c = neighbor(level, at, d);
      if (blocked(c) || occ[c] !== 0) return false;
      if (tt[c] === T.WATER && !isRock) return false;
      occ[at] = 0;
      const path = [at, c];
      let cur = c, sunk = false;
      if (tt[cur] === T.WATER) {
        sunk = true;
      } else {
        while (tt[cur] === T.ICE) {
          const nx = neighbor(level, cur, d);
          if (blocked(nx) || occ[nx] !== 0) break;
          if (tt[nx] === T.WATER) {
            if (isRock) { path.push(nx); cur = nx; sunk = true; }
            break;
          }
          cur = nx; path.push(cur);
        }
      }
      if (sunk) {
        sink(cur);
        ns.r[id] = -1;
      } else {
        occ[cur] = o;
        if (isRock) ns.r[id] = cur; else ns.s[id] = cur;
      }
      if (events) events.push({ k: 'push', obj: isRock ? 'r' : 's', id, path, sunk, d });
      return true;
    }

    function moveChar(who, d) {
      const from = who === LUMA ? ns.l : ns.n;
      const t = neighbor(level, from, d);
      const fail = () => { if (events) events.push({ k: 'bump', who, d, at: from }); return false; };
      if (blocked(t) || tt[t] === T.WATER) return fail();
      const o = occ[t];
      let pushed = false;
      if (o === LUMA || o === NOX) return fail();
      if (o !== 0) {
        if (!push(t, d)) return fail();
        pushed = true;
      }
      occ[from] = 0;
      const path = [from, t];
      let cur = t;
      while (tt[cur] === T.ICE) {
        const nx = neighbor(level, cur, d);
        if (blocked(nx) || tt[nx] === T.WATER || occ[nx] !== 0) break;
        cur = nx; path.push(cur);
      }
      occ[cur] = who;
      if (who === LUMA) ns.l = cur; else ns.n = cur;
      if (events) events.push({ k: 'move', who, path, d, pushed });
      return true;
    }

    let changed = moveChar(LUMA, dir);
    if (ns.n >= 0) changed = moveChar(NOX, MIRROR[dir]) || changed;
    return { state: ns, changed, events };
  }

  function isWon(level, st) {
    const ne = level.nests;
    for (let k = 0; k < ne.length; k++) if (st.s.indexOf(ne[k]) < 0) return false;
    return ne.length > 0;
  }

  function starsHome(level, st) {
    let c = 0;
    for (const p of st.s) if (level.terrain[p] === T.NEST) c++;
    return c;
  }

  function stateKey(st) {
    const s = st.s.length > 1 ? st.s.slice().sort((a, b) => a - b) : st.s;
    let r = '';
    if (st.r.length) {
      const rr = st.r.filter(p => p >= 0).sort((a, b) => a - b);
      r = rr.join(',');
    }
    return st.l + ',' + st.n + '|' + s.join(',') + '|' + r + '|' + st.b.join(',');
  }

  /**
   * Breitensuche. Als Generator, damit der Browser in Häppchen rechnen kann.
   * opts: { maxStates, path (volle Lösung zurückgeben), chunk }
   * Ergebnis: { solved, moves (Richtungen) | firstMove, explored, aborted }
   */
  function* solveIter(level, start, opts) {
    opts = opts || {};
    const maxStates = opts.maxStates || 500000;
    const wantPath = !!opts.path;
    const chunk = opts.chunk || 4000;
    if (isWon(level, start)) return { solved: true, moves: [], firstMove: -1, explored: 1 };
    const startKey = stateKey(start);
    const info = new Map();
    info.set(startKey, null);
    const qs = [start], qk = [startKey], qf = [-1];
    let head = 0, work = 0;
    while (head < qs.length) {
      const st = qs[head], sk = qk[head], sf = qf[head];
      head++;
      for (let d = 0; d < 4; d++) {
        const r = step(level, st, d, false);
        if (!r.changed) continue;
        const k = stateKey(r.state);
        if (info.has(k)) continue;
        const first = sf < 0 ? d : sf;
        info.set(k, wantPath ? [sk, d] : first);
        if (isWon(level, r.state)) {
          const res = { solved: true, firstMove: first, explored: info.size };
          if (wantPath) {
            const moves = [];
            let cur = k;
            while (cur !== startKey) { const e = info.get(cur); moves.push(e[1]); cur = e[0]; }
            res.moves = moves.reverse();
          }
          return res;
        }
        if (info.size >= maxStates) return { solved: false, aborted: true, explored: info.size };
        qs.push(r.state); qk.push(k); qf.push(first);
      }
      qs[head - 1] = null;
      if (++work >= chunk) { work = 0; yield info.size; }
    }
    return { solved: false, aborted: false, explored: info.size };
  }

  function solve(level, start, opts) {
    const it = solveIter(level, start || level.start, opts);
    let r = it.next();
    while (!r.done) r = it.next();
    return r.value;
  }

  /** Spielt eine Zugfolge ab und sammelt Statistiken (für Tools & Tests). */
  function replay(level, moves) {
    let st = level.start;
    const stats = { pushes: 0, noxPushes: 0, sinks: 0, slides: 0, gatePasses: 0, won: false };
    for (const d of moves) {
      const r = step(level, st, d, true);
      for (const e of r.events) {
        if (e.k === 'push') {
          if (e.sunk) stats.sinks++;
          if (e.path.length > 2) stats.slides++;
        }
        if (e.k === 'move') {
          if (e.pushed) { stats.pushes++; if (e.who === NOX) stats.noxPushes++; }
          if (e.path.length > 2) stats.slides++;
          if (e.path.some(p => level.terrain[p] === T.GATE)) stats.gatePasses++;
        }
      }
      st = r.state;
    }
    stats.won = isWon(level, st);
    stats.final = st;
    return stats;
  }

  return {
    T, DIRS, MIRROR, LUMA, NOX, LEGEND,
    parse, step, isWon, starsHome, stateKey, cloneState, neighbor,
    buildOcc, gatesOpenFor, solve, solveIter, replay
  };
});
