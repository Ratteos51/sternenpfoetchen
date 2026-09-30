/*
 * Sternenpfötchen – App-Steuerung: Bildschirme, Eingabe, Fortschritt, Belohnungen, Story.
 */
(function () {
  'use strict';
  const E = window.SPEngine, S = window.SPSprites, A = window.SPAudio, D = window.SPData;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // ======================= Speicherstand =======================
  const SAVE_KEY = 'sternenpfoetchen.v1';
  const Save = {
    d: null,
    load() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { d = null; }
      this.d = Object.assign({
        levels: {}, seen: {}, hat: null, neck: null, fur: 'creme',
        settings: { music: true, sfx: true, dpad: null }, notified: {}
      }, d || {});
      this.d.settings = Object.assign({ music: true, sfx: true, dpad: null }, this.d.settings);
    },
    save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.d)); } catch (e) { /* privater Modus */ } },
    reset() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* egal */ } this.load(); }
  };

  // ======================= Hilfsfunktionen =======================
  const W = D.worlds;
  const lvlId = (wi, li) => (wi + 1) + '-' + (li + 1);
  const rec = (wi, li) => Save.d.levels[lvlId(wi, li)];
  const solved = (wi, li) => !!rec(wi, li);
  const worldSolved = wi => W[wi].levels.filter((_, li) => solved(wi, li)).length;
  const worldStars = wi => W[wi].levels.reduce((a, _, li) => a + (rec(wi, li) ? rec(wi, li).stars : 0), 0);
  const totalStars = () => W.reduce((a, _, wi) => a + worldStars(wi), 0);
  const maxStars = () => W.reduce((a, w) => a + w.levels.length * 3, 0);
  const rescued = () => W.reduce((a, w, wi) => a + w.levels.reduce((b, l, li) => b + (solved(wi, li) ? l._stars : 0), 0), 0);
  const perfectCount = () => Object.values(Save.d.levels).filter(r => r.stars === 3).length;
  const worldUnlocked = wi => wi === 0 || worldSolved(wi - 1) >= D.unlockNeed;
  const levelUnlocked = (wi, li) => worldUnlocked(wi) && li < worldSolved(wi) + 2;

  function starsFor(moves, par, hinted) {
    let s = 1;
    if (moves <= par + Math.max(4, Math.ceil(par * 0.4))) s = 2;
    if (moves <= par && !hinted) s = 3;
    return s;
  }
  const twoStarLimit = par => par + Math.max(4, Math.ceil(par * 0.4));

  // Level vorbereiten
  W.forEach(w => w.levels.forEach(l => {
    l._parsed = E.parse(l.map);
    l._stars = l._parsed.start.s.length;
  }));

  function starsHtml(n, of) {
    let h = '';
    for (let k = 0; k < (of || 3); k++) h += `<span class="st ${k < n ? 'on' : ''}">★</span>`;
    return h;
  }

  function toast(msg, ms) {
    const t = $('#toast');
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), ms || 2600);
  }

  // Animierte Mini-Canvas (Portraits, Vorschau)
  const liveCanvases = new Set();
  function liveCanvas(canvas, drawFn) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = canvas.getBoundingClientRect();
    const w = canvas.clientWidth || r.width || +canvas.getAttribute('width');
    const h = canvas.clientHeight || r.height || +canvas.getAttribute('height');
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const entry = { canvas, drawFn, w, h, dpr };
    liveCanvases.add(entry);
    return entry;
  }
  function drawLive(t) {
    for (const e of liveCanvases) {
      if (!e.canvas.isConnected || e.canvas.offsetParent === null) continue;
      const c = e.canvas.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, e.canvas.width, e.canvas.height);
      c.setTransform(e.dpr, 0, 0, e.dpr, 0, 0);
      e.drawFn(c, e.w, e.h, t);
    }
    for (const e of liveCanvases) if (!e.canvas.isConnected) liveCanvases.delete(e);
  }

  const catLook = () => ({ fur: Save.d.fur, hat: Save.d.hat, neck: Save.d.neck });

  // ======================= Sternenhimmel =======================
  const Sky = {
    stars: [],
    init() {
      this.c = $('#sky');
      let seed = 7;
      const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let k = 0; k < 260; k++) this.stars.push({ x: r(), y: r() * 0.85, s: 0.6 + r() * 1.6, p: r() * 6, big: r() < 0.12 });
      this.resize();
    },
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.dpr = dpr;
      this.c.width = innerWidth * dpr; this.c.height = innerHeight * dpr;
    },
    draw(t) {
      const c = this.c.getContext('2d'), w = this.c.width, h = this.c.height, dpr = this.dpr;
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#1f1a44'); g.addColorStop(0.55, '#3b2f6e'); g.addColorStop(1, '#7a5fa8');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const lit = Math.min(this.stars.length, 30 + rescued() * 2);
      for (let k = 0; k < this.stars.length; k++) {
        const s = this.stars[k];
        const on = k < lit;
        const tw = 0.55 + 0.45 * Math.sin(t * 1.3 + s.p);
        c.globalAlpha = on ? tw : 0.12;
        const x = s.x * w, y = s.y * h;
        if (on && s.big) {
          S.starPath(c, x, y, s.s * 3.2 * dpr, s.s * 1.3 * dpr, 0);
          c.fillStyle = '#fff3b0'; c.fill();
        } else {
          c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, s.s * dpr, 0, Math.PI * 2); c.fill();
        }
      }
      c.globalAlpha = 1;
      // Sternschnuppe
      const cyc = (t % 11) / 11;
      if (cyc < 0.08) {
        const p = cyc / 0.08;
        const x = w * (0.15 + p * 0.5), y = h * (0.1 + p * 0.18);
        const gr = c.createLinearGradient(x, y, x - 80 * dpr, y - 30 * dpr);
        gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        c.strokeStyle = gr; c.lineWidth = 2 * dpr; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 80 * dpr, y - 30 * dpr); c.stroke();
      }
      // Hügel am Horizont
      c.fillStyle = '#2d2458';
      c.beginPath(); c.moveTo(0, h);
      for (let x = 0; x <= w; x += 20 * dpr) c.lineTo(x, h - (40 + Math.sin(x / (140 * dpr)) * 18 + Math.sin(x / (55 * dpr)) * 6) * dpr);
      c.lineTo(w, h); c.fill();
    }
  };

  // ======================= Bildschirme =======================
  let current = 'title';
  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + id));
    current = id;
    document.body.dataset.screen = id;
    if (id === 'title') renderTitle();
    if (id === 'map') renderMap();
    if (id === 'book') renderBook();
    if (id === 'wardrobe') renderWardrobe();
  }

  // ----- Titel -----
  let titleArt = null;
  function renderTitle() {
    $('#title-stats').innerHTML = rescued()
      ? `✦ ${rescued()} Sternchen heimgebracht · ★ ${totalStars()}/${maxStars()}`
      : 'Hilf Luma, die Sternchen heimzubringen';
    $('#btn-play').textContent = Object.keys(Save.d.levels).length ? 'Weiterspielen' : 'Spielen';
    if (!titleArt) {
      titleArt = liveCanvas($('#title-art'), (c, w, h, t) => {
        const cx = w / 2, cy = h * 0.62;
        // Mondsichel
        const R = Math.min(w, h) * 0.34;
        drawCrescent(c, cx, cy + R * 0.2, R);
        S.drawCat(c, cx - R * 0.4, cy - R * 0.02 + Math.sin(t) * 2, R * 1.05, Object.assign({ t, sleepy: (t % 9) < 4, blink: (t % 3.7) > 3.55 }, catLook()));
        for (let k = 0; k < 3; k++) {
          const a = t * 0.6 + k * 2.1;
          S.drawStar(c, cx + Math.cos(a) * R * 1.25, cy - R * 0.6 + Math.sin(a) * R * 0.35, R * 0.38, { t, phase: k, home: true });
        }
      });
    }
  }

  // Mondsichel über eine eigene Leinwand (ausgestanzt)
  let moonCache = null;
  function drawCrescent(c, x, y, R) {
    const size = Math.ceil(R * 3);
    if (!moonCache || moonCache.R !== R) {
      const m = document.createElement('canvas');
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      m.width = m.height = size * dpr;
      const g = m.getContext('2d');
      g.scale(dpr, dpr);
      const o = size / 2;
      const glow = g.createRadialGradient(o, o, R * 0.9, o, o, R * 1.45);
      glow.addColorStop(0, 'rgba(255,236,160,0.45)'); glow.addColorStop(1, 'rgba(255,236,160,0)');
      g.fillStyle = glow; g.fillRect(0, 0, size, size);
      const gr = g.createRadialGradient(o - R * 0.3, o - R * 0.3, R * 0.1, o, o, R);
      gr.addColorStop(0, '#fffbe0'); gr.addColorStop(1, '#ffe9a0');
      g.fillStyle = gr; g.beginPath(); g.arc(o, o, R, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(240,210,130,0.55)';
      [[-0.45, 0.2, 0.12], [-0.2, 0.62, 0.09], [-0.62, -0.25, 0.08]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(o + dx * R, o + dy * R, r * R, 0, Math.PI * 2); g.fill(); });
      g.globalCompositeOperation = 'destination-out';
      const cut = g.createRadialGradient(o + R * 0.42, o - R * 0.32, R * 0.86, o + R * 0.42, o - R * 0.32, R * 1.3);
      cut.addColorStop(0, 'rgba(0,0,0,1)'); cut.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = cut; g.beginPath(); g.arc(o + R * 0.42, o - R * 0.32, R * 1.3, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#000'; g.beginPath(); g.arc(o + R * 0.42, o - R * 0.32, R * 0.86, 0, Math.PI * 2); g.fill();
      moonCache = { m, R, size };
    }
    c.drawImage(moonCache.m, x - size / 2, y - size / 2, size, size);
  }

  // ----- Weltkarte -----
  function renderMap() {
    $('#map-stars').innerHTML = `★ ${totalStars()}/${maxStars()}`;
    const list = $('#world-list');
    list.innerHTML = '';
    W.forEach((w, wi) => {
      const open = worldUnlocked(wi);
      const card = document.createElement('button');
      card.className = 'world-card' + (open ? '' : ' locked');
      card.style.setProperty('--wc1', w.color1);
      card.style.setProperty('--wc2', w.color2);
      const done = worldSolved(wi);
      card.innerHTML = `
        <canvas class="wc-art" width="84" height="84"></canvas>
        <div class="wc-text">
          <div class="wc-name">${wi + 1}. ${w.name}</div>
          <div class="wc-sub">${w.tagline}</div>
          <div class="wc-prog">${open ? `${done}/${w.levels.length} gelöst · <span class="gold">★ ${worldStars(wi)}/${w.levels.length * 3}</span>` : `🔒 Löse ${D.unlockNeed} Level in „${W[wi - 1].name}“`}</div>
        </div>`;
      list.appendChild(card);
      const who = w.friend;
      liveCanvas(card.querySelector('.wc-art'), (c, cw, ch, t) => {
        const g = c.createRadialGradient(cw / 2, ch / 2, 4, cw / 2, ch / 2, cw / 2);
        g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0.2)');
        c.fillStyle = g; c.beginPath(); c.arc(cw / 2, ch / 2, cw / 2 - 2, 0, Math.PI * 2); c.fill();
        c.globalAlpha = open ? 1 : 0.35;
        S.drawPortrait(c, who, cw / 2, ch / 2 + 4, cw * 0.62, t, catLook());
        c.globalAlpha = 1;
      });
      card.addEventListener('click', () => {
        A.play('tap');
        if (!open) { toast(`Löse zuerst ${D.unlockNeed} Level in „${W[wi - 1].name}“ 🌙`); return; }
        openWorld(wi);
      });
    });
  }

  // ----- Welt / Levelauswahl -----
  let curWorld = 0;
  function openWorld(wi) {
    curWorld = wi;
    const w = W[wi];
    const introKey = 'w' + wi + '-intro';
    const go = () => { renderWorld(); show('world'); };
    if (!Save.d.seen[introKey]) {
      Save.d.seen[introKey] = true; Save.save();
      Story.play(w.intro, go, w.theme);
    } else go();
  }

  function drawConstellation(c, cw, ch, t, wi, litCount, litSet, small) {
    const w = W[wi], con = w.constellation;
    const pad = small ? 10 : 22;
    const P = con.pts.map(([x, y]) => [pad + x * (cw - pad * 2), pad + y * (ch - pad * 2)]);
    const all = litCount >= con.pts.length;
    c.lineCap = 'round';
    for (const [a, b] of con.edges) {
      const on = litSet(a) && litSet(b);
      c.strokeStyle = on ? (all ? 'rgba(255,230,140,0.9)' : 'rgba(255,230,140,0.55)') : 'rgba(255,255,255,0.12)';
      c.lineWidth = on ? (small ? 1.5 : 2.5) : 1;
      c.setLineDash(on ? [] : [3, 5]);
      c.beginPath(); c.moveTo(P[a][0], P[a][1]); c.lineTo(P[b][0], P[b][1]); c.stroke();
    }
    c.setLineDash([]);
    P.forEach(([x, y], k) => {
      const on = litSet(k);
      if (on) {
        const pulse = 1 + Math.sin(t * 2 + k) * 0.12;
        const g = c.createRadialGradient(x, y, 0, x, y, (small ? 10 : 20) * pulse);
        g.addColorStop(0, 'rgba(255,236,150,0.8)'); g.addColorStop(1, 'rgba(255,236,150,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, (small ? 10 : 20) * pulse, 0, Math.PI * 2); c.fill();
        S.starPath(c, x, y, (small ? 4.5 : 8) * pulse, (small ? 2 : 3.5) * pulse, 0);
        c.fillStyle = '#fff3b0'; c.fill();
      } else {
        c.fillStyle = 'rgba(255,255,255,0.25)';
        c.beginPath(); c.arc(x, y, small ? 2 : 3, 0, Math.PI * 2); c.fill();
      }
    });
  }

  function renderWorld() {
    const wi = curWorld, w = W[wi];
    $('#world-title').textContent = w.name;
    $('#world-stars').innerHTML = `★ ${worldStars(wi)}/${w.levels.length * 3}`;
    const done = worldSolved(wi);
    $('#world-con-name').textContent = done >= w.levels.length ? `Sternbild: ${w.constellation.name}` : `Sternbild: ??? (${done}/${w.levels.length})`;
    const cc = $('#world-con');
    liveCanvas(cc, (c, cw, ch, t) => drawConstellation(c, cw, ch, t, wi, done, k => solved(wi, k), false));
    const grid = $('#level-grid');
    grid.innerHTML = '';
    w.levels.forEach((l, li) => {
      const open = levelUnlocked(wi, li);
      const r = rec(wi, li);
      const b = document.createElement('button');
      b.className = 'lvl' + (open ? '' : ' locked') + (r ? ' done' : '') + (r && r.stars === 3 ? ' perfect' : '');
      b.innerHTML = `<div class="lvl-num">${open ? li + 1 : '🔒'}</div><div class="lvl-name">${open ? l.name : '???'}</div><div class="lvl-stars">${starsHtml(r ? r.stars : 0)}</div>`;
      b.addEventListener('click', () => {
        A.play('tap');
        if (!open) { toast('Löse zuerst ein Level davor 🐾'); return; }
        Game.start(wi, li);
      });
      grid.appendChild(b);
    });
  }

  // ----- Sternbuch -----
  function renderBook() {
    const box = $('#book-cons');
    box.innerHTML = '';
    W.forEach((w, wi) => {
      const done = worldSolved(wi);
      const complete = done >= w.levels.length;
      const d = document.createElement('div');
      d.className = 'book-con' + (complete ? ' complete' : '');
      d.innerHTML = `<canvas width="140" height="140"></canvas><div class="bc-name">${complete ? w.constellation.name : '???'}</div><div class="bc-sub">${done}/${w.levels.length} · ★ ${worldStars(wi)}</div>`;
      box.appendChild(d);
      liveCanvas(d.querySelector('canvas'), (c, cw, ch, t) => drawConstellation(c, cw, ch, t, wi, done, k => solved(wi, k), true));
    });
    $('#book-stats').innerHTML = `
      <div><b>${rescued()}</b><span>Sternchen heimgebracht</span></div>
      <div><b>${totalStars()}</b><span>Sterne gesammelt</span></div>
      <div><b>${perfectCount()}</b><span>perfekte Level</span></div>`;
    const fr = $('#book-friends');
    fr.innerHTML = '';
    const friends = [['luma', 'Luma', true]].concat(W.map((w, wi) => [w.friend, D.speakers[w.friend].name, !!Save.d.seen['w' + wi + '-intro']]));
    friends.push(['mond', 'Mama Mond', true]);
    for (const [who, name, met] of friends) {
      const d = document.createElement('div');
      d.className = 'friend' + (met ? '' : ' unmet');
      d.innerHTML = `<canvas width="64" height="64"></canvas><span>${met ? name : '???'}</span>`;
      fr.appendChild(d);
      liveCanvas(d.querySelector('canvas'), (c, cw, ch, t) => {
        if (!met) c.filter = 'brightness(0) opacity(0.35)';
        S.drawPortrait(c, who, cw / 2, ch / 2 + 3, cw * 0.62, t, catLook());
        c.filter = 'none';
      });
    }
  }

  // ----- Garderobe -----
  let wardTab = 'hat';
  function itemUnlocked(it) {
    if (it.stars != null) return totalStars() >= it.stars;
    if (it.world != null) return worldSolved(it.world) >= W[it.world].levels.length;
    return true;
  }
  function renderWardrobe() {
    if (!renderWardrobe._pv) {
      renderWardrobe._pv = liveCanvas($('#ward-preview'), (c, cw, ch, t) => {
        const g = c.createRadialGradient(cw / 2, ch * 0.6, 10, cw / 2, ch * 0.6, cw * 0.55);
        g.addColorStop(0, 'rgba(255,240,200,0.9)'); g.addColorStop(1, 'rgba(255,240,200,0)');
        c.fillStyle = g; c.fillRect(0, 0, cw, ch);
        S.drawCat(c, cw / 2, ch * 0.52, Math.min(cw, ch) * 0.62, Object.assign({ t, blink: (t % 3.7) > 3.55, look: [Math.sin(t * 0.7) * 0.8, 0.2] }, catLook()));
      });
    }
    $$('.ward-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === wardTab));
    $('#ward-stars').innerHTML = `★ ${totalStars()}`;
    const grid = $('#ward-grid');
    grid.innerHTML = '';
    const items = D.wardrobe[wardTab];
    const key = wardTab === 'hat' ? 'hat' : wardTab === 'neck' ? 'neck' : 'fur';
    for (const it of items) {
      const open = itemUnlocked(it);
      const sel = (Save.d[key] || null) === (it.id || null) || (key === 'fur' && Save.d.fur === it.id);
      const b = document.createElement('button');
      b.className = 'ward-item' + (open ? '' : ' locked') + (sel ? ' sel' : '');
      b.innerHTML = `<canvas width="72" height="72"></canvas><span>${it.name}</span>${open ? '' : `<em>${it.stars != null ? '★ ' + it.stars : 'Welt ' + (it.world + 1)}</em>`}`;
      grid.appendChild(b);
      liveCanvas(b.querySelector('canvas'), (c, cw, ch, t) => {
        const look = catLook();
        look[key] = it.id;
        if (!open) c.globalAlpha = 0.35;
        S.drawCat(c, cw / 2, ch * 0.56, cw * 0.72, Object.assign({ t: 1.2 }, look));
        c.globalAlpha = 1;
      });
      b.addEventListener('click', () => {
        if (!open) { A.play('bump'); toast(it.stars != null ? `Sammle ${it.stars} ★, um „${it.name}“ freizuschalten` : `Schließe Welt ${it.world + 1} ab für „${it.name}“`); return; }
        A.play('tap');
        Save.d[key] = it.id; Save.save();
        renderWardrobe();
      });
    }
  }

  function newUnlocks() {
    const out = [];
    for (const tab of ['hat', 'neck', 'fur']) for (const it of D.wardrobe[tab]) {
      if (!it.id || (it.stars == null && it.world == null) || Save.d.notified[it.id]) continue;
      if (itemUnlocked(it)) { Save.d.notified[it.id] = true; out.push(it); }
    }
    if (out.length) Save.save();
    return out;
  }

  // ======================= Story / Dialoge =======================
  const Story = {
    queue: [], done: null, typing: null, full: '', entry: null,
    play(lines, done, theme) {
      if (!lines || !lines.length) { done && done(); return; }
      this.queue = lines.slice();
      this.done = done;
      $('#story').classList.add('show');
      $('#story').dataset.theme = theme || '';
      this.next();
    },
    next() {
      if (this.typing) { this.finishTyping(); return; }
      const line = this.queue.shift();
      if (!line) { this.close(); return; }
      A.play('page');
      const who = line[0], text = line[1];
      const sp = D.speakers[who] || { name: '' };
      $('#story-name').textContent = sp.name;
      $('#story-box').classList.toggle('narrator', !sp.name);
      const pc = $('#story-portrait');
      pc.style.display = sp.name ? '' : 'none';
      if (this.entry) liveCanvases.delete(this.entry);
      if (sp.name) this.entry = liveCanvas(pc, (c, cw, ch, t) => S.drawPortrait(c, who, cw / 2, ch / 2 + 6, cw * 0.62, t, catLook()));
      this.full = text;
      const el = $('#story-text');
      el.textContent = '';
      let i = 0;
      const tick = () => {
        i += 2;
        el.textContent = text.slice(0, i);
        if (i < text.length) this.typing = setTimeout(tick, 22);
        else this.typing = null;
      };
      tick();
    },
    finishTyping() { clearTimeout(this.typing); this.typing = null; $('#story-text').textContent = this.full; },
    close() {
      $('#story').classList.remove('show');
      const d = this.done; this.done = null; this.queue = [];
      if (d) d();
    },
    active() { return $('#story').classList.contains('show'); }
  };

  // ======================= Spiel =======================
  const board = new window.SPBoard($('#board'));
  board.onLand = kind => A.play(kind);

  const Game = {
    wi: 0, li: 0, level: null, hist: [], state: null, won: false, hinted: false, queue: [], stuckShown: false, thinking: false,
    start(wi, li) {
      this.wi = wi; this.li = li;
      const def = W[wi].levels[li];
      this.def = def;
      this.level = def._parsed;
      this.state = this.level.start;
      this.hist = [];
      this.won = false; this.hinted = false; this.queue = []; this.stuckShown = false; this.thinking = false;
      board.fur = Save.d.fur; board.hat = Save.d.hat; board.neck = Save.d.neck;
      board.stuckStars = null;
      show('game');
      $('#scr-game').dataset.theme = W[wi].theme;
      $('#game-title').innerHTML = `<small>${W[wi].name} ${li + 1}/${W[wi].levels.length}</small>${def.name}`;
      board.load(this.level, this.state, W[wi].theme);
      this.updateHud();
      $('#win').classList.remove('show');
      const tipKey = 'tip-' + lvlId(wi, li);
      if (def.tip && !Save.d.seen[tipKey]) {
        Save.d.seen[tipKey] = true; Save.save();
        setTimeout(() => Story.play(def.tip, null, W[wi].theme), 350);
      }
    },
    updateHud() {
      const m = this.hist.length, par = this.def.par;
      $('#hud-moves').textContent = m;
      const pot = starsFor(Math.max(m, 0), par, this.hinted);
      $('#hud-goal').innerHTML = `<div class="goal-st">${starsHtml(pot)}</div><small>${this.hinted ? `★★ ≤ ${twoStarLimit(par)}` : `★★★ ≤ ${par}`}</small>`;
      $('#btn-undo').disabled = !m;
    },
    move(dir) {
      if (this.won || Story.active() || this.thinking) return;
      // Eingaben während einer Animation der Reihe nach puffern
      if (board.busy() || this.queue.length) { if (this.queue.length < 10) this.queue.push(dir); return; }
      this.doMove(dir);
    },
    doMove(dir) {
      board.hintDir = -1;
      const r = E.step(this.level, this.state, dir, true);
      if (!r.changed) { board.apply(r.events, this.state); A.play('bump'); vibrate(8); return; }
      this.hist.push(this.state);
      const beforeOpen = board.gateTarget;
      this.state = r.state;
      board.apply(r.events, r.state);
      let pushed = false, slid = false;
      for (const e of r.events) {
        if (e.k === 'move' && e.pushed) pushed = true;
        if ((e.k === 'move' || e.k === 'push') && e.path && e.path.length > 2) slid = true;
      }
      A.play(pushed ? 'push' : 'step');
      if (slid) A.play('slide');
      if (board.gateTarget !== beforeOpen) setTimeout(() => A.play('gate'), 90);
      this.updateHud();
      if (E.isWon(this.level, this.state)) this.win();
      else this.checkStuck();
    },
    checkStuck() {
      const L = this.level, st = this.state;
      const wallish = i => i < 0 || L.terrain[i] === E.T.WALL || L.terrain[i] === E.T.VOID;
      const stuck = new Set();
      for (const p of st.s) {
        if (L.terrain[p] === E.T.NEST) continue;
        const up = wallish(E.neighbor(L, p, 0)), dn = wallish(E.neighbor(L, p, 2));
        const lf = wallish(E.neighbor(L, p, 3)), rt = wallish(E.neighbor(L, p, 1));
        if ((up || dn) && (lf || rt)) stuck.add(p);
      }
      board.stuckStars = stuck.size ? stuck : null;
      if (stuck.size && !this.stuckShown) {
        this.stuckShown = true;
        A.play('stuck');
        toast('Oh je, ein Sternchen steckt in der Ecke fest! Tippe auf <b>↶</b>, um zurückzugehen.', 3600);
      }
      if (!stuck.size) this.stuckShown = false;
    },
    undo() {
      if (this.won || !this.hist.length || this.thinking) return;
      this.queue = [];
      this.state = this.hist.pop();
      board.snap(this.state);
      board.hintDir = -1;
      A.play('undo');
      this.updateHud();
      this.checkStuck();
    },
    restart() {
      if (this.won || this.thinking) return;
      if (!this.hist.length) return;
      this.queue = [];
      this.hist = [];
      this.state = this.level.start;
      board.load(this.level, this.state, W[this.wi].theme);
      board.stuckStars = null;
      A.play('undo');
      this.updateHud();
    },
    hint() {
      if (this.won || this.thinking) return;
      if (!this.hinted && !Save.d.seen.hintInfo) {
        Save.d.seen.hintInfo = true; Save.save();
        toast('Tipps sind immer erlaubt 💛 – mit Tipp gibt es in diesem Versuch höchstens ★★.', 4200);
      }
      this.thinking = true;
      $('#btn-hint').classList.add('busy');
      const it = E.solveIter(this.level, this.state, { maxStates: 600000, chunk: 2500 });
      const run = () => {
        let r;
        const t0 = performance.now();
        do { r = it.next(); } while (!r.done && performance.now() - t0 < 30);
        if (!r.done) { setTimeout(run, 0); return; }
        this.thinking = false;
        $('#btn-hint').classList.remove('busy');
        const res = r.value;
        if (res.solved && res.firstMove >= 0) {
          this.hinted = true;
          board.hintDir = res.firstMove;
          A.play('hint');
          this.updateHud();
        } else if (res.aborted) {
          toast('Hmm, das ist zu knifflig für einen schnellen Tipp. Vielleicht ein paar Schritte zurück?');
        } else {
          A.play('stuck');
          toast('Von hier aus geht es leider nicht mehr weiter. Mach ein paar Züge rückgängig ↶', 3600);
        }
      };
      setTimeout(run, 30);
    },
    win() {
      this.won = true;
      this.queue = [];
      const moves = this.hist.length, par = this.def.par;
      const stars = starsFor(moves, par, this.hinted);
      const id = lvlId(this.wi, this.li);
      const prev = Save.d.levels[id];
      const firstTime = !prev;
      const before = totalStars();
      const worldWasDone = worldSolved(this.wi) >= W[this.wi].levels.length;
      const nextWorldWasOpen = this.wi + 1 < W.length && worldUnlocked(this.wi + 1);
      Save.d.levels[id] = {
        stars: Math.max(stars, prev ? prev.stars : 0),
        best: Math.min(moves, prev ? prev.best : Infinity)
      };
      Save.save();
      const gained = totalStars() - before;
      const unlocks = newUnlocks();
      const worldNowDone = !worldWasDone && worldSolved(this.wi) >= W[this.wi].levels.length;
      const nextWorldNowOpen = !nextWorldWasOpen && this.wi + 1 < W.length && worldUnlocked(this.wi + 1);

      setTimeout(() => {
        board.celebrate();
        A.play('win');
        vibrate([10, 40, 10]);
      }, 260);
      setTimeout(() => this.showWin({ moves, par, stars, prev, gained, unlocks, worldNowDone, nextWorldNowOpen, firstTime }), 1500);
    },
    showWin(o) {
      const w = $('#win');
      const msgs = ['Geschafft!', 'Wunderbar!', 'Juhu!', 'Toll gemacht!', 'Sternchen-stark!', 'Miau-gnifique!'];
      $('#win-title').textContent = o.stars === 3 ? 'Perfekt!' : msgs[Math.floor(Math.random() * msgs.length)];
      $('#win-stars').innerHTML = [0, 1, 2].map(k => `<span class="big-st" data-k="${k}">★</span>`).join('');
      const perfectTxt = o.stars === 3 ? 'Kürzester Weg gefunden! 🌟' : (this.hinted ? `${o.moves} Züge – mit Tipp gelöst` : `${o.moves} Züge – schaffst du es in ${o.par}?`);
      $('#win-info').innerHTML = perfectTxt + (o.prev && o.prev.best < o.moves ? `<br><small>Bestleistung: ${o.prev.best} Züge</small>` : '');
      const extra = [];
      if (o.gained > 0 && !o.firstTime) extra.push(`+${o.gained} ★ dazugewonnen`);
      for (const it of o.unlocks) extra.push(`🎀 Neu in der Garderobe: <b>${it.name}</b>`);
      if (o.nextWorldNowOpen) extra.push(`🗺️ Neue Welt entdeckt: <b>${W[this.wi + 1].name}</b>`);
      $('#win-extra').innerHTML = extra.map(x => `<div>${x}</div>`).join('');
      const last = this.li + 1 >= W[this.wi].levels.length;
      $('#btn-next').textContent = last ? (this.wi + 1 < W.length ? 'Weiter' : 'Zum Finale') : 'Nächstes Level';
      w.classList.add('show');
      $$('#win-stars .big-st').forEach((el, k) => {
        setTimeout(() => { if (k < o.stars) { el.classList.add('on'); A.play('star', k); } }, 350 + k * 330);
      });
      if (o.unlocks.length || o.nextWorldNowOpen) setTimeout(() => A.play('unlock'), 1400);
      this.pendingOutro = o.worldNowDone;
    },
    next() {
      $('#win').classList.remove('show');
      const wi = this.wi, li = this.li;
      const after = () => {
        if (li + 1 < W[wi].levels.length && levelUnlocked(wi, li + 1)) this.start(wi, li + 1);
        else if (li + 1 >= W[wi].levels.length && wi + 1 < W.length && worldUnlocked(wi + 1)) { show('map'); openWorld(wi + 1); }
        else { renderWorld(); show('world'); }
      };
      if (this.pendingOutro) {
        this.pendingOutro = false;
        const lines = W[wi].outro.slice();
        const finale = wi === W.length - 1;
        Story.play(lines, () => {
          if (finale) Story.play(D.finale, () => { show('title'); }, 'wolken');
          else after();
        }, W[wi].theme);
      } else after();
    }
  };

  function vibrate(p) { try { if (navigator.vibrate && Save.d.settings.sfx) navigator.vibrate(p); } catch (e) { /* egal */ } }

  // ======================= Eingabe =======================
  const KEYS = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 };
  window.addEventListener('keydown', e => {
    A.unlock();
    if (Story.active()) {
      if (['Space', 'Enter', 'ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); Story.next(); }
      if (e.code === 'Escape') Story.close();
      return;
    }
    if ($('#win').classList.contains('show')) {
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); Game.next(); }
      if (e.code === 'KeyR') { $('#win').classList.remove('show'); Game.start(Game.wi, Game.li); }
      return;
    }
    if ($('#settings').classList.contains('show')) { if (e.code === 'Escape') closeSettings(); return; }
    if (current !== 'game') { if (e.code === 'Escape') back(); return; }
    if (e.code in KEYS) { e.preventDefault(); Game.move(KEYS[e.code]); return; }
    if (e.code === 'KeyZ' || e.code === 'Backspace' || e.code === 'KeyU') { e.preventDefault(); Game.undo(); }
    else if (e.code === 'KeyR') Game.restart();
    else if (e.code === 'KeyH') Game.hint();
    else if (e.code === 'Escape') back();
  });

  // Wischen auf dem Spielfeld
  (function () {
    const el = $('#board-wrap');
    let sx = 0, sy = 0, active = false, moved = false, pid = null;
    el.addEventListener('pointerdown', e => {
      A.unlock();
      active = true; moved = false; sx = e.clientX; sy = e.clientY; pid = e.pointerId;
    });
    el.addEventListener('pointermove', e => {
      if (!active || e.pointerId !== pid) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      const th = 26;
      if (Math.abs(dx) > th || Math.abs(dy) > th) {
        const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
        Game.move(dir);
        moved = true;
        // weiterwischen erlaubt mehrere Schritte
        sx = e.clientX; sy = e.clientY;
      }
    });
    const end = e => {
      if (!active) return;
      active = false;
      if (!moved && e.type === 'pointerup') {
        // Tippen: Richtung relativ zu Luma
        const r = el.getBoundingClientRect();
        const ts = board.ts, L = board.ents && board.ents.luma;
        if (!L) return;
        const lx = r.left + board.ox + (L.x + 0.5) * ts, ly = r.top + board.oy + (L.y + 0.5) * ts;
        const dx = e.clientX - lx, dy = e.clientY - ly;
        if (Math.abs(dx) < ts * 0.5 && Math.abs(dy) < ts * 0.5) return;
        Game.move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  })();

  // Steuerkreuz mit Dauerfeuer
  $$('#dpad button').forEach(b => {
    let rep = null;
    const dir = +b.dataset.dir;
    const stop = () => { clearTimeout(rep); clearInterval(rep); rep = null; };
    b.addEventListener('pointerdown', e => {
      e.preventDefault(); A.unlock();
      Game.move(dir);
      stop();
      rep = setTimeout(() => { rep = setInterval(() => Game.move(dir), 170); }, 330);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
  });

  // ======================= Buttons =======================
  function back() {
    A.play('tap');
    if (current === 'game') { renderWorld(); show('world'); }
    else if (current === 'world') show('map');
    else if (current === 'map' || current === 'book' || current === 'wardrobe') show('title');
  }
  $$('[data-back]').forEach(b => b.addEventListener('click', back));

  $('#btn-play').addEventListener('click', () => {
    A.unlock(); A.play('tap');
    if (!Save.d.seen.prolog) {
      Save.d.seen.prolog = true; Save.save();
      Story.play(D.prolog, () => { show('map'); openWorld(0); }, 'wolken');
    } else show('map');
  });
  $('#btn-wardrobe').addEventListener('click', () => { A.unlock(); A.play('tap'); show('wardrobe'); });
  $('#btn-book').addEventListener('click', () => { A.unlock(); A.play('tap'); show('book'); });
  $$('.ward-tab').forEach(b => b.addEventListener('click', () => { A.play('tap'); wardTab = b.dataset.tab; renderWardrobe(); }));

  $('#btn-undo').addEventListener('click', () => Game.undo());
  $('#btn-restart').addEventListener('click', () => Game.restart());
  $('#btn-hint').addEventListener('click', () => Game.hint());
  $('#btn-next').addEventListener('click', () => { A.play('tap'); Game.next(); });
  $('#btn-replay').addEventListener('click', () => { A.play('tap'); $('#win').classList.remove('show'); Game.start(Game.wi, Game.li); });
  $('#btn-tomap').addEventListener('click', () => {
    A.play('tap'); $('#win').classList.remove('show');
    if (Game.pendingOutro) { Game.next(); return; }
    renderWorld(); show('world');
  });
  $('#story').addEventListener('click', e => { if (e.target.id === 'story-skip') { Story.close(); return; } Story.next(); });

  // Einstellungen
  function syncSettings() {
    const s = Save.d.settings;
    $('#set-music').checked = s.music; $('#set-sfx').checked = s.sfx;
    const dp = s.dpad == null ? matchMedia('(pointer: coarse)').matches : s.dpad;
    $('#set-dpad').checked = dp;
    document.body.classList.toggle('dpad', dp);
    A.setMusic(s.music); A.setSfx(s.sfx);
  }
  function openSettings() { A.play('tap'); syncSettings(); $('#settings').classList.add('show'); }
  function closeSettings() { $('#settings').classList.remove('show'); board.resize(); }
  $$('.btn-settings').forEach(b => b.addEventListener('click', openSettings));
  $('#settings-close').addEventListener('click', () => { A.play('tap'); closeSettings(); });
  $('#settings').addEventListener('click', e => { if (e.target.id === 'settings') closeSettings(); });
  $('#set-music').addEventListener('change', e => { Save.d.settings.music = e.target.checked; Save.save(); A.unlock(); syncSettings(); });
  $('#set-sfx').addEventListener('change', e => { Save.d.settings.sfx = e.target.checked; Save.save(); syncSettings(); });
  $('#set-dpad').addEventListener('change', e => { Save.d.settings.dpad = e.target.checked; Save.save(); syncSettings(); board.resize(); });
  $('#set-reset').addEventListener('click', () => {
    if (confirm('Wirklich den ganzen Fortschritt löschen? Alle Sterne und Freischaltungen gehen verloren.')) {
      Save.reset(); syncSettings(); closeSettings(); show('title'); toast('Alles auf Anfang 🌙');
    }
  });
  $('#set-story').addEventListener('click', () => { closeSettings(); Story.play(D.prolog, null, 'wolken'); });

  // ======================= Hauptschleife =======================
  function loop(now) {
    const t = now / 1000;
    if (current !== 'game') Sky.draw(t);
    if (current === 'game') {
      // Staut sich die Eingabe, Animationen abkürzen statt Züge zu verlieren
      if (Game.queue.length >= 2 && board.busy()) board.finishAnims();
      if (!board.busy() && Game.queue.length && !Game.won && !Story.active()) Game.doMove(Game.queue.shift());
      board.draw(now);
    }
    drawLive(t);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', () => { Sky.resize(); board.resize(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) A.suspend(); else A.resume(); });

  // ======================= Start =======================
  Save.load();
  Sky.init();
  syncSettings();
  show('title');
  requestAnimationFrame(loop);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline-Modus nicht verfügbar */ });
  }

  // für Tests
  window.SP = { Game, Save, show, Story, board };
})();
