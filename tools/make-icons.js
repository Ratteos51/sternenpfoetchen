#!/usr/bin/env node
/*
 * Rendert die App-Icons aus den Spiel-Sprites (braucht Playwright + Chromium).
 * Aufruf: node tools/make-icons.js
 */
'use strict';
const path = require('path');
const fs = require('fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.join(__dirname, '..');
const sprites = fs.readFileSync(path.join(root, 'js', 'sprites.js'), 'utf8');

const html = (size, mask) => `<!doctype html><html><body style="margin:0;background:transparent">
<canvas id="c" width="${size}" height="${size}"></canvas>
<script>${sprites}</script>
<script>
  const c = document.getElementById('c'), g = c.getContext('2d'), S = SPSprites;
  const s = ${size}, maskable = ${!!mask};
  const bg = g.createLinearGradient(0, 0, 0, s);
  bg.addColorStop(0, '#2b2350'); bg.addColorStop(1, '#6b52a3');
  g.fillStyle = bg;
  if (maskable) g.fillRect(0, 0, s, s);
  else { S.roundRect(g, 0, 0, s, s, s * 0.22); g.fill(); }
  const k = maskable ? 0.78 : 1;
  g.translate(s / 2, s / 2); g.scale(k, k); g.translate(-s / 2, -s / 2);
  // kleine Sterne
  [[0.18,0.2,0.03],[0.82,0.16,0.025],[0.12,0.62,0.02],[0.88,0.55,0.03],[0.7,0.86,0.02]].forEach(([x,y,r]) => {
    S.starPath(g, x*s, y*s, r*s, r*s*0.45, 0); g.fillStyle = '#fff3b0'; g.fill();
  });
  // Mond
  const m = document.createElement('canvas'); m.width = m.height = s; const mg = m.getContext('2d');
  mg.fillStyle = '#ffeaa8'; mg.beginPath(); mg.arc(s*0.5, s*0.58, s*0.34, 0, Math.PI*2); mg.fill();
  mg.globalCompositeOperation = 'destination-out';
  mg.beginPath(); mg.arc(s*0.66, s*0.44, s*0.3, 0, Math.PI*2); mg.fill();
  g.drawImage(m, 0, 0);
  S.drawCat(g, s*0.42, s*0.47, s*0.62, { t: 1.2, fur: 'creme' });
  S.drawStar(g, s*0.76, s*0.3, s*0.26, { t: 0.4, home: true });
</script></body></html>`;

(async () => {
  const b = await chromium.launch();
  const out = path.join(root, 'icons');
  fs.mkdirSync(out, { recursive: true });
  for (const [name, size, mask] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-180.png', 180], ['icon-maskable-512.png', 512, true]]) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    await p.setContent(html(size, mask));
    await p.waitForTimeout(100);
    await p.locator('#c').screenshot({ path: path.join(out, name), omitBackground: true });
    await p.close();
    console.log('✓', name);
  }
  await b.close();
})();
