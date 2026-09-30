/*
 * Sternenpfötchen – prozedural gezeichnete Figuren & Kacheln.
 * Alle Funktionen zeichnen um einen Mittelpunkt (cx, cy) mit Kachelgröße s.
 */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;

  function hash(i, salt) {
    let h = (i * 374761393 + (salt || 0) * 668265263) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function ellipse(ctx, x, y, rx, ry, fill) {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  }
  function circle(ctx, x, y, r, fill) { ellipse(ctx, x, y, r, r, fill); }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function starPath(ctx, cx, cy, R, r, rot) {
    // weicher 5-Zack-Stern
    ctx.beginPath();
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const a = rot - Math.PI / 2 + k * Math.PI / 5;
      const rad = k % 2 ? r : R;
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
    for (let k = 0; k < 10; k++) {
      const p = pts[k], q = pts[(k + 1) % 10];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      if (k === 0) ctx.moveTo(mx, my);
      else ctx.quadraticCurveTo(p[0], p[1], mx, my);
    }
    const p = pts[0], q = pts[1];
    ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    ctx.closePath();
  }

  // ---------------- Fellfarben & Accessoires ----------------
  const FURS = {
    creme:   { name: 'Vanille',     body: '#fff4e2', shade: '#f3dcc0', ear: '#ffc2cf', mark: '#f7c948' },
    grau:    { name: 'Nebelgrau',   body: '#e4e4ef', shade: '#c9c9da', ear: '#ffc2cf', mark: '#f7c948' },
    pfirsich:{ name: 'Pfirsich',    body: '#ffd9bf', shade: '#f5b995', ear: '#ff9fb2', mark: '#fff2a8' },
    lavendel:{ name: 'Lavendel',    body: '#e8dcff', shade: '#cdb9f5', ear: '#ffb8d9', mark: '#fff2a8' },
    minze:   { name: 'Minze',       body: '#d9f5e8', shade: '#b3e2cc', ear: '#ffc2cf', mark: '#f7c948' },
    nacht:   { name: 'Mitternacht', body: '#5d5486', shade: '#463e6d', ear: '#ff9fc8', mark: '#ffe27a' }
  };
  const NOX_FUR = { body: '#4a4170', shade: '#372f58', ear: '#b69cff', mark: '#bfe9ff' };

  function drawHat(ctx, hat, cx, hy, R, t) {
    if (!hat) return;
    ctx.save();
    switch (hat) {
      case 'schleife': {
        const x = cx + R * 0.55, y = hy - R * 0.72;
        ctx.fillStyle = '#ff7fa8';
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - R * 0.5, y - R * 0.45, x - R * 0.45, y + R * 0.1); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + R * 0.5, y - R * 0.45, x + R * 0.45, y + R * 0.1); ctx.closePath(); ctx.fill();
        circle(ctx, x, y, R * 0.13, '#ff5c93');
        break;
      }
      case 'blumen': {
        const cols = ['#ff9ec4', '#fff17a', '#9fd8ff', '#ffb37a', '#c7a6ff'];
        ctx.strokeStyle = '#6fbf5e'; ctx.lineWidth = R * 0.08;
        ctx.beginPath(); ctx.ellipse(cx, hy - R * 0.55, R * 0.82, R * 0.28, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        for (let k = 0; k < 5; k++) {
          const a = Math.PI * (1.12 + k * 0.19);
          const fx = cx + Math.cos(a) * R * 0.82, fy = hy - R * 0.55 + Math.sin(a) * R * 0.28;
          for (let p = 0; p < 5; p++) circle(ctx, fx + Math.cos(p * TAU / 5) * R * 0.1, fy + Math.sin(p * TAU / 5) * R * 0.1, R * 0.09, cols[k]);
          circle(ctx, fx, fy, R * 0.06, '#fff');
        }
        break;
      }
      case 'zauberhut': {
        const by = hy - R * 0.7;
        ctx.fillStyle = '#7b6cf0';
        ellipse(ctx, cx, by, R * 0.7, R * 0.16, '#6a5ae0');
        ctx.beginPath(); ctx.moveTo(cx - R * 0.45, by);
        ctx.quadraticCurveTo(cx - R * 0.1, by - R * 0.6, cx + R * 0.35 + Math.sin(t * 2) * R * 0.05, by - R * 1.05);
        ctx.quadraticCurveTo(cx + R * 0.15, by - R * 0.5, cx + R * 0.45, by); ctx.closePath();
        ctx.fillStyle = '#7b6cf0'; ctx.fill();
        starPath(ctx, cx + R * 0.02, by - R * 0.32, R * 0.14, R * 0.07, 0); ctx.fillStyle = '#ffe27a'; ctx.fill();
        break;
      }
      case 'krone': {
        const by = hy - R * 0.78;
        ctx.fillStyle = '#ffd24d';
        ctx.beginPath();
        ctx.moveTo(cx - R * 0.42, by + R * 0.12);
        ctx.lineTo(cx - R * 0.46, by - R * 0.28); ctx.lineTo(cx - R * 0.22, by - R * 0.06);
        ctx.lineTo(cx, by - R * 0.36); ctx.lineTo(cx + R * 0.22, by - R * 0.06);
        ctx.lineTo(cx + R * 0.46, by - R * 0.28); ctx.lineTo(cx + R * 0.42, by + R * 0.12);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#e8a92a'; ctx.lineWidth = R * 0.05; ctx.stroke();
        circle(ctx, cx, by - R * 0.02, R * 0.07, '#ff7fa8');
        circle(ctx, cx - R * 0.26, by + R * 0.03, R * 0.05, '#7fd4ff');
        circle(ctx, cx + R * 0.26, by + R * 0.03, R * 0.05, '#7fd4ff');
        break;
      }
      case 'muetze': {
        const by = hy - R * 0.55;
        ctx.fillStyle = '#ff9a8a';
        ctx.beginPath(); ctx.ellipse(cx, by, R * 0.72, R * 0.55, 0, Math.PI, TAU); ctx.fill();
        roundRect(ctx, cx - R * 0.76, by - R * 0.08, R * 1.52, R * 0.22, R * 0.1); ctx.fillStyle = '#fff4f0'; ctx.fill();
        circle(ctx, cx, by - R * 0.58, R * 0.17, '#fff4f0');
        break;
      }
      case 'kopfhoerer': {
        ctx.strokeStyle = '#8fd1ff'; ctx.lineWidth = R * 0.12; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(cx, hy, R * 0.92, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
        roundRect(ctx, cx - R * 1.02, hy - R * 0.1, R * 0.26, R * 0.42, R * 0.1); ctx.fillStyle = '#ff9ec4'; ctx.fill();
        roundRect(ctx, cx + R * 0.76, hy - R * 0.1, R * 0.26, R * 0.42, R * 0.1); ctx.fill();
        break;
      }
    }
    ctx.restore();
  }

  function drawNeckwear(ctx, item, cx, ny, R, t) {
    if (item === 'schal') {
      ctx.fillStyle = '#ff8f8f';
      roundRect(ctx, cx - R * 0.55, ny - R * 0.12, R * 1.1, R * 0.26, R * 0.12); ctx.fill();
      ctx.save(); ctx.translate(cx + R * 0.3, ny + R * 0.08); ctx.rotate(0.25 + Math.sin(t * 3) * 0.08);
      roundRect(ctx, -R * 0.1, 0, R * 0.22, R * 0.45, R * 0.08); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-R * 0.1, R * 0.12, R * 0.22, R * 0.06); ctx.fillRect(-R * 0.1, R * 0.26, R * 0.22, R * 0.06);
      ctx.restore();
    } else if (item === 'umhang') {
      // wird hinter dem Körper gezeichnet, siehe drawCat
    } else if (item === 'glocke') {
      ctx.strokeStyle = '#ff7fa8'; ctx.lineWidth = R * 0.1;
      ctx.beginPath(); ctx.ellipse(cx, ny - R * 0.02, R * 0.42, R * 0.1, 0, 0, Math.PI); ctx.stroke();
      circle(ctx, cx, ny + R * 0.14, R * 0.13, '#ffd24d');
      circle(ctx, cx, ny + R * 0.18, R * 0.035, '#b8862a');
    }
  }

  /**
   * Kätzchen zeichnen. o: { fur, look:[dx,dy], blink, squash, t, hat, neck, happy, sleepy, nox, glow }
   */
  function drawCat(ctx, cx, cy, s, o) {
    o = o || {};
    const f = o.nox ? NOX_FUR : (FURS[o.fur] || FURS.creme);
    const t = o.t || 0;
    const R = s * 0.3;
    const sq = o.squash || 0;
    const bob = Math.sin(t * 2.2 + (o.phase || 0)) * s * 0.012;
    ctx.save();
    ctx.translate(cx, cy + s * 0.08);
    ctx.scale(1 + sq * 0.18, 1 - sq * 0.18);
    ctx.translate(0, -s * 0.08 + bob);

    // Schatten
    ellipse(ctx, 0, s * 0.33, s * 0.26, s * 0.07, 'rgba(60,40,80,0.16)');

    if (o.glow) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.6);
      g.addColorStop(0, o.nox ? 'rgba(170,150,255,0.35)' : 'rgba(255,240,170,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
    }

    // Umhang
    if (o.neck === 'umhang') {
      ctx.fillStyle = '#6f63d9';
      ctx.beginPath();
      ctx.moveTo(-R * 0.6, R * 0.35);
      ctx.quadraticCurveTo(-R * 1.05, R * 1.3 + Math.sin(t * 3) * R * 0.08, -R * 0.2, R * 1.45);
      ctx.lineTo(R * 0.2, R * 1.45);
      ctx.quadraticCurveTo(R * 1.05, R * 1.3 + Math.cos(t * 3) * R * 0.08, R * 0.6, R * 0.35);
      ctx.closePath(); ctx.fill();
      for (let k = 0; k < 3; k++) { starPath(ctx, -R * 0.4 + k * R * 0.4, R * 1.1 + (k % 2) * R * 0.12, R * 0.09, R * 0.045, 0); ctx.fillStyle = '#ffe27a'; ctx.fill(); }
    }

    // Schwanz
    ctx.strokeStyle = f.shade; ctx.lineWidth = s * 0.075; ctx.lineCap = 'round';
    const tw = Math.sin(t * 3 + (o.phase || 0)) * 0.3;
    ctx.beginPath();
    ctx.moveTo(R * 0.55, R * 0.95);
    ctx.quadraticCurveTo(R * 1.35, R * 0.9, R * (1.15 + tw * 0.3), R * (0.25 - tw * 0.2));
    ctx.stroke();
    ctx.strokeStyle = f.body; ctx.lineWidth = s * 0.05;
    ctx.stroke();

    // Körper
    ellipse(ctx, 0, R * 0.95, R * 0.72, R * 0.6, f.shade);
    ellipse(ctx, 0, R * 0.88, R * 0.66, R * 0.55, f.body);
    // Pfötchen
    ellipse(ctx, -R * 0.32, R * 1.42, R * 0.2, R * 0.13, f.body);
    ellipse(ctx, R * 0.32, R * 1.42, R * 0.2, R * 0.13, f.body);

    const hy = -R * 0.1;
    // Ohren
    const earWig = Math.max(0, Math.sin(t * 1.3 + 1)) > 0.97 ? 0.12 : 0;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * R * 0.58, hy - R * 0.62);
      ctx.rotate(side * (0.28 + (side > 0 ? earWig : 0)));
      ctx.beginPath();
      ctx.moveTo(-R * 0.3, R * 0.25);
      ctx.quadraticCurveTo(-R * 0.12, -R * 0.55, 0, -R * 0.5);
      ctx.quadraticCurveTo(R * 0.12, -R * 0.55, R * 0.3, R * 0.25);
      ctx.closePath(); ctx.fillStyle = f.body; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-R * 0.16, R * 0.18);
      ctx.quadraticCurveTo(-R * 0.06, -R * 0.35, 0, -R * 0.32);
      ctx.quadraticCurveTo(R * 0.06, -R * 0.35, R * 0.16, R * 0.18);
      ctx.closePath(); ctx.fillStyle = f.ear; ctx.fill();
      ctx.restore();
    }
    // Kopf
    ellipse(ctx, 0, hy + R * 0.04, R * 1.0, R * 0.86, f.shade);
    ellipse(ctx, 0, hy, R * 0.98, R * 0.82, f.body);

    // Mond-/Sternzeichen auf der Stirn
    ctx.save();
    if (o.nox) {
      starPath(ctx, 0, hy - R * 0.5, R * 0.14, R * 0.07, 0); ctx.fillStyle = f.mark; ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, hy - R * 0.5, R * 0.15, 0, TAU); ctx.fillStyle = f.mark; ctx.fill();
      ctx.beginPath(); ctx.arc(R * 0.07, hy - R * 0.55, R * 0.13, 0, TAU); ctx.fillStyle = f.body; ctx.fill();
    }
    ctx.restore();

    // Augen
    const look = o.look || [0, 0];
    const ex = R * 0.4, ey = hy + R * 0.05;
    const lx = look[0] * R * 0.08, ly = look[1] * R * 0.06;
    if (o.happy) {
      ctx.strokeStyle = '#3b2b4a'; ctx.lineWidth = R * 0.11; ctx.lineCap = 'round';
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * ex, ey + R * 0.06, R * 0.15, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
    } else if (o.blink || o.sleepy) {
      ctx.strokeStyle = '#3b2b4a'; ctx.lineWidth = R * 0.09; ctx.lineCap = 'round';
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * ex, ey - R * 0.02, R * 0.14, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    } else {
      for (const side of [-1, 1]) {
        ellipse(ctx, side * ex + lx, ey + ly, R * 0.17, R * 0.22, o.nox ? '#ffe27a' : '#3b2b4a');
        if (o.nox) ellipse(ctx, side * ex + lx * 1.4, ey + ly, R * 0.06, R * 0.16, '#2a2140');
        circle(ctx, side * ex + lx - R * 0.05, ey + ly - R * 0.08, R * 0.065, '#fff');
        circle(ctx, side * ex + lx + R * 0.05, ey + ly + R * 0.07, R * 0.03, 'rgba(255,255,255,0.8)');
      }
    }
    // Bäckchen
    ellipse(ctx, -R * 0.62, hy + R * 0.3, R * 0.16, R * 0.09, o.nox ? 'rgba(200,140,255,0.45)' : 'rgba(255,140,170,0.5)');
    ellipse(ctx, R * 0.62, hy + R * 0.3, R * 0.16, R * 0.09, o.nox ? 'rgba(200,140,255,0.45)' : 'rgba(255,140,170,0.5)');
    // Näschen & Mund
    ctx.beginPath();
    ctx.moveTo(-R * 0.06, hy + R * 0.22); ctx.lineTo(R * 0.06, hy + R * 0.22); ctx.lineTo(0, hy + R * 0.29); ctx.closePath();
    ctx.fillStyle = o.nox ? '#b69cff' : '#ff8fa8'; ctx.fill();
    ctx.strokeStyle = o.nox ? '#bfb3e8' : '#3b2b4a'; ctx.lineWidth = R * 0.055; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-R * 0.08, hy + R * 0.3, R * 0.08, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.moveTo(R * 0.16, hy + R * 0.3);
    ctx.arc(R * 0.08, hy + R * 0.3, R * 0.08, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    // Schnurrhaare
    ctx.strokeStyle = o.nox ? 'rgba(220,210,255,0.5)' : 'rgba(120,90,110,0.35)'; ctx.lineWidth = R * 0.035;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * R * 0.72, hy + R * 0.2); ctx.lineTo(side * R * 1.12, hy + R * 0.13);
      ctx.moveTo(side * R * 0.72, hy + R * 0.28); ctx.lineTo(side * R * 1.1, hy + R * 0.32);
      ctx.stroke();
    }

    drawNeckwear(ctx, o.neck, 0, R * 0.52, R, t);
    drawHat(ctx, o.hat, 0, hy, R, t);
    ctx.restore();
  }

  /** Sternchen. o: { home, t, phase, scared, glow } */
  function drawStar(ctx, cx, cy, s, o) {
    o = o || {};
    const t = o.t || 0;
    const bob = Math.sin(t * 2.4 + (o.phase || 0)) * s * (o.home ? 0.035 : 0.015);
    const R = s * 0.36;
    ctx.save();
    ctx.translate(cx, cy + bob);
    ellipse(ctx, 0, s * 0.33 - bob, s * 0.22, s * 0.06, 'rgba(60,40,80,0.14)');
    if (o.home || o.glow) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.7);
      g.addColorStop(0, 'rgba(255,236,140,0.75)');
      g.addColorStop(0.5, 'rgba(255,226,120,0.22)');
      g.addColorStop(1, 'rgba(255,226,120,0)');
      ctx.fillStyle = g; ctx.fillRect(-s * 0.7, -s * 0.7, s * 1.4, s * 1.4);
    }
    const wob = Math.sin(t * 1.7 + (o.phase || 0)) * 0.06;
    starPath(ctx, 0, s * 0.02, R * 1.04, R * 0.56, wob);
    ctx.fillStyle = '#f2b33d'; ctx.fill();
    starPath(ctx, 0, 0, R, R * 0.54, wob);
    const gr = ctx.createLinearGradient(0, -R, 0, R);
    gr.addColorStop(0, o.home ? '#fff7b8' : '#ffe98a');
    gr.addColorStop(1, o.home ? '#ffd24d' : '#ffc94a');
    ctx.fillStyle = gr; ctx.fill();
    // Glanz
    ellipse(ctx, -R * 0.28, -R * 0.35, R * 0.12, R * 0.07, 'rgba(255,255,255,0.7)');
    // Gesicht
    ctx.strokeStyle = '#6b4a2a'; ctx.lineCap = 'round'; ctx.lineWidth = R * 0.09;
    const ey = R * 0.02, ex = R * 0.22;
    if (o.home) {
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * ex, ey + R * 0.06, R * 0.1, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, ey + R * 0.16, R * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    } else if (o.scared) {
      for (const side of [-1, 1]) circle(ctx, side * ex, ey, R * 0.07, '#6b4a2a');
      ctx.beginPath(); ctx.arc(0, ey + R * 0.28, R * 0.08, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
      ellipse(ctx, R * 0.42, -R * 0.1, R * 0.05, R * 0.08, '#8fd1ff');
    } else {
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * ex, ey - R * 0.02, R * 0.09, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
      ctx.lineWidth = R * 0.06;
      ctx.beginPath(); ctx.arc(0, ey + R * 0.2, R * 0.05, 0, Math.PI); ctx.stroke();
      // kleines "z" wenn es schläft
      const zt = (t * 0.6 + (o.phase || 0)) % 1;
      ctx.globalAlpha = Math.sin(zt * Math.PI) * 0.8;
      ctx.fillStyle = '#8a7bb8'; ctx.font = `bold ${Math.round(R * 0.45)}px sans-serif`;
      ctx.fillText('z', R * 0.5 + zt * R * 0.3, -R * 0.6 - zt * R * 0.5);
      ctx.globalAlpha = 1;
    }
    ellipse(ctx, -R * 0.4, ey + R * 0.2, R * 0.1, R * 0.06, 'rgba(255,130,150,0.55)');
    ellipse(ctx, R * 0.4, ey + R * 0.2, R * 0.1, R * 0.06, 'rgba(255,130,150,0.55)');
    ctx.restore();
  }

  function drawRock(ctx, cx, cy, s, o) {
    o = o || {};
    ctx.save(); ctx.translate(cx, cy);
    ellipse(ctx, 0, s * 0.3, s * 0.3, s * 0.07, 'rgba(60,40,80,0.16)');
    ctx.beginPath();
    ctx.moveTo(-s * 0.34, s * 0.2);
    ctx.bezierCurveTo(-s * 0.42, -s * 0.12, -s * 0.2, -s * 0.34, s * 0.02, -s * 0.32);
    ctx.bezierCurveTo(s * 0.3, -s * 0.3, s * 0.42, -s * 0.05, s * 0.36, s * 0.2);
    ctx.bezierCurveTo(s * 0.3, s * 0.34, -s * 0.28, s * 0.34, -s * 0.34, s * 0.2);
    ctx.closePath();
    ctx.fillStyle = '#a79f9a'; ctx.fill();
    ctx.save(); ctx.clip();
    ellipse(ctx, -s * 0.05, -s * 0.06, s * 0.33, s * 0.26, '#c3bcb6');
    ellipse(ctx, -s * 0.14, -s * 0.18, s * 0.1, s * 0.05, 'rgba(255,255,255,0.55)');
    // Moos
    ellipse(ctx, s * 0.12, -s * 0.3, s * 0.16, s * 0.08, '#8cc56f');
    ellipse(ctx, s * 0.22, -s * 0.26, s * 0.09, s * 0.06, '#9fd480');
    ctx.restore();
    // kleines Blättchen
    ctx.strokeStyle = '#6aa84f'; ctx.lineWidth = s * 0.025;
    ctx.beginPath(); ctx.moveTo(s * 0.14, -s * 0.33); ctx.quadraticCurveTo(s * 0.14, -s * 0.44, s * 0.06, -s * 0.46); ctx.stroke();
    ellipse(ctx, s * 0.05, -s * 0.46, s * 0.05, s * 0.03, '#8cc56f');
    ctx.restore();
  }

  function drawNest(ctx, cx, cy, s, o) {
    o = o || {};
    const t = o.t || 0;
    ctx.save(); ctx.translate(cx, cy + s * 0.08);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.45);
    g.addColorStop(0, `rgba(255,240,170,${0.55 + Math.sin(t * 2) * 0.12})`);
    g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g; ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
    ellipse(ctx, 0, 0, s * 0.36, s * 0.22, '#b88a5a');
    ellipse(ctx, 0, -s * 0.02, s * 0.27, s * 0.14, '#fff1c4');
    ellipse(ctx, 0, s * 0.01, s * 0.24, s * 0.1, '#ffe7a0');
    ctx.strokeStyle = '#8f6639'; ctx.lineWidth = s * 0.025; ctx.lineCap = 'round';
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * TAU + 0.3;
      const x1 = Math.cos(a) * s * 0.3, y1 = Math.sin(a) * s * 0.17;
      ctx.beginPath(); ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(Math.cos(a + 0.4) * s * 0.38, Math.sin(a + 0.4) * s * 0.23, Math.cos(a + 0.7) * s * 0.33, Math.sin(a + 0.7) * s * 0.2);
      ctx.stroke();
    }
    // gepunkteter Sternumriss als Hinweis
    if (!o.filled) {
      ctx.setLineDash([s * 0.03, s * 0.04]);
      ctx.strokeStyle = 'rgba(220,160,40,0.8)'; ctx.lineWidth = s * 0.02;
      ctx.save(); ctx.scale(1, 0.55);
      starPath(ctx, 0, -s * 0.03, s * 0.18, s * 0.1, 0); ctx.stroke();
      ctx.restore(); ctx.setLineDash([]);
    }
    ctx.restore();
  }

  /** Pilz-Schalter */
  function drawPlate(ctx, cx, cy, s, o) {
    o = o || {};
    const p = o.pressed ? 1 : 0;
    ctx.save(); ctx.translate(cx, cy + s * 0.1);
    ellipse(ctx, 0, s * 0.18, s * 0.3, s * 0.08, 'rgba(60,40,80,0.15)');
    // Stiel
    roundRect(ctx, -s * 0.1, -s * 0.02 + p * s * 0.1, s * 0.2, s * 0.2 - p * s * 0.1, s * 0.05);
    ctx.fillStyle = '#fff3e0'; ctx.fill();
    // Hut
    const hy = -s * 0.05 + p * s * 0.12;
    ctx.beginPath(); ctx.ellipse(0, hy, s * 0.34, s * (0.24 - p * 0.12), 0, Math.PI, TAU); ctx.closePath();
    ctx.fillStyle = o.pressed ? '#e0566b' : '#ff6f85'; ctx.fill();
    ellipse(ctx, 0, hy, s * 0.34, s * 0.04, '#d94b62');
    const dots = [[-0.16, -0.1], [0.05, -0.16], [0.18, -0.06], [-0.02, -0.05]];
    for (const [dx, dy] of dots) ellipse(ctx, dx * s, hy + dy * s * (1 - p * 0.5), s * 0.045, s * 0.035 * (1 - p * 0.4), '#fff');
    ctx.restore();
  }

  /** Hecken-Tor: o.open 0..1 */
  function drawGate(ctx, cx, cy, s, o) {
    o = o || {};
    const op = o.open || 0;
    ctx.save(); ctx.translate(cx, cy);
    const h = s * 0.62 * (1 - op * 0.82);
    const base = s * 0.3;
    ctx.globalAlpha = 1 - op * 0.35;
    for (let k = -1; k <= 1; k++) {
      const x = k * s * 0.3;
      roundRect(ctx, x - s * 0.08, base - h, s * 0.16, h, s * 0.07);
      ctx.fillStyle = '#c98f5a'; ctx.fill();
      ctx.fillStyle = '#b07744';
      ctx.fillRect(x - s * 0.08, base - h + s * 0.05, s * 0.16, s * 0.03);
    }
    if (h > s * 0.2) {
      roundRect(ctx, -s * 0.42, base - h * 0.75, s * 0.84, s * 0.08, s * 0.04); ctx.fillStyle = '#b07744'; ctx.fill();
      roundRect(ctx, -s * 0.42, base - h * 0.35, s * 0.84, s * 0.08, s * 0.04); ctx.fill();
      // Blümchen
      const fx = s * 0.15, fy = base - h * 0.75;
      for (let p = 0; p < 5; p++) circle(ctx, fx + Math.cos(p * TAU / 5) * s * 0.05, fy + Math.sin(p * TAU / 5) * s * 0.05, s * 0.04, '#ff9ec4');
      circle(ctx, fx, fy, s * 0.03, '#fff17a');
    }
    ctx.restore();
  }

  // --------------- Portraits für Dialoge ---------------
  function drawSnail(ctx, cx, cy, s, t) {
    const R = s * 0.3;
    ctx.save(); ctx.translate(cx, cy);
    ellipse(ctx, 0, R * 1.2, R * 1.3, R * 0.25, 'rgba(60,40,80,0.12)');
    // Körper
    ctx.fillStyle = '#c9e7a8';
    roundRect(ctx, -R * 1.25, R * 0.55, R * 2.3, R * 0.6, R * 0.3); ctx.fill();
    ellipse(ctx, -R * 1.05, R * 0.2, R * 0.42, R * 0.55, '#c9e7a8');
    // Fühler
    ctx.strokeStyle = '#a9d487'; ctx.lineWidth = R * 0.1; ctx.lineCap = 'round';
    const w = Math.sin(t * 2) * R * 0.08;
    ctx.beginPath(); ctx.moveTo(-R * 1.2, -R * 0.2); ctx.lineTo(-R * 1.4 + w, -R * 0.75); ctx.moveTo(-R * 0.9, -R * 0.2); ctx.lineTo(-R * 0.8 - w, -R * 0.75); ctx.stroke();
    circle(ctx, -R * 1.4 + w, -R * 0.78, R * 0.1, '#a9d487');
    circle(ctx, -R * 0.8 - w, -R * 0.78, R * 0.1, '#a9d487');
    // Gesicht
    circle(ctx, -R * 1.2, R * 0.15, R * 0.09, '#3b2b4a'); circle(ctx, -R * 0.9, R * 0.15, R * 0.09, '#3b2b4a');
    circle(ctx, -R * 1.22, R * 0.12, R * 0.035, '#fff'); circle(ctx, -R * 0.92, R * 0.12, R * 0.035, '#fff');
    ellipse(ctx, -R * 1.33, R * 0.34, R * 0.09, R * 0.05, 'rgba(255,140,170,0.6)');
    ellipse(ctx, -R * 0.78, R * 0.34, R * 0.09, R * 0.05, 'rgba(255,140,170,0.6)');
    ctx.strokeStyle = '#3b2b4a'; ctx.lineWidth = R * 0.05;
    ctx.beginPath(); ctx.arc(-R * 1.05, R * 0.3, R * 0.08, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    // Haus
    circle(ctx, R * 0.25, R * 0.05, R * 0.82, '#ffb38a');
    circle(ctx, R * 0.25, R * 0.05, R * 0.72, '#ffc9a3');
    ctx.strokeStyle = '#f08f6a'; ctx.lineWidth = R * 0.12;
    ctx.beginPath();
    for (let a = 0; a < 12; a += 0.1) { const rr = R * 0.06 * a; const x = R * 0.25 + Math.cos(a) * rr, y = R * 0.05 + Math.sin(a) * rr; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    // Blümchen auf dem Haus
    for (let p = 0; p < 5; p++) circle(ctx, R * 0.55 + Math.cos(p * TAU / 5) * R * 0.14, -R * 0.62 + Math.sin(p * TAU / 5) * R * 0.14, R * 0.11, '#ff9ec4');
    circle(ctx, R * 0.55, -R * 0.62, R * 0.08, '#fff17a');
    ctx.restore();
  }

  function drawFrog(ctx, cx, cy, s, t) {
    const R = s * 0.3;
    ctx.save(); ctx.translate(cx, cy);
    ellipse(ctx, 0, R * 1.25, R * 1.2, R * 0.25, 'rgba(60,40,80,0.12)');
    ellipse(ctx, 0, R * 0.55, R * 1.1, R * 0.75, '#7fcf8a');
    ellipse(ctx, 0, R * 0.75, R * 0.7, R * 0.45, '#d8f5c8');
    ellipse(ctx, 0, -R * 0.1, R * 1.15, R * 0.7, '#8ad996');
    for (const side of [-1, 1]) {
      circle(ctx, side * R * 0.55, -R * 0.62, R * 0.38, '#8ad996');
      circle(ctx, side * R * 0.55, -R * 0.62, R * 0.26, '#fff');
      const bl = (t % 4) > 3.85;
      if (bl) { ctx.strokeStyle = '#3b2b4a'; ctx.lineWidth = R * 0.07; ctx.beginPath(); ctx.moveTo(side * R * 0.55 - R * 0.14, -R * 0.62); ctx.lineTo(side * R * 0.55 + R * 0.14, -R * 0.62); ctx.stroke(); }
      else { circle(ctx, side * R * 0.55, -R * 0.6, R * 0.14, '#3b2b4a'); circle(ctx, side * R * 0.5, -R * 0.66, R * 0.05, '#fff'); }
    }
    ctx.strokeStyle = '#3b6b45'; ctx.lineWidth = R * 0.08; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, -R * 0.1, R * 0.55, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    ellipse(ctx, -R * 0.75, R * 0.05, R * 0.15, R * 0.08, 'rgba(255,140,170,0.6)');
    ellipse(ctx, R * 0.75, R * 0.05, R * 0.15, R * 0.08, 'rgba(255,140,170,0.6)');
    // Seerosen-Krönchen
    ctx.save(); ctx.translate(R * 0.1, -R * 0.95); ctx.rotate(Math.sin(t) * 0.1);
    for (let p = 0; p < 6; p++) { ctx.save(); ctx.rotate(p * TAU / 6); ellipse(ctx, 0, -R * 0.14, R * 0.08, R * 0.16, '#ffc2dc'); ctx.restore(); }
    circle(ctx, 0, 0, R * 0.08, '#fff17a');
    ctx.restore();
    ctx.restore();
  }

  function drawBunny(ctx, cx, cy, s, t) {
    const R = s * 0.3;
    ctx.save(); ctx.translate(cx, cy);
    ellipse(ctx, 0, R * 1.3, R * 1.0, R * 0.22, 'rgba(60,40,80,0.12)');
    ellipse(ctx, 0, R * 0.8, R * 0.8, R * 0.6, '#f4f8ff');
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * R * 0.35, -R * 0.65); ctx.rotate(side * (0.15 + Math.sin(t * 1.5 + side) * 0.06));
      ellipse(ctx, 0, -R * 0.55, R * 0.24, R * 0.62, '#f4f8ff');
      ellipse(ctx, 0, -R * 0.52, R * 0.12, R * 0.45, '#ffd0e0');
      ctx.restore();
    }
    ellipse(ctx, 0, -R * 0.05, R * 0.85, R * 0.72, '#eef3fc');
    ellipse(ctx, 0, -R * 0.08, R * 0.82, R * 0.68, '#fbfdff');
    for (const side of [-1, 1]) { ellipse(ctx, side * R * 0.33, -R * 0.1, R * 0.12, R * 0.16, '#3b2b4a'); circle(ctx, side * R * 0.33 - R * 0.04, -R * 0.16, R * 0.05, '#fff'); }
    ellipse(ctx, 0, R * 0.12, R * 0.07, R * 0.05, '#ff8fa8');
    ellipse(ctx, -R * 0.55, R * 0.15, R * 0.13, R * 0.07, 'rgba(255,140,170,0.55)');
    ellipse(ctx, R * 0.55, R * 0.15, R * 0.13, R * 0.07, 'rgba(255,140,170,0.55)');
    // Schal
    roundRect(ctx, -R * 0.6, R * 0.45, R * 1.2, R * 0.22, R * 0.1); ctx.fillStyle = '#8fd1ff'; ctx.fill();
    ctx.restore();
  }

  function drawHedgehog(ctx, cx, cy, s, t) {
    const R = s * 0.3;
    ctx.save(); ctx.translate(cx, cy);
    ellipse(ctx, 0, R * 1.2, R * 1.2, R * 0.25, 'rgba(60,40,80,0.12)');
    // Stacheln
    ctx.fillStyle = '#9b7657';
    ctx.beginPath();
    for (let k = 0; k <= 14; k++) {
      const a = Math.PI * (0.95 + k / 14 * 1.1);
      const rr = k % 2 ? R * 1.05 : R * 1.35;
      const x = Math.cos(a) * rr + R * 0.15, y = Math.sin(a) * rr * 0.9 + R * 0.35;
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ellipse(ctx, R * 0.15, R * 0.4, R * 1.05, R * 0.78, '#8a6547');
    // Gesicht
    ellipse(ctx, -R * 0.35, R * 0.45, R * 0.72, R * 0.6, '#f3dcc0');
    ellipse(ctx, -R * 0.95, R * 0.55, R * 0.18, R * 0.13, '#3b2b4a');
    circle(ctx, -R * 0.4, R * 0.3, R * 0.1, '#3b2b4a'); circle(ctx, -R * 0.43, R * 0.26, R * 0.04, '#fff');
    circle(ctx, -R * 0.0, R * 0.3, R * 0.1, '#3b2b4a'); circle(ctx, -R * 0.03, R * 0.26, R * 0.04, '#fff');
    ellipse(ctx, -R * 0.2, R * 0.6, R * 0.14, R * 0.07, 'rgba(255,140,170,0.6)');
    // Pilz-Hut
    ctx.save(); ctx.translate(R * 0.4, -R * 0.55); ctx.rotate(0.2 + Math.sin(t * 1.4) * 0.05);
    ctx.beginPath(); ctx.ellipse(0, 0, R * 0.55, R * 0.4, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = '#ff6f85'; ctx.fill();
    circle(ctx, -R * 0.2, -R * 0.18, R * 0.07, '#fff'); circle(ctx, R * 0.15, -R * 0.25, R * 0.07, '#fff'); circle(ctx, R * 0.3, -R * 0.06, R * 0.05, '#fff');
    ctx.restore();
    // Brille
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = R * 0.05;
    ctx.beginPath(); ctx.arc(-R * 0.4, R * 0.3, R * 0.17, 0, TAU); ctx.moveTo(R * 0.17, R * 0.3); ctx.arc(0, R * 0.3, R * 0.17, 0, TAU); ctx.moveTo(-R * 0.23, R * 0.3); ctx.lineTo(-R * 0.17, R * 0.3); ctx.stroke();
    ctx.restore();
  }

  function drawMoon(ctx, cx, cy, s, t) {
    const R = s * 0.42;
    ctx.save(); ctx.translate(cx, cy);
    const g = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 1.5);
    g.addColorStop(0, 'rgba(255,244,190,0.5)'); g.addColorStop(1, 'rgba(255,244,190,0)');
    ctx.fillStyle = g; ctx.fillRect(-R * 1.6, -R * 1.6, R * 3.2, R * 3.2);
    circle(ctx, 0, 0, R, '#fff4c2');
    circle(ctx, -R * 0.4, -R * 0.45, R * 0.14, '#f7e4a0');
    circle(ctx, R * 0.5, R * 0.35, R * 0.18, '#f7e4a0');
    circle(ctx, R * 0.15, -R * 0.6, R * 0.08, '#f7e4a0');
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = R * 0.07; ctx.lineCap = 'round';
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * R * 0.33, -R * 0.02, R * 0.13, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, R * 0.25, R * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ellipse(ctx, -R * 0.55, R * 0.22, R * 0.15, R * 0.08, 'rgba(255,150,170,0.5)');
    ellipse(ctx, R * 0.55, R * 0.22, R * 0.15, R * 0.08, 'rgba(255,150,170,0.5)');
    // Schlafmütze
    ctx.save(); ctx.translate(R * 0.1, -R * 0.82); ctx.rotate(-0.3);
    ctx.beginPath(); ctx.moveTo(-R * 0.55, R * 0.1); ctx.quadraticCurveTo(R * 0.1, -R * 0.9, R * 0.9 + Math.sin(t * 1.5) * R * 0.05, -R * 0.1); ctx.quadraticCurveTo(R * 0.2, -R * 0.2, R * 0.55, R * 0.1); ctx.closePath();
    ctx.fillStyle = '#8fa8ff'; ctx.fill();
    circle(ctx, R * 0.92 + Math.sin(t * 1.5) * R * 0.05, -R * 0.1, R * 0.13, '#fff');
    roundRect(ctx, -R * 0.6, R * 0.02, R * 1.2, R * 0.2, R * 0.1); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawPortrait(ctx, who, cx, cy, s, t, opts) {
    opts = opts || {};
    switch (who) {
      case 'luma': drawCat(ctx, cx, cy + s * 0.05, s * 1.25, { t, fur: opts.fur, hat: opts.hat, neck: opts.neck, blink: (t % 3.7) > 3.55, happy: opts.happy }); break;
      case 'nox': drawCat(ctx, cx, cy + s * 0.05, s * 1.25, { t, nox: true, blink: (t % 4.3) > 4.15, glow: true }); break;
      case 'frieda': drawSnail(ctx, cx, cy, s, t); break;
      case 'fridolin': drawFrog(ctx, cx, cy, s, t); break;
      case 'flocke': drawBunny(ctx, cx, cy, s, t); break;
      case 'hilde': drawHedgehog(ctx, cx, cy, s, t); break;
      case 'mond': drawMoon(ctx, cx, cy, s, t); break;
      case 'stern': drawStar(ctx, cx, cy, s * 1.2, { t, home: true }); break;
    }
  }

  root.SPSprites = {
    TAU, hash, ellipse, circle, roundRect, starPath, FURS,
    drawCat, drawStar, drawRock, drawNest, drawPlate, drawGate, drawPortrait
  };
})(typeof self !== 'undefined' ? self : this);
