/*
 * Sternenpfötchen – synthetisierte Klänge & Spieluhr-Musik (WebAudio, keine Dateien).
 */
(function (root) {
  'use strict';
  let ctx = null, master = null, sfxGain = null, musGain = null;
  let sfxOn = true, musicOn = true, unlocked = false;
  let musicTimer = null, nextNoteTime = 0, step = 0, chordIdx = 0;

  function ensure() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? 0.55 : 0; sfxGain.connect(master);
    musGain = ctx.createGain(); musGain.gain.value = musicOn ? 0.22 : 0; musGain.connect(master);
    return true;
  }

  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  function tone(midi, when, dur, opt) {
    opt = opt || {};
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opt.type || 'sine';
    o.frequency.setValueAtTime(hz(midi), when);
    if (opt.slide) o.frequency.exponentialRampToValueAtTime(hz(midi + opt.slide), when + dur);
    const v = opt.vol == null ? 0.3 : opt.vol;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(v, when + (opt.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g); g.connect(opt.out || sfxGain);
    o.start(when); o.stop(when + dur + 0.05);
    if (opt.bell) { // Obertöne für Spieluhr-Klang
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(hz(midi) * 3.01, when);
      g2.gain.setValueAtTime(0.0001, when);
      g2.gain.exponentialRampToValueAtTime(v * 0.25, when + 0.005);
      g2.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.4);
      o2.connect(g2); g2.connect(opt.out || sfxGain);
      o2.start(when); o2.stop(when + dur);
    }
  }

  function noise(when, dur, opt) {
    opt = opt || {};
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = opt.filter || 'lowpass';
    f.frequency.setValueAtTime(opt.freq || 1200, when);
    if (opt.sweep) f.frequency.exponentialRampToValueAtTime(opt.sweep, when + dur);
    const g = ctx.createGain(); g.gain.value = opt.vol || 0.2;
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(when);
  }

  const SFX = {
    step() { const n = ctx.currentTime; tone(79 + Math.floor(Math.random() * 3), n, 0.07, { vol: 0.07, type: 'triangle' }); },
    push() { const n = ctx.currentTime; tone(52, n, 0.14, { vol: 0.18, type: 'triangle', slide: -3 }); noise(n, 0.08, { freq: 600, vol: 0.08 }); },
    bump() { const n = ctx.currentTime; tone(48, n, 0.1, { vol: 0.12, type: 'sine', slide: -4 }); },
    slide() { const n = ctx.currentTime; noise(n, 0.35, { filter: 'bandpass', freq: 3000, sweep: 1200, vol: 0.12 }); },
    home() {
      const n = ctx.currentTime;
      [84, 88, 91, 96].forEach((m, i) => tone(m, n + i * 0.06, 0.5, { vol: 0.14, bell: true }));
    },
    splash() { const n = ctx.currentTime; noise(n, 0.4, { freq: 1800, sweep: 300, vol: 0.25 }); tone(64, n, 0.2, { vol: 0.08, slide: -12 }); },
    gate() { const n = ctx.currentTime; tone(67, n, 0.15, { vol: 0.1, type: 'triangle' }); tone(74, n + 0.07, 0.2, { vol: 0.1, type: 'triangle' }); },
    undo() { const n = ctx.currentTime; tone(76, n, 0.08, { vol: 0.08, type: 'triangle', slide: -5 }); },
    tap() { const n = ctx.currentTime; tone(81, n, 0.06, { vol: 0.08, type: 'triangle' }); },
    hint() { const n = ctx.currentTime; tone(88, n, 0.3, { vol: 0.1, bell: true }); tone(93, n + 0.1, 0.4, { vol: 0.1, bell: true }); },
    stuck() { const n = ctx.currentTime; tone(67, n, 0.25, { vol: 0.1, type: 'triangle', slide: -2 }); tone(63, n + 0.18, 0.35, { vol: 0.1, type: 'triangle', slide: -2 }); },
    win() {
      const n = ctx.currentTime;
      const mel = [72, 76, 79, 84, 79, 84, 88];
      mel.forEach((m, i) => tone(m, n + i * 0.11, 0.6, { vol: 0.14, bell: true }));
      [60, 64, 67].forEach(m => tone(m, n + 0.77, 1.4, { vol: 0.06, type: 'triangle' }));
    },
    star(i) { const n = ctx.currentTime; tone(84 + [0, 4, 7][i % 3], n, 0.7, { vol: 0.16, bell: true }); },
    unlock() {
      const n = ctx.currentTime;
      [79, 83, 86, 91, 95].forEach((m, i) => tone(m, n + i * 0.08, 0.8, { vol: 0.12, bell: true }));
    },
    page() { const n = ctx.currentTime; noise(n, 0.12, { filter: 'highpass', freq: 2500, vol: 0.05 }); }
  };

  // ---------- Spieluhr-Musik ----------
  const CHORDS = [
    [60, 64, 67, 71], // Cmaj7
    [57, 60, 64, 67], // Am7
    [53, 57, 60, 64], // Fmaj7
    [55, 59, 62, 65]  // G7
  ];
  const PENTA = [0, 2, 4, 7, 9];

  function scheduleMusic() {
    if (!ctx) return;
    while (nextNoteTime < ctx.currentTime + 0.3) {
      const beat = 0.42;
      const chord = CHORDS[chordIdx];
      const t = nextNoteTime;
      if (step % 8 === 0) tone(chord[0] - 12, t, beat * 7, { vol: 0.12, type: 'triangle', out: musGain, attack: 0.05 });
      // Arpeggio
      const pat = [0, 2, 1, 3, 2, 1, 3, 2];
      if (step % 2 === 0 || Math.random() < 0.3) tone(chord[pat[step % 8]] + 12, t, beat * 2.5, { vol: 0.09, bell: true, out: musGain });
      // gelegentliche Melodie-Tupfer
      if (Math.random() < 0.18) {
        const m = 72 + PENTA[Math.floor(Math.random() * PENTA.length)] + (Math.random() < 0.3 ? 12 : 0);
        tone(m, t + beat / 2, beat * 3, { vol: 0.06, bell: true, out: musGain });
      }
      step++;
      if (step % 8 === 0) chordIdx = (chordIdx + 1) % CHORDS.length;
      nextNoteTime += beat;
    }
  }

  function startMusic() {
    if (!unlocked || !musicOn || !ensure() || musicTimer) return;
    nextNoteTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(scheduleMusic, 120);
  }
  function stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } }

  root.SPAudio = {
    unlock() { unlocked = true; if (ensure()) startMusic(); },
    play(name, arg) { if (!unlocked || !sfxOn || !ensure() || !SFX[name]) return; try { SFX[name](arg); } catch (e) { /* stumm */ } },
    setSfx(on) { sfxOn = on; if (sfxGain) sfxGain.gain.value = on ? 0.55 : 0; },
    setMusic(on) {
      musicOn = on;
      if (musGain) musGain.gain.value = on ? 0.22 : 0;
      if (!unlocked) return;
      if (on) startMusic(); else stopMusic();
    },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  };
})(typeof self !== 'undefined' ? self : this);
