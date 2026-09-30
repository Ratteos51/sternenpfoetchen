/*
 * Sternenpfötchen – Spielfeld-Renderer mit Animationen und Partikeln.
 */
(function (root) {
  'use strict';
  const E = root.SPEngine, S = root.SPSprites;
  const T = E.T;
  const TAU = Math.PI * 2;

  const THEMES = {
    moos: {
      bg1: '#eaf6dc', bg2: '#d7efc4', floorA: '#c9e6a6', floorB: '#bfe09a', soil: '#b7916a', soilDark: '#9c7753',
      wall: { kind: 'bush', dark: '#5f9e57', main: '#78b96a', light: '#96cf82', deco: ['#ff9ec4', '#fff17a', '#ffffff'] },
      deco: ['#ffffff', '#ffe27a', '#ff9ec4'], water: '#8fd3e8', ice: '#d5f0fb'
    },
    teich: {
      bg1: '#e3f5f1', bg2: '#cbeee6', floorA: '#cfeabb', floorB: '#c3e3ad', soil: '#a88f6d', soilDark: '#8d7657',
      wall: { kind: 'reed', dark: '#4f9a78', main: '#67b58f', light: '#86cba6', deco: ['#9b6b4a', '#ffc2dc'] },
      deco: ['#ffffff', '#c7e8ff', '#ffc2dc'], water: '#86cfe6', ice: '#d5f0fb'
    },
    frost: {
      bg1: '#eef6fc', bg2: '#dcebf7', floorA: '#f4f9fd', floorB: '#e8f2fa', soil: '#a9bfd4', soilDark: '#8ea7c0',
      wall: { kind: 'snow', dark: '#9fbfd8', main: '#d9eaf6', light: '#ffffff', deco: ['#6fa88a', '#ff8f8f'] },
      deco: ['#bfe3ff', '#ffffff', '#d6e8ff'], water: '#86c7e6', ice: '#c4e8f8'
    },
    pilz: {
      bg1: '#f1ebdc', bg2: '#e4dac3', floorA: '#d6d5a4', floorB: '#cccb97', soil: '#9d7a58', soilDark: '#7f6044',
      wall: { kind: 'tree', dark: '#4d7d4b', main: '#659a5c', light: '#7fb271', deco: ['#ff6f85', '#fff3e0', '#ffd24d'] },
      deco: ['#fff3e0', '#ff9ec4', '#e8e19a'], water: '#8ccbd9', ice: '#d5f0fb'
    },
    wolken: {
      bg1: '#f3ecfd', bg2: '#e4d9fa', floorA: '#fbeef8', floorB: '#f5e3f3', soil: '#cbb8ec', soilDark: '#b39fe0',
      wall: { kind: 'cloud', dark: '#c8b8ef', main: '#f2ecff', light: '#ffffff', deco: ['#ffe27a', '#ffc2dc'] },
      deco: ['#ffffff', '#ffe27a', '#d8c8ff'], water: '#a9c8f5', ice: '#dcecfb'
    }
  };

  const ease = x => 1 - (1 - x) * (1 - x);
  const SEG_FIRST = 125, SEG_SLIDE = 62;

  class Board {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.particles = [];
      this.anims = [];
      this.cache = null;
      this.hintDir = -1;
      this.dpr = 1;
      this.fur = 'creme'; this.hat = null; this.neck = null;
      this.onLand = null; // Callback für Sounds bei Landungen
    }

    load(level, state, themeId) {
      this.level = level;
      this.theme = THEMES[themeId] || THEMES.moos;
      this.celebrating = 0;
      this.particles = [];
      this.anims = [];
      this.hintDir = -1;
      this.ents = {
        luma: { cell: state.l, x: 0, y: 0, face: 1, look: [0, 1], squash: 0, happy: 0 },
        nox: state.n >= 0 ? { cell: state.n, x: 0, y: 0, face: -1, look: [0, 1], squash: 0 } : null,
        stars: state.s.map((c, k) => ({ cell: c, x: 0, y: 0, phase: k * 1.7, home: level.terrain[c] === T.NEST, lift: 0 })),
        rocks: state.r.map(c => ({ cell: c, x: 0, y: 0, alive: c >= 0, sink: 0 }))
      };
      this.bridges = new Set(state.b);
      this.gateOpen = 0;
      this.snap(state);
      this.resize();
    }

    xy(cell) { return [cell % this.level.w, (cell / this.level.w) | 0]; }

    snap(state) {
      const e = this.ents;
      const setPos = (o, c) => { o.cell = c; const [x, y] = this.xy(c); o.x = x; o.y = y; o.squash = 0; };
      setPos(e.luma, state.l);
      if (e.nox) setPos(e.nox, state.n);
      state.s.forEach((c, k) => { setPos(e.stars[k], c); e.stars[k].home = this.level.terrain[c] === T.NEST; });
      state.r.forEach((c, k) => { const r = e.rocks[k]; r.alive = c >= 0; r.sink = 0; if (c >= 0) setPos(r, c); });
      const bset = new Set(state.b);
      if (bset.size !== this.bridges.size || [...bset].some(b => !this.bridges.has(b))) { this.bridges = bset; this.cache = null; }
      this.anims = [];
      this.state = state;
      this.gateTarget = this.computeGateOpen(state);
      this.gateOpen = this.gateTarget;
    }

    computeGateOpen(state) {
      const occ = E.buildOcc(this.level, state);
      return E.gatesOpenFor(this.level, occ) ? 1 : 0;
    }

    resize() {
      if (!this.level) return;
      const c = this.canvas;
      const rect = c.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      this.dpr = dpr;
      const W = Math.max(50, rect.width), H = Math.max(50, rect.height);
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      c.style.width = W + 'px'; c.style.height = H + 'px';
      const L = this.level;
      const ts = Math.floor(Math.min((W - 16) / L.w, (H - 16) / (L.h + 0.35), 84));
      this.ts = Math.max(18, ts);
      this.ox = Math.round((W - this.ts * L.w) / 2);
      this.oy = Math.round((H - this.ts * (L.h + 0.3)) / 2);
      this.cache = null;
    }

    // ---------- Animationen ----------
    apply(events, newState) {
      // laufende Animationen abschließen
      this.finishAnims();
      const now = performance.now();
      const e = this.ents;
      let delay = 0;
      for (const ev of events) {
        if (ev.k === 'move') {
          const o = ev.who === E.LUMA ? e.luma : e.nox;
          const dx = E.DIRS[ev.d][0];
          if (dx) o.face = dx;
          o.look = E.DIRS[ev.d].slice();
          this.animPath(o, ev.path, now, 'char');
        } else if (ev.k === 'push') {
          const o = ev.obj === 's' ? e.stars[ev.id] : e.rocks[ev.id];
          this.animPath(o, ev.path, now, ev.obj, ev);
        } else if (ev.k === 'bump') {
          const o = ev.who === E.LUMA ? e.luma : e.nox;
          if (!o) continue;
          const dx = E.DIRS[ev.d][0];
          if (dx) o.face = dx;
          o.look = E.DIRS[ev.d].slice();
          this.anims.push({ o, t0: now, dur: 160, kind: 'bump', d: ev.d, bx: o.x, by: o.y });
        }
      }
      this.state = newState;
      this.gateTarget = this.computeGateOpen(newState);
      return delay;
    }

    animPath(o, path, now, kind, ev) {
      const pts = path.map(c => this.xy(c));
      const segs = [];
      let t = 0;
      for (let k = 1; k < pts.length; k++) {
        const dur = k === 1 ? SEG_FIRST : SEG_SLIDE;
        segs.push({ a: pts[k - 1], b: pts[k], t0: t, dur });
        t += dur;
      }
      o.cell = path[path.length - 1];
      this.anims.push({ o, t0: now, dur: t, kind, segs, ev, slide: pts.length > 2 });
    }

    finishAnims() {
      for (const a of this.anims) this.endAnim(a);
      this.anims = [];
    }

    endAnim(a) {
      if (a.done) return;
      a.done = true;
      const o = a.o;
      if (a.segs) { const last = a.segs[a.segs.length - 1].b; o.x = last[0]; o.y = last[1]; }
      if (a.kind === 'bump') { o.x = a.bx; o.y = a.by; o.squash = 0; }
      if (a.kind === 's') {
        const home = this.level.terrain[o.cell] === T.NEST;
        if (home && !o.home) { this.burst(o.x, o.y, 'star'); this.onLand && this.onLand('home'); }
        o.home = home;
      }
      if (a.kind === 'r' && a.ev && a.ev.sunk) {
        o.alive = false;
        this.bridges.add(o.cell);
        this.cache = null;
        this.burst(o.x, o.y, 'splash');
        this.onLand && this.onLand('splash');
      }
      if (a.slide) { this.burst(o.x, o.y, 'puff'); }
    }

    busy() { return this.anims.length > 0; }

    update(now) {
      const keep = [];
      for (const a of this.anims) {
        const el = now - a.t0;
        const o = a.o;
        if (el >= a.dur) { this.endAnim(a); continue; }
        if (a.kind === 'bump') {
          const p = el / a.dur;
          const k = Math.sin(p * Math.PI) * 0.12;
          o.x = a.bx + E.DIRS[a.d][0] * k; o.y = a.by + E.DIRS[a.d][1] * k;
          o.squash = Math.sin(p * Math.PI) * 0.5;
        } else {
          let seg = a.segs[a.segs.length - 1];
          for (const s of a.segs) if (el < s.t0 + s.dur) { seg = s; break; }
          let p = Math.min(1, (el - seg.t0) / seg.dur);
          if (a.segs.length === 1) p = ease(p);
          o.x = seg.a[0] + (seg.b[0] - seg.a[0]) * p;
          o.y = seg.a[1] + (seg.b[1] - seg.a[1]) * p;
          if (a.kind === 'char') o.squash = Math.sin(Math.min(1, el / a.dur) * Math.PI) * 0.25;
          if (a.kind === 'r' && a.ev.sunk && seg === a.segs[a.segs.length - 1]) o.sink = p * 0.5;
        }
        keep.push(a);
      }
      this.anims = keep;
      // Tore sanft öffnen/schließen
      this.gateOpen += (this.gateTarget - this.gateOpen) * 0.25;
      // Partikel
      const dt = 1 / 60;
      this.particles = this.particles.filter(p => {
        p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.rot += p.vr * dt;
        return p.life > 0;
      });
    }

    burst(x, y, kind) {
      const n = { star: 18, splash: 14, puff: 7, heart: 10, sparkle: 6 }[kind] || 8;
      for (let k = 0; k < n; k++) {
        const a = Math.random() * TAU, sp = 0.8 + Math.random() * 2.2;
        const p = { x: x + 0.5, y: y + 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0, life: 0.6 + Math.random() * 0.5, max: 1, kind, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, size: 0.08 + Math.random() * 0.08 };
        if (kind === 'splash') { p.vy = -1.5 - Math.random() * 2; p.vx *= 0.6; p.g = 9; p.life = 0.5 + Math.random() * 0.3; }
        if (kind === 'puff') { p.vx *= 0.4; p.vy = -0.3 - Math.random() * 0.5; p.life = 0.4 + Math.random() * 0.2; }
        if (kind === 'heart') { p.vy = -1 - Math.random() * 1.5; p.vx *= 0.5; p.life = 1.2 + Math.random() * 0.6; p.size = 0.14 + Math.random() * 0.08; }
        p.max = p.life;
        this.particles.push(p);
      }
    }

    celebrate() {
      this.celebrating = performance.now();
      this.ents.luma.happy = 1;
      this.burst(this.ents.luma.x, this.ents.luma.y, 'heart');
      this.ents.stars.forEach((s, k) => { s.fly = this.celebrating + 250 + k * 180; });
    }

    // ---------- Zeichnen ----------
    buildCache() {
      const L = this.level, ts = this.ts, dpr = this.dpr;
      const c = document.createElement('canvas');
      c.width = Math.ceil(ts * L.w * dpr); c.height = Math.ceil(ts * (L.h + 0.4) * dpr);
      const g = c.getContext('2d');
      g.scale(dpr, dpr);
      const th = this.theme;
      const tt = (x, y) => (x < 0 || y < 0 || x >= L.w || y >= L.h) ? T.VOID : L.terrain[y * L.w + x];
      const isBridge = i => this.bridges.has(i);

      // Erdrand unter der Insel
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        if (tt(x, y) === T.VOID || tt(x, y + 1) !== T.VOID) continue;
        const px = x * ts, py = (y + 1) * ts;
        g.fillStyle = th.soil; g.fillRect(px, py - 2, ts, ts * 0.26);
        g.fillStyle = th.soilDark; g.fillRect(px, py + ts * 0.18, ts, ts * 0.08);
      }
      // Boden
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        const t = tt(x, y);
        if (t === T.VOID) continue;
        const px = x * ts, py = y * ts, i = y * L.w + x;
        g.fillStyle = (x + y) % 2 ? th.floorA : th.floorB;
        g.fillRect(px, py, ts + 0.5, ts + 0.5);
        if (t === T.FLOOR || t === T.NEST || t === T.PLATE || t === T.GATE) this.floorDeco(g, px, py, ts, i);
        if (t === T.WATER) this.drawWaterBase(g, x, y, ts, tt, isBridge(i));
        if (t === T.ICE) this.drawIce(g, x, y, ts, tt, i);
      }
      // Wände (von oben nach unten, damit sie sich überlappen)
      for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
        if (tt(x, y) === T.WALL) this.drawWall(g, x, y, ts, tt, y * L.w + x);
      }
      this.cache = c;
    }

    floorDeco(g, px, py, ts, i) {
      const th = this.theme;
      const h1 = S.hash(i, 1), h2 = S.hash(i, 2), h3 = S.hash(i, 3);
      if (h1 < 0.35) {
        // Grasbüschel / Glitzer
        g.strokeStyle = 'rgba(80,120,60,0.22)';
        if (th === THEMES.frost) g.strokeStyle = 'rgba(120,160,200,0.3)';
        if (th === THEMES.wolken) g.strokeStyle = 'rgba(190,160,230,0.35)';
        g.lineWidth = Math.max(1, ts * 0.025); g.lineCap = 'round';
        const x = px + ts * (0.2 + h2 * 0.6), y = py + ts * (0.25 + h3 * 0.55);
        g.beginPath(); g.moveTo(x - ts * 0.05, y); g.lineTo(x - ts * 0.08, y - ts * 0.08);
        g.moveTo(x, y); g.lineTo(x, y - ts * 0.1); g.moveTo(x + ts * 0.05, y); g.lineTo(x + ts * 0.08, y - ts * 0.08); g.stroke();
      }
      if (h2 < 0.16) {
        const col = th.deco[Math.floor(h3 * th.deco.length)];
        const x = px + ts * (0.2 + h1 * 0.6), y = py + ts * (0.2 + h3 * 0.6), r = ts * 0.035;
        for (let p = 0; p < 5; p++) S.circle(g, x + Math.cos(p * TAU / 5) * r * 1.3, y + Math.sin(p * TAU / 5) * r * 1.3, r, col);
        S.circle(g, x, y, r * 0.8, '#fff6a8');
      }
    }

    drawWaterBase(g, x, y, ts, tt, bridged) {
      const px = x * ts, py = y * ts;
      const th = this.theme;
      const isW = (xx, yy) => tt(xx, yy) === T.WATER;
      const m = ts * 0.06;
      g.fillStyle = 'rgba(90,140,120,0.35)';
      S.roundRect(g, px + (isW(x - 1, y) ? 0 : m) - 1, py + (isW(x, y - 1) ? 0 : m) - 1, ts - (isW(x - 1, y) ? 0 : m) - (isW(x + 1, y) ? 0 : m) + 2, ts - (isW(x, y - 1) ? 0 : m) - (isW(x, y + 1) ? 0 : m) + 2, ts * 0.2); g.fill();
      g.fillStyle = th.water;
      S.roundRect(g, px + (isW(x - 1, y) ? 0 : m), py + (isW(x, y - 1) ? 0 : m), ts - (isW(x - 1, y) ? 0 : m) - (isW(x + 1, y) ? 0 : m), ts - (isW(x, y - 1) ? 0 : m) - (isW(x, y + 1) ? 0 : m), ts * 0.18); g.fill();
      if (bridged) {
        const cx = px + ts / 2, cy = py + ts / 2;
        S.ellipse(g, cx, cy + ts * 0.06, ts * 0.4, ts * 0.3, 'rgba(60,90,110,0.3)');
        S.ellipse(g, cx, cy, ts * 0.4, ts * 0.3, '#b3aca6');
        S.ellipse(g, cx - ts * 0.04, cy - ts * 0.04, ts * 0.32, ts * 0.22, '#cbc5bf');
        S.ellipse(g, cx + ts * 0.14, cy - ts * 0.12, ts * 0.12, ts * 0.06, '#8cc56f');
      }
    }

    drawIce(g, x, y, ts, tt, i) {
      const px = x * ts, py = y * ts;
      g.fillStyle = this.theme.ice;
      g.fillRect(px, py, ts + 0.5, ts + 0.5);
      const isI = (xx, yy) => tt(xx, yy) === T.ICE;
      g.strokeStyle = 'rgba(140,195,225,0.8)'; g.lineWidth = Math.max(1, ts * 0.03);
      g.beginPath();
      if (!isI(x, y - 1)) { g.moveTo(px, py + 1); g.lineTo(px + ts, py + 1); }
      if (!isI(x, y + 1)) { g.moveTo(px, py + ts - 1); g.lineTo(px + ts, py + ts - 1); }
      if (!isI(x - 1, y)) { g.moveTo(px + 1, py); g.lineTo(px + 1, py + ts); }
      if (!isI(x + 1, y)) { g.moveTo(px + ts - 1, py); g.lineTo(px + ts - 1, py + ts); }
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = Math.max(1, ts * 0.04); g.lineCap = 'round';
      const h = S.hash(i, 7);
      g.beginPath();
      g.moveTo(px + ts * (0.2 + h * 0.2), py + ts * 0.55); g.lineTo(px + ts * (0.4 + h * 0.2), py + ts * 0.35);
      g.moveTo(px + ts * (0.35 + h * 0.2), py + ts * 0.7); g.lineTo(px + ts * (0.5 + h * 0.2), py + ts * 0.55);
      g.stroke();
    }

    drawWall(g, x, y, ts, tt, i) {
      const w = this.theme.wall;
      const px = x * ts, py = y * ts;
      const isWall = (xx, yy) => tt(xx, yy) === T.WALL;
      const up = isWall(x, y - 1), dn = isWall(x, y + 1), lf = isWall(x - 1, y), rt = isWall(x + 1, y);
      const cx = px + ts / 2, cy = py + ts / 2;
      const h = S.hash(i, 11), h2 = S.hash(i, 12);
      const lift = ts * 0.12; // 2.5D-Höhe
      // Schatten auf dem Boden
      if (!dn) S.ellipse(g, cx, py + ts * 0.94, ts * 0.46, ts * 0.1, 'rgba(50,40,70,0.14)');
      // Grundkörper (verbunden mit Nachbarn)
      const blob = (col, off, shrink) => {
        g.fillStyle = col;
        const r = ts * (0.42 - shrink);
        S.roundRect(g, px + (lf ? -1 : ts * (0.08 + shrink)), py - off + (up ? -1 : ts * (0.08 + shrink)),
          ts - (lf ? -1 : ts * (0.08 + shrink)) - (rt ? -1 : ts * (0.08 + shrink)),
          ts - (up ? -1 : ts * (0.08 + shrink)) - (dn ? -1 : ts * (0.04 + shrink)), r);
        g.fill();
      };
      blob(w.dark, 0, 0);
      blob(w.main, lift * 0.6, 0.02);
      if (w.kind === 'cloud') {
        for (let k = 0; k < 4; k++) {
          const a = k / 4 * TAU + h * 2;
          S.circle(g, cx + Math.cos(a) * ts * 0.2, cy - lift * 0.6 + Math.sin(a) * ts * 0.16, ts * 0.22, w.main);
        }
        S.circle(g, cx - ts * 0.1, cy - lift - ts * 0.08, ts * 0.16, w.light);
        S.circle(g, cx + ts * 0.12, cy - lift - ts * 0.02, ts * 0.12, w.light);
      } else {
        // Blätter-Kuppeln
        const n = 3;
        for (let k = 0; k < n; k++) {
          const ax = cx + (k - 1) * ts * 0.22 + (h - 0.5) * ts * 0.06;
          const ay = cy - lift * 0.8 - (k === 1 ? ts * 0.1 : 0);
          S.circle(g, ax, ay, ts * 0.2, w.main);
        }
        S.circle(g, cx - ts * 0.12, cy - lift - ts * 0.14, ts * 0.1, w.light);
        S.circle(g, cx + ts * 0.1, cy - lift - ts * 0.04, ts * 0.07, w.light);
      }
      // Deko
      if (w.kind === 'bush' && h2 < 0.45) {
        const col = w.deco[Math.floor(h * w.deco.length)];
        const fx = cx + (h2 - 0.2) * ts * 0.8, fy = cy - lift * 0.5 + (h - 0.5) * ts * 0.3, r = ts * 0.05;
        for (let p = 0; p < 5; p++) S.circle(g, fx + Math.cos(p * TAU / 5) * r * 1.2, fy + Math.sin(p * TAU / 5) * r * 1.2, r, col);
        S.circle(g, fx, fy, r * 0.7, '#fff6a8');
      } else if (w.kind === 'reed' && h2 < 0.6) {
        g.strokeStyle = '#3f7d5f'; g.lineWidth = Math.max(1, ts * 0.035); g.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
          const rx = cx + (k ? 0.14 : -0.1) * ts + (h - 0.5) * ts * 0.1;
          g.beginPath(); g.moveTo(rx, cy); g.lineTo(rx + ts * 0.03, cy - ts * 0.45); g.stroke();
          S.roundRect(g, rx - ts * 0.035 + ts * 0.03, cy - ts * 0.5, ts * 0.07, ts * 0.18, ts * 0.035); g.fillStyle = '#9b6b4a'; g.fill();
        }
      } else if (w.kind === 'snow') {
        if (h2 < 0.35) { S.circle(g, cx + (h - 0.5) * ts * 0.4, cy - lift * 0.4, ts * 0.045, w.deco[1]); S.circle(g, cx + (h - 0.5) * ts * 0.4 + ts * 0.07, cy - lift * 0.4 + ts * 0.02, ts * 0.04, w.deco[1]); }
        S.circle(g, cx + ts * 0.18, cy - lift * 1.2, ts * 0.03, '#ffffff');
      } else if (w.kind === 'tree' && h2 < 0.3) {
        // kleiner Pilz am Fuß
        const mx = cx + (h - 0.5) * ts * 0.5, my = py + ts * 0.82;
        g.fillStyle = w.deco[1]; g.fillRect(mx - ts * 0.025, my - ts * 0.06, ts * 0.05, ts * 0.08);
        g.beginPath(); g.ellipse(mx, my - ts * 0.06, ts * 0.08, ts * 0.06, 0, Math.PI, TAU); g.fillStyle = w.deco[0]; g.fill();
      } else if (w.kind === 'cloud' && h2 < 0.25) {
        S.starPath(g, cx + (h - 0.5) * ts * 0.5, cy - lift, ts * 0.07, ts * 0.035, 0); g.fillStyle = w.deco[0]; g.fill();
      }
    }

    draw(now) {
      const ctx = this.ctx, L = this.level;
      if (!L) return;
      this.update(now);
      const t = now / 1000;
      const ts = this.ts, dpr = this.dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!this.cache) this.buildCache();
      ctx.save();
      ctx.translate(this.ox, this.oy);
      ctx.drawImage(this.cache, 0, 0, this.cache.width / dpr, this.cache.height / dpr);

      const occ = E.buildOcc(L, this.state);
      // dynamische Kacheln
      for (let i = 0; i < L.n; i++) {
        const tt = L.terrain[i];
        const x = (i % L.w) * ts, y = ((i / L.w) | 0) * ts;
        if (tt === T.WATER && !this.bridges.has(i)) {
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, ts * 0.03); ctx.lineCap = 'round';
          const ph = t * 1.6 + S.hash(i, 5) * 6;
          for (let k = 0; k < 2; k++) {
            const yy = y + ts * (0.35 + k * 0.3);
            const xx = x + ts * (0.2 + 0.1 * Math.sin(ph + k));
            ctx.beginPath();
            ctx.moveTo(xx, yy);
            ctx.quadraticCurveTo(xx + ts * 0.1, yy - ts * 0.06, xx + ts * 0.2, yy);
            ctx.quadraticCurveTo(xx + ts * 0.3, yy + ts * 0.06, xx + ts * 0.4, yy);
            ctx.stroke();
          }
        } else if (tt === T.NEST) {
          S.drawNest(ctx, x + ts / 2, y + ts / 2, ts, { t, filled: occ[i] >= 10 && occ[i] < 1000 });
        } else if (tt === T.PLATE) {
          const pressed = occ[i] !== 0 && this.anims.length === 0 || (occ[i] !== 0 && this.plateSettled(i));
          S.drawPlate(ctx, x + ts / 2, y + ts / 2, ts, { pressed });
        }
      }
      // Tore (unter Figuren, die darin stehen)
      for (const i of L.gates) {
        const x = (i % L.w) * ts, y = ((i / L.w) | 0) * ts;
        const held = occ[i] !== 0 ? 1 : 0;
        S.drawGate(ctx, x + ts / 2, y + ts / 2, ts, { open: Math.max(this.gateOpen, held) });
      }

      // Figuren nach y sortiert
      const list = [];
      const e = this.ents;
      e.rocks.forEach(r => { if (r.alive) list.push({ y: r.y, f: () => this.drawRockEnt(r, t) }); });
      e.stars.forEach((s, k) => list.push({ y: s.y, f: () => this.drawStarEnt(s, t, now) }));
      if (e.nox) list.push({ y: e.nox.y, f: () => this.drawCatEnt(e.nox, t, true) });
      list.push({ y: e.luma.y + 0.01, f: () => this.drawCatEnt(e.luma, t, false) });
      list.sort((a, b) => a.y - b.y);
      for (const it of list) it.f();

      // Hinweis-Pfeil
      if (this.hintDir >= 0) this.drawHint(t);

      // Partikel
      for (const p of this.particles) this.drawParticle(p);
      ctx.restore();
    }

    plateSettled(i) {
      // Schalter erst "drücken", wenn das Objekt angekommen ist
      for (const a of this.anims) if (a.o.cell === i) return false;
      return true;
    }

    drawCatEnt(o, t, nox) {
      const ctx = this.ctx, ts = this.ts;
      const cx = (o.x + 0.5) * ts, cy = (o.y + 0.5) * ts - ts * 0.08;
      ctx.save();
      if (o.face < 0) { ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.translate(-cx, 0); }
      const look = [o.look[0] * o.face, o.look[1]];
      const blink = ((t + (nox ? 1.3 : 0)) % 3.8) > 3.66;
      const celebrate = this.celebrating && !nox;
      let yy = cy;
      if (this.celebrating) yy -= Math.abs(Math.sin((performance.now() - this.celebrating) / 180)) * ts * 0.18;
      S.drawCat(ctx, cx, yy, ts * 1.12, {
        t, look, blink, squash: o.squash, nox, glow: nox, happy: celebrate || o.happy > 0 && this.celebrating,
        fur: this.fur, hat: nox ? null : this.hat, neck: nox ? null : this.neck, phase: nox ? 2 : 0
      });
      ctx.restore();
    }

    drawStarEnt(s, t, now) {
      const ts = this.ts;
      let cx = (s.x + 0.5) * ts, cy = (s.y + 0.5) * ts - ts * 0.06;
      let alpha = 1;
      if (s.fly && now > s.fly) {
        const p = Math.min(1, (now - s.fly) / 1400);
        cy -= p * p * ts * 8;
        cx += Math.sin(p * 9) * ts * 0.2;
        alpha = 1 - Math.max(0, p - 0.7) / 0.3;
        if (Math.random() < 0.5) this.particles.push({ x: cx / ts, y: cy / ts + 0.3, vx: (Math.random() - 0.5) * 0.4, vy: 0.4, g: 0, life: 0.6, max: 0.6, kind: 'sparkle', rot: 0, vr: 3, size: 0.07 });
      }
      this.ctx.globalAlpha = alpha;
      const scared = !s.home && this.stuckStars && this.stuckStars.has(s.cell);
      S.drawStar(this.ctx, cx, cy, ts * 0.95, { t, home: s.home, phase: s.phase, scared });
      this.ctx.globalAlpha = 1;
    }

    drawRockEnt(r, t) {
      const ts = this.ts;
      const ctx = this.ctx;
      ctx.save();
      if (r.sink) { ctx.globalAlpha = 1 - r.sink; }
      S.drawRock(ctx, (r.x + 0.5) * ts, (r.y + 0.5) * ts + r.sink * ts * 0.3, ts * 0.9, {});
      ctx.restore();
    }

    drawHint(t) {
      const ctx = this.ctx, ts = this.ts, o = this.ents.luma;
      const d = E.DIRS[this.hintDir];
      const pulse = (Math.sin(t * 6) + 1) / 2;
      const cx = (o.x + 0.5 + d[0] * (0.75 + pulse * 0.12)) * ts;
      const cy = (o.y + 0.5 + d[1] * (0.75 + pulse * 0.12)) * ts;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.atan2(d[1], d[0]) + Math.PI / 2);
      ctx.globalAlpha = 0.85;
      // Pfötchen
      S.ellipse(ctx, 0, ts * 0.05, ts * 0.17, ts * 0.14, '#ff8fb3');
      for (let k = 0; k < 4; k++) S.circle(ctx, (k - 1.5) * ts * 0.1, -ts * 0.13 - (k === 1 || k === 2 ? ts * 0.04 : 0), ts * 0.06, '#ff8fb3');
      ctx.restore();
    }

    drawParticle(p) {
      const ctx = this.ctx, ts = this.ts;
      const a = Math.max(0, p.life / p.max);
      const x = p.x * ts, y = p.y * ts, s = p.size * ts;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(x, y); ctx.rotate(p.rot);
      if (p.kind === 'star' || p.kind === 'sparkle') { S.starPath(ctx, 0, 0, s, s * 0.45, 0); ctx.fillStyle = p.kind === 'star' ? '#ffd24d' : '#fff3a0'; ctx.fill(); }
      else if (p.kind === 'splash') { S.circle(ctx, 0, 0, s * 0.6, '#bfe7f5'); }
      else if (p.kind === 'puff') { S.circle(ctx, 0, 0, s * 0.8, 'rgba(255,255,255,0.9)'); }
      else if (p.kind === 'heart') {
        ctx.rotate(-p.rot);
        ctx.fillStyle = '#ff8fb3';
        ctx.beginPath();
        ctx.moveTo(0, s * 0.35);
        ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.4, -s, 0, -s * 0.45);
        ctx.bezierCurveTo(s * 0.4, -s, s, -s * 0.3, 0, s * 0.35);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  root.SPBoard = Board;
  root.SPThemes = THEMES;
})(typeof self !== 'undefined' ? self : this);
