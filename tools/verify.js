#!/usr/bin/env node
/*
 * Prüft alle Level in js/levels.js:
 *  - Karte lässt sich parsen, genau so viele Sternchen wie Nester
 *  - Level ist lösbar und der gespeicherte "par" ist die echte Mindestzugzahl
 *  - die Lösung nutzt die Mechanik der jeweiligen Welt
 * Aufruf: node tools/verify.js [--write]   (--write korrigiert falsche par-Werte)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const E = require('../js/engine.js');
const DATA = require('../js/levels.js');

const write = process.argv.includes('--write');
const DIR = 'URDL';
const MECH = {
  teich: s => s.sinks > 0,
  frost: s => s.slides > 0,
  pilz: s => s.gatePasses > 0,
  wolken: s => s.noxPushes > 0
};

let errors = 0;
const newPars = [];
DATA.worlds.forEach((w, wi) => {
  w.levels.forEach((l, li) => {
    const id = `${wi + 1}-${li + 1}`;
    const tag = `${id.padEnd(4)} ${l.name.padEnd(22)}`;
    let L;
    try { L = E.parse(l.map); } catch (e) { console.log(`✗ ${tag} ${e.message}`); errors++; newPars.push(l.par); return; }
    if (L.nests.length !== L.start.s.length) { console.log(`✗ ${tag} ${L.start.s.length} Sternchen, aber ${L.nests.length} Nester`); errors++; }
    const t0 = Date.now();
    const r = E.solve(L, L.start, { path: true, maxStates: 5000000 });
    const ms = Date.now() - t0;
    if (!r.solved) { console.log(`✗ ${tag} NICHT LÖSBAR (${r.explored} Zustände)`); errors++; newPars.push(l.par); return; }
    const stats = E.replay(L, r.moves);
    const par = r.moves.length;
    newPars.push(par);
    const mech = MECH[w.theme] ? MECH[w.theme](stats) : true;
    const ok = par === l.par && stats.won && mech;
    if (!ok) errors++;
    console.log(`${ok ? '✓' : '✗'} ${tag} par ${String(par).padStart(3)}${par !== l.par ? ` (gespeichert: ${l.par})` : ''}  ${L.w}x${L.h}  ${r.explored} Zustände  ${ms}ms${mech ? '' : '  MECHANIK UNGENUTZT'}  ${r.moves.map(d => DIR[d]).join('')}`);
  });
});

if (write) {
  const file = path.join(__dirname, '..', 'js', 'levels.js');
  let src = fs.readFileSync(file, 'utf8');
  let k = 0;
  src = src.replace(/lv\(('(?:[^'\\]|\\.)*'), (\d+),/g, (m, name) => `lv(${name}, ${newPars[k++]},`);
  fs.writeFileSync(file, src);
  console.log(`\npar-Werte in js/levels.js aktualisiert (${k} Level).`);
}
console.log(errors ? `\n${errors} Problem(e) gefunden.` : '\nAlle Level in Ordnung. ✨');
process.exit(errors && !write ? 1 : 0);
