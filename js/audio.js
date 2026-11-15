// Original procedural WebAudio chiptune + SFX for Mr. Toasty: Toasty Bros. No samples, no external assets.
'use strict';
const AudioSys = (function(){
  let ctx = null, master, musicBus, sfxBus, noiseBuf, pulse25, pulse12, leadBus, echoSend;
  let current = null, playing = false, step = 0, nextT = 0, timer = null, tempoMul = 1, mode = 'normal', humNodes = [];
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function init(){
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC(); } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
    // lead bus with a short "spring" echo send (World 2 surf flavor)
    leadBus = ctx.createGain(); leadBus.gain.value = 1; leadBus.connect(musicBus);
    echoSend = ctx.createGain(); echoSend.gain.value = 0; leadBus.connect(echoSend);
    const dl = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
    dl.delayTime.value = 0.15; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 2600;
    echoSend.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(musicBus);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    pulse25 = makePulse(0.25); pulse12 = makePulse(0.125);
    return true;
  }
  function makePulse(duty){
    const n = 48, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    return ctx.createPeriodicWave(re, im);
  }
  // v0.5: iOS needs resume() inside a user gesture and a (silent) sound started in that same gesture; also recover from 'interrupted'
  let primed = false;
  function unlock(){
    if (!init()) return;
    if (ctx.state === 'suspended' || ctx.state === 'interrupted'){ try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
    if (!primed){ primed = true; try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (e) {} }
  }
  function ready(){ return ctx && ctx.state === 'running'; }
  function osc(type, f0, f1, t0, dur, vol, dest, sustain){
    const o = ctx.createOscillator();
    if (type === 'p25') o.setPeriodicWave(pulse25); else if (type === 'p12') o.setPeriodicWave(pulse12); else o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(vol, t0);
    if (sustain) gn.gain.setValueAtTime(vol, t0 + dur * sustain);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(gn); gn.connect(dest || sfxBus); o.start(t0); o.stop(t0 + dur + 0.03);
    return o;
  }
  function noise(t0, dur, vol, ftype, freq, dest, f1){
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = ftype || 'highpass'; f.frequency.setValueAtTime(freq || 1000, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const gn = ctx.createGain(); gn.gain.setValueAtTime(vol, t0); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(gn); gn.connect(dest || sfxBus); s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.03);
  }
  function seq(notes, t, dt, type, vol, len){ notes.forEach((m, i) => { if (m) osc(type || 'p25', mtof(m), null, t + i * dt, len || dt * 0.95, vol || 0.2, sfxBus, 0.6); }); }

  // ---- Songs (all original). Format: lead [step, midi, len], roots per bar, minor flags, style knobs. ----
  const SONGS = {
    // "Static Breakfast" — World 1 overworld, E minor
    w1_over: { bpm: 144, steps: 128, wave: 'p25', vol: 0.17, bass: 'bounce', arp: 'late', hum: 'crt', kick: [0, 7, 8], snare: [4, 12], hat: 'odd', stab: true,
      lead: [[0,76,1],[2,71,1],[4,76,1],[5,79,1],[7,78,2],[10,76,1],[11,74,1],[13,71,3],[16,69,1],[18,71,1],[20,74,2],[23,71,1],[24,69,1],[25,67,1],[27,64,2],[30,67,2],
        [32,76,1],[34,71,1],[36,76,1],[37,79,1],[39,81,2],[42,79,1],[43,78,1],[45,76,3],[48,74,1],[50,71,1],[52,67,1],[53,69,1],[54,71,2],[57,69,1],[58,67,1],[59,66,1],[60,64,4],
        [64,67,1],[65,67,1],[67,71,1],[69,74,2],[72,79,2],[74,78,1],[75,76,1],[76,74,2],[79,71,1],[80,72,2],[83,72,1],[84,76,2],[87,79,2],[90,76,1],[91,72,1],[93,69,3],
        [96,71,1],[97,71,1],[98,71,1],[100,74,2],[103,78,2],[106,81,2],[109,78,1],[110,74,2],[112,76,1],[114,76,1],[115,75,1],[116,76,2],[119,71,1],[120,67,2],[123,64,1],[124,64,1]],
      roots: [40, 36, 45, 47, 43, 36, 38, 40], minor: [1, 0, 1, 0, 0, 0, 0, 1] },
    // "Conveyor Lullaby" — Toast Factory underground variant: slow, plucky, clanky
    w1_under: { bpm: 118, steps: 64, wave: 'triangle', vol: 0.3, bass: 'ostinato', arp: 'none', hum: 'drone', kick: [0, 8], snare: [], clank: [4, 12], hat: 'even', stab: false,
      lead: [[0,64,1],[3,67,1],[6,70,2],[10,69,1],[12,67,1],[14,64,2],[16,62,1],[19,64,1],[22,67,2],[26,64,1],[28,59,3],
        [32,64,1],[35,67,1],[38,70,2],[42,72,1],[44,70,1],[46,69,2],[48,67,1],[50,64,1],[52,62,1],[54,64,4],[60,59,1],[62,58,1]],
      roots: [40, 40, 36, 35], minor: [1, 1, 0, 0] },
    // "Acid Rain Neon" — rooftop variant: fast arps and rain hiss
    w1_sky: { bpm: 152, steps: 64, wave: 'p25', vol: 0.15, bass: 'pulse', arp: 'all', hum: 'rain', kick: [0, 6, 8, 14], snare: [4, 12], hat: 'odd', stab: true,
      lead: [[0,71,2],[2,74,2],[4,78,3],[8,76,1],[10,74,1],[12,71,4],[16,69,2],[18,71,2],[20,74,3],[24,73,1],[26,71,1],[28,66,4],
        [32,71,2],[34,74,2],[36,78,2],[38,81,3],[42,79,1],[44,78,4],[48,76,2],[50,74,2],[52,73,2],[54,71,6],[62,66,2]],
      roots: [47, 43, 38, 42], minor: [1, 0, 0, 0] },
    // "Broadcast Tower" — castle: tritone crawl
    w1_castle: { bpm: 132, steps: 64, wave: 'p25', vol: 0.15, bass: 'pulse', arp: 'none', hum: 'crt', kick: [0, 8], snare: [12], hat: 'odd', stab: true,
      lead: [[0,64,2],[2,70,2],[4,69,1],[5,68,1],[6,67,2],[8,64,2],[10,70,2],[12,71,4],[16,64,2],[18,70,2],[20,69,1],[21,68,1],[22,67,2],[24,63,2],[26,62,2],[28,64,4],
        [32,65,2],[34,71,2],[36,70,1],[37,69,1],[38,68,2],[40,65,2],[42,71,2],[44,72,4],[48,64,2],[50,70,2],[52,76,2],[54,75,2],[56,70,2],[58,69,2],[60,64,4]],
      roots: [40, 40, 41, 40], minor: [1, 1, 1, 1] },
    // "Insider Threat" — THE GLITCH boss: castle motif, faster and heavier
    w1_boss: { bpm: 170, steps: 64, wave: 'p25', vol: 0.15, bass: 'pulse', arp: 'all', hum: 'crt', kick: [0, 4, 8, 10, 12], snare: [4, 12], hat: 'all', stab: true,
      lead: [[0,64,1],[1,70,1],[2,64,1],[3,70,1],[4,69,2],[6,68,2],[8,64,1],[9,76,1],[10,75,2],[12,70,4],[16,64,1],[17,70,1],[18,64,1],[19,70,1],[20,71,2],[22,72,2],[24,71,2],[26,70,2],[28,64,4],
        [32,65,1],[33,71,1],[34,65,1],[35,71,1],[36,70,2],[38,69,2],[40,65,1],[41,77,1],[42,76,2],[44,71,4],[48,76,2],[50,75,2],[52,70,2],[54,69,2],[56,64,2],[58,63,2],[60,58,4]],
      roots: [40, 40, 41, 46], minor: [1, 1, 1, 1] },
    // ---------------- World 2: TOASTER KART (surf-rock chiptune: tremolo-picked lead + spring echo) ----------------
    // "Monday Errands" — 2-1 suburb, G major cruising tune
    w2_suburb: { bpm: 150, steps: 128, wave: 'p25', vol: 0.15, bass: 'surf', arp: 'late', hum: 'none', kick: [0, 8, 10], snare: [4, 12], hat: 'all', stab: false, trem: true, echo: 0.3, tom: [13, 14, 15],
      lead: [[0,67,2],[2,71,1],[3,74,1],[4,79,3],[8,78,1],[9,76,1],[10,74,2],[12,71,4],
        [16,72,2],[18,76,2],[20,79,2],[22,76,1],[23,74,1],[24,72,2],[26,71,2],[28,69,4],
        [32,67,2],[34,71,1],[35,74,1],[36,79,3],[40,81,1],[41,79,1],[42,78,2],[44,79,4],
        [48,74,2],[50,78,2],[52,81,4],[56,79,1],[57,78,1],[58,76,1],[59,74,1],[60,74,4],
        [64,71,2],[66,74,2],[68,76,4],[72,79,2],[74,76,2],[76,74,4],
        [80,72,2],[82,76,2],[84,79,3],[87,76,1],[88,72,2],[90,71,2],[92,72,4],
        [96,74,1],[97,74,1],[98,78,2],[100,81,2],[102,78,2],[104,79,2],[106,81,2],[108,83,4],
        [112,79,2],[114,74,2],[116,71,2],[118,74,2],[120,79,6]],
      roots: [43, 48, 43, 50, 40, 48, 50, 43], minor: [0, 0, 0, 0, 1, 0, 0, 0] },
    // "Toaster Tide" — 2-2 boardwalk & pier, E dorian surf stomp
    w2_tide: { bpm: 160, steps: 64, wave: 'p12', vol: 0.15, bass: 'surf', arp: 'none', hum: 'surf', kick: [0, 6, 8], snare: [4, 12], hat: 'odd', stab: true, trem: true, echo: 0.42, tom: [12, 13, 14, 15],
      lead: [[0,64,1],[1,64,1],[2,67,1],[3,69,1],[4,71,2],[6,69,1],[7,67,1],[8,64,2],[10,62,1],[11,64,1],[12,64,4],
        [16,64,1],[17,64,1],[18,67,1],[19,69,1],[20,71,2],[22,74,1],[23,76,1],[24,74,2],[26,71,1],[27,69,1],[28,71,4],
        [32,69,1],[33,69,1],[34,73,1],[35,76,1],[36,81,3],[39,79,1],[40,76,2],[42,73,1],[43,71,1],[44,69,4],
        [48,71,1],[49,71,1],[50,75,1],[51,78,1],[52,83,3],[55,81,1],[56,78,2],[58,75,1],[59,74,1],[60,71,4]],
      roots: [40, 40, 45, 47], minor: [1, 1, 0, 0] },
    // "Under the Pier" — 2-2 under-pier section: slow, drippy, echoey
    w2_under: { bpm: 112, steps: 64, wave: 'triangle', vol: 0.3, bass: 'ostinato', arp: 'none', hum: 'surf', kick: [0, 8], snare: [], clank: [6, 14], hat: 'even', stab: false, echo: 0.5,
      lead: [[0,69,2],[3,72,1],[4,76,3],[8,74,2],[10,72,2],[12,69,4],[16,65,2],[19,69,1],[20,72,3],[24,71,2],[26,69,2],[28,65,4],
        [32,67,2],[35,71,1],[36,74,3],[40,72,2],[42,71,2],[44,67,4],[48,68,2],[50,71,2],[52,76,6],[58,74,2],[60,71,4]],
      roots: [45, 41, 43, 40], minor: [1, 0, 0, 0] },
    // "Graveyard Shuffle" — 2-3, spooky-goofy chromatic creep in D minor
    w2_grave: { bpm: 132, steps: 64, wave: 'p12', vol: 0.15, bass: 'walk', arp: 'none', hum: 'spook', kick: [0, 8], snare: [4, 12], hat: 'even', stab: true, echo: 0.3,
      lead: [[0,62,1],[2,65,1],[4,69,1],[5,68,1],[6,67,1],[7,66,1],[8,65,2],[10,62,2],[12,74,1],[13,73,1],[14,74,2],
        [16,62,1],[18,65,1],[20,69,1],[21,70,1],[22,69,1],[23,68,1],[24,69,4],[28,57,2],[30,61,2],
        [32,58,1],[34,62,1],[36,65,1],[37,66,1],[38,65,1],[39,64,1],[40,62,2],[42,65,2],[44,70,4],
        [48,69,1],[49,68,1],[50,67,1],[51,66,1],[52,65,1],[53,64,1],[54,63,1],[55,62,1],[56,61,4],[60,64,1],[62,69,2]],
      roots: [38, 38, 34, 33], minor: [1, 1, 0, 0] },
    // "Toaster Fortress" — 2-4 junkyard bridge, E phrygian surf march
    w2_castle: { bpm: 140, steps: 64, wave: 'p25', vol: 0.15, bass: 'surf', arp: 'none', hum: 'drone', kick: [0, 3, 8, 11], snare: [4, 12], hat: 'odd', stab: true, trem: true, echo: 0.25,
      lead: [[0,64,2],[2,65,2],[4,64,1],[5,67,1],[6,65,2],[8,64,4],[12,71,2],[14,70,2],
        [16,65,2],[18,69,2],[20,72,3],[23,71,1],[24,69,2],[26,65,2],[28,64,4],
        [32,64,2],[34,65,2],[36,64,1],[37,67,1],[38,70,2],[40,71,4],[44,72,2],[46,71,2],
        [48,67,2],[50,71,2],[52,74,3],[55,72,1],[56,71,2],[58,67,2],[60,64,4]],
      roots: [40, 41, 40, 43], minor: [1, 0, 1, 0] },
    // "Grand Toaster" — boss: rumbly engine bass, pounding drums
    w2_boss: { bpm: 168, steps: 64, wave: 'p25', vol: 0.14, bass: 'rumble', arp: 'all', hum: 'rumble', kick: [0, 2, 4, 8, 10, 12], snare: [4, 12], hat: 'all', stab: true, echo: 0.15, tom: [14, 15],
      lead: [[0,64,1],[1,64,1],[2,71,1],[3,64,1],[4,70,2],[6,69,2],[8,64,1],[9,64,1],[10,67,1],[11,69,1],[12,70,4],
        [16,64,1],[17,64,1],[18,71,1],[19,64,1],[20,72,2],[22,71,2],[24,69,2],[26,67,2],[28,64,4],
        [32,60,1],[33,60,1],[34,67,1],[35,60,1],[36,72,2],[38,71,2],[40,67,1],[41,67,1],[42,69,1],[43,71,1],[44,72,4],
        [48,62,1],[49,62,1],[50,69,1],[51,62,1],[52,74,2],[54,72,2],[56,71,2],[58,69,2],[60,66,4]],
      roots: [40, 40, 36, 38], minor: [1, 1, 0, 0] },
    // ---- World 3: TOASTER PIT (all original, D minor; lo-fi creepy basement synth) ----
    // "Graffiti Basement" — half-time lo-fi: lazy triangle bass, vinyl crackle, a thin pulse lead with long echo
    w3_basement: { bpm: 84, steps: 64, wave: 'p12', vol: 0.11, bass: 'lofi', arp: 'none', hum: 'crackle', kick: [0, 10], snare: [8], hat: 'odd', echo: 0.35, pad: true,
      lead: [[0,74,3],[4,72,1],[5,70,1],[6,69,4],[12,65,2],[14,67,2],[16,70,3],[20,69,1],[21,67,1],[22,65,4],[28,62,4],
        [32,74,3],[36,77,2],[38,76,2],[40,74,4],[44,70,2],[46,72,2],[48,73,3],[52,76,1],[53,74,1],[54,73,4],[60,69,4]],
      roots: [38, 34, 36, 33], minor: [1, 0, 0, 0] },
    // "Toaster Wiring" — mains hum, clanky ostinato, nervous pulse riff
    w3_wiring: { bpm: 112, steps: 64, wave: 'p25', vol: 0.12, bass: 'ostinato', arp: 'none', hum: 'mains', kick: [0, 4, 8, 12], snare: [4, 12], hat: 'all', clank: [6, 14], echo: 0.18,
      lead: [[0,62,1],[1,65,1],[2,69,1],[3,65,1],[4,74,2],[6,73,2],[8,62,1],[9,65,1],[10,69,1],[11,65,1],[12,70,4],
        [16,62,1],[17,65,1],[18,69,1],[19,65,1],[20,74,2],[22,76,2],[24,77,2],[26,76,1],[27,74,1],[28,73,4],
        [32,65,1],[33,69,1],[34,72,1],[35,69,1],[36,77,2],[38,76,2],[40,64,1],[41,67,1],[42,70,1],[43,67,1],[44,73,4],
        [48,62,1],[49,65,1],[50,69,1],[51,65,1],[52,74,2],[54,72,2],[56,70,2],[58,69,2],[60,62,4]],
      roots: [38, 38, 41, 40], minor: [1, 1, 0, 1] },
    // "Reel Tunnels" — walking bass, crackle, spinning arpeggios late in the loop
    w3_reels: { bpm: 124, steps: 64, wave: 'p12', vol: 0.11, bass: 'walk', arp: 'late', hum: 'crackle', kick: [0, 6, 8, 14], snare: [4, 12], hat: 'odd', echo: 0.22,
      lead: [[0,69,2],[2,70,1],[3,69,1],[4,67,2],[6,65,2],[8,64,2],[10,65,2],[12,62,4],
        [16,67,2],[18,69,1],[19,67,1],[20,65,2],[22,64,2],[24,62,2],[26,64,2],[28,57,4],
        [32,69,2],[34,72,1],[35,70,1],[36,69,2],[38,67,2],[40,69,2],[42,73,2],[44,76,4],
        [48,74,2],[50,73,2],[52,70,2],[54,69,2],[56,67,2],[58,64,2],[60,62,4]],
      roots: [38, 43, 45, 38], minor: [1, 1, 0, 1] },
    // "Crumb Vault" — slow and heavy, tremolo lead, drone + pad
    w3_vault: { bpm: 96, steps: 64, wave: 'p25', vol: 0.13, bass: 'lofi', arp: 'none', hum: 'drone', kick: [0, 8], snare: [12], hat: 'odd', trem: true, echo: 0.3, pad: true,
      lead: [[0,62,4],[4,65,2],[6,64,2],[8,62,4],[12,61,4],[16,58,4],[20,62,2],[22,65,2],[24,64,8],
        [32,62,4],[36,67,2],[38,65,2],[40,64,4],[44,70,4],[48,69,4],[52,68,2],[54,67,2],[56,61,8]],
      roots: [38, 34, 31, 33], minor: [1, 0, 0, 0] },
    // "The Breadlord" — boss: tritone bass (D / G#), pounding drums, chromatic lead
    w3_boss: { bpm: 150, steps: 64, wave: 'p25', vol: 0.13, bass: 'tritone', arp: 'all', hum: 'rumble', kick: [0, 3, 8, 11], snare: [4, 12], hat: 'all', stab: true, tom: [14, 15], echo: 0.15,
      lead: [[0,62,1],[1,62,1],[2,68,2],[4,67,1],[5,65,1],[6,62,2],[8,74,2],[10,68,2],[12,69,4],
        [16,62,1],[17,62,1],[18,68,2],[20,70,1],[21,69,1],[22,68,2],[24,74,2],[26,75,2],[28,74,4],
        [32,65,1],[33,65,1],[34,71,2],[36,70,1],[37,68,1],[38,65,2],[40,77,2],[42,71,2],[44,72,4],
        [48,62,1],[49,62,1],[50,68,2],[52,69,1],[53,68,1],[54,67,2],[56,62,2],[58,68,2],[60,62,4]],
      roots: [38, 38, 44, 38], minor: [1, 1, 1, 1] },
  };
  for (const k in SONGS){ const m = {}; SONGS[k].lead.forEach(([st, n, l]) => m[st] = [n, l]); SONGS[k].leadMap = m; }
  let song = SONGS.w1_over;
  function playStep(s, t, spb){
    const bar = s >> 4, inBar = s & 15, S = song;
    const L = S.leadMap[s];
    if (L){
      const o = osc(S.wave, mtof(L[0]), null, t, spb * L[1] * 0.92, S.vol, leadBus, 0.55);
      if (S.trem && L[1] >= 2){ // surf tremolo picking: fast re-strikes that fade out
        for (let k = 1; k < L[1] * 2; k++) osc(S.wave, mtof(L[0]), null, t + k * spb * 0.5, spb * 0.42, S.vol * Math.max(0.25, 0.8 - k * 0.08), leadBus, 0.4);
      }
      if (bar === (S.roots.length - 1) && inBar >= 12) o.detune.setValueAtTime(-40, t);
      if (L[1] >= 3){ o.frequency.setValueAtTime(mtof(L[0]), t + spb * 1.5); o.frequency.linearRampToValueAtTime(mtof(L[0]) * 1.02, t + spb * L[1] * 0.9); }
    }
    if (s >= S.steps - 3){ osc('p12', mtof(88 - (s - S.steps + 3) * 5), null, t, spb * 0.5, 0.07, musicBus); }
    let root = S.roots[bar % S.roots.length]; const minor = S.minor[bar % S.minor.length];
    if (S.bass === 'bounce'){ if (inBar % 2 === 0) osc('triangle', mtof(inBar % 4 === 0 ? root : root + 12), null, t, spb * 1.6, 0.42, musicBus, 0.5); }
    else if (S.bass === 'pulse'){ if (inBar % 2 === 0) osc('triangle', mtof(root), null, t, spb * 1.4, 0.45, musicBus, 0.4); }
    else if (S.bass === 'surf'){ const sq = [0, 0, 12, 0, 7, 0, 10, 12]; if (inBar % 2 === 0) osc('triangle', mtof(root + sq[(inBar >> 1) % 8]), null, t, spb * 1.2, 0.42, musicBus, 0.35); }
    else if (S.bass === 'walk'){ const sq = [0, 7, 12, 7, 6, 5, 3, 2]; if (inBar % 2 === 0) osc('triangle', mtof(root + sq[(inBar >> 1) % 8]), null, t, spb * 1.5, 0.42, musicBus, 0.5); }
    else if (S.bass === 'rumble'){ if (inBar % 2 === 0){ const f = mtof(root - 12 + (inBar % 8 === 6 ? 1 : 0)); osc('sawtooth', f, null, t, spb * 1.8, 0.16, musicBus, 0.6); osc('triangle', f * 2, null, t, spb * 1.6, 0.4, musicBus, 0.5); } }
    else if (S.bass === 'lofi'){ if (inBar === 0 || inBar === 7 || inBar === 10) osc('triangle', mtof(root + (inBar === 7 ? 7 : inBar === 10 ? 12 : 0)), null, t, spb * 2.6, 0.42, musicBus, 0.6); }
    else if (S.bass === 'tritone'){ if (inBar % 2 === 0){ const f = mtof(root - 12 + ((inBar % 8) >= 4 ? 6 : 0)); osc('sawtooth', f, null, t, spb * 1.6, 0.14, musicBus, 0.6); osc('triangle', f * 2, null, t, spb * 1.4, 0.3, musicBus, 0.5); } }
    else if (S.bass === 'ostinato'){ const seq = [0, 7, 12, 7]; if (inBar % 2 === 0) osc('triangle', mtof(root + seq[(inBar >> 1) % 4]), null, t, spb * 1.8, 0.4, musicBus, 0.5); }
    if (S.kick.includes(inBar)) osc('sine', 150, 40, t, 0.13, 0.7, musicBus);
    if (S.snare.includes(inBar)){ noise(t, 0.11, 0.25, 'bandpass', 1900, musicBus); osc('triangle', 220, 110, t, 0.08, 0.15, musicBus); }
    if (S.clank && S.clank.includes(inBar)){ noise(t, 0.05, 0.22, 'bandpass', 5200, musicBus); osc('square', 1250, 900, t, 0.04, 0.06, musicBus); }
    if ((S.hat === 'odd' && inBar % 2 === 1) || (S.hat === 'even' && inBar % 2 === 0) || S.hat === 'all') noise(t, 0.035, inBar % 4 === 3 ? 0.08 : 0.04, 'highpass', 7500, musicBus);
    if (S.tom && (bar % 4 === 3) && S.tom.includes(inBar)) osc('triangle', 260 - (inBar - S.tom[0]) * 30, 70, t, 0.12, 0.35, musicBus);
    if (S.stab && s % 32 === 30) noise(t, 0.07, 0.13, 'bandpass', 3200, musicBus, 900);
    const tri = minor ? [0, 3, 7, 12] : [0, 4, 7, 12];
    if (S.pad && inBar === 0) for (const iv of tri.slice(0, 3)) osc('triangle', mtof(root + 24 + iv), null, t, spb * 15, 0.045, musicBus, 0.85);
    if (mode === 'star' || S.arp === 'all' || (S.arp === 'late' && s % 4 === 2 && bar >= 4)){
      osc('p12', mtof(root + 36 + tri[inBar % 4]), null, t, spb * 0.7, mode === 'star' ? 0.07 : 0.035, musicBus);
    }
  }
  function sched(){
    if (!playing || !ctx) return;
    const spb = 60 / (song.bpm * tempoMul) / 4;
    while (nextT < ctx.currentTime + 0.12){ playStep(step, nextT, spb); nextT += spb; step = (step + 1) % song.steps; }
  }
  function startHum(){
    stopHum();
    const kind = song.hum || 'crt'; const nodes = [];
    const tone = (f, v) => { const o = ctx.createOscillator(); o.frequency.value = f; const gg = ctx.createGain(); gg.gain.value = v; o.connect(gg); gg.connect(musicBus); o.start(); nodes.push(o); };
    const hiss = (type, f, v) => { const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true; const nf = ctx.createBiquadFilter(); nf.type = type; nf.frequency.value = f; const ng = ctx.createGain(); ng.gain.value = v; ns.connect(nf); nf.connect(ng); ng.connect(musicBus); ns.start(); nodes.push(ns); };
    if (kind === 'crt'){ tone(60, 0.025); tone(120, 0.012); hiss('highpass', 6000, 0.02); }
    else if (kind === 'drone'){ tone(41.2, 0.05); tone(61.7, 0.02); hiss('lowpass', 400, 0.05); }
    else if (kind === 'rain'){ tone(60, 0.012); hiss('bandpass', 2500, 0.07); hiss('highpass', 8000, 0.03); }
    else if (kind === 'surf'){ hiss('lowpass', 700, 0.045); hiss('bandpass', 300, 0.02); }
    else if (kind === 'spook'){ tone(73.4, 0.012); tone(110, 0.006); hiss('bandpass', 900, 0.012); }
    else if (kind === 'crackle'){ tone(50, 0.01); hiss('bandpass', 3200, 0.022); hiss('lowpass', 250, 0.03); }
    else if (kind === 'mains'){ tone(60, 0.03); tone(180, 0.012); tone(300, 0.005); hiss('highpass', 5000, 0.012); }
    else if (kind === 'rumble'){ tone(36.7, 0.07); tone(55, 0.025); hiss('lowpass', 160, 0.1); }
    humNodes = nodes;
  }
  function stopHum(){ humNodes.forEach(n => { try { n.stop(); } catch (e) {} }); humNodes = []; }
  function startMusic(name){
    if (!init()) return; stopMusic(); song = SONGS[name] || SONGS.w1_over; current = name; playing = true; step = 0; tempoMul = 1; mode = 'normal';
    nextT = ctx.currentTime + 0.06; echoSend.gain.setValueAtTime(song.echo || 0, ctx.currentTime); startHum(); timer = setInterval(sched, 25); sched();
  }
  function stopMusic(){ playing = false; if (timer) clearInterval(timer); timer = null; if (ctx) stopHum(); }
  function setTempo(m){ tempoMul = m; }
  function setMode(m){ mode = m; tempoMul = m === 'star' ? 1.18 : (tempoMul > 1.2 ? tempoMul : 1); }
  function pause(p){ if (!ctx) return; musicBus.gain.setTargetAtTime(p ? 0 : 0.32, ctx.currentTime, 0.02); }

  const SFX = {
    jump(big){ const t = ctx.currentTime; osc('p25', big ? 170 : 230, big ? 560 : 720, t, 0.16, 0.22); },
    stomp(){ const t = ctx.currentTime; osc('square', 520, 120, t, 0.11, 0.2); noise(t, 0.08, 0.25, 'lowpass', 1200); },
    coin(){ const t = ctx.currentTime; osc('p25', 1318.5, null, t, 0.045, 0.18); osc('p25', 1760, null, t + 0.045, 0.045, 0.18); osc('p25', 2637, null, t + 0.09, 0.22, 0.16); },
    bump(){ const t = ctx.currentTime; osc('triangle', 140, 60, t, 0.09, 0.45); noise(t, 0.05, 0.15, 'lowpass', 500); },
    brk(){ const t = ctx.currentTime; noise(t, 0.3, 0.45, 'lowpass', 3000, null, 200); osc('square', 220, 50, t, 0.18, 0.15); },
    appear(){ const t = ctx.currentTime; for (let i = 0; i < 10; i++) osc('p25', mtof(55 + i * 3), null, t + i * 0.035, 0.05, 0.13); },
    power(){ const t = ctx.currentTime; const n = [64, 68, 71, 76, 71, 76, 80, 83, 88]; seq(n, t, 0.045, 'p25', 0.17); },
    shrink(){ const t = ctx.currentTime; seq([83, 79, 76, 72, 67, 64, 60], t, 0.05, 'p25', 0.17); },
    die(){ const t = ctx.currentTime; seq([71, 0, 77, 77, 77, 76, 74, 72, 0, 64, 0, 60, 52], t + 0.3, 0.09, 'p25', 0.19); noise(t, 0.25, 0.2, 'bandpass', 2500); },
    pole(){ const t = ctx.currentTime; osc('p25', 1600, 180, t, 1.1, 0.16); osc('p12', 1210, 140, t, 1.1, 0.08); },
    oneup(){ const t = ctx.currentTime; seq([76, 79, 88, 84, 86, 91], t, 0.09, 'p25', 0.18); },
    fire(){ const t = ctx.currentTime; osc('square', 900, 300, t, 0.07, 0.12); noise(t, 0.05, 0.12, 'highpass', 3000); },
    pipe(){ const t = ctx.currentTime; for (let i = 0; i < 3; i++) osc('triangle', 300, 120, t + i * 0.09, 0.08, 0.35); },
    kick(){ const t = ctx.currentTime; osc('square', 700, 90, t, 0.14, 0.18); noise(t, 0.06, 0.2, 'bandpass', 1500); },
    splat(){ const t = ctx.currentTime; noise(t, 0.12, 0.3, 'lowpass', 900, null, 200); },
    rev(){ const t = ctx.currentTime; osc('sawtooth', 60, 140, t, 0.35, 0.1); noise(t, 0.3, 0.08, 'bandpass', 600); },
    hurry(){ const t = ctx.currentTime; seq([84, 0, 84, 0, 88, 88], t, 0.07, 'p25', 0.16); },
    tick(){ const t = ctx.currentTime; osc('p25', 1760, null, t, 0.025, 0.08); },
    pause(){ const t = ctx.currentTime; seq([76, 64, 76, 64], t, 0.06, 'p25', 0.15); },
    clear(){ const t = ctx.currentTime; seq([64, 67, 71, 76, 0, 74, 76, 79, 0, 83, 0, 88, 88, 88], t, 0.1, 'p25', 0.18, 0.18); seq([40, 0, 0, 43, 0, 0, 47, 0, 0, 52, 0, 52, 52, 52], t, 0.1, 'triangle', 0.35, 0.18); },
    gameover(){ const t = ctx.currentTime; seq([67, 0, 64, 0, 60, 0, 59, 60, 59, 55], t, 0.16, 'p25', 0.16, 0.3); },
    statics(dur){ const t = ctx.currentTime; noise(t, dur || 2.2, 0.28, 'bandpass', 1800, null, 5000); noise(t + 0.4, 0.2, 0.2, 'highpass', 4000); },
    bolt(){ const t = ctx.currentTime; osc('p12', 1800, 600, t, 0.18, 0.1); osc('square', 220, 330, t, 0.12, 0.06); },
    bite(){ const t = ctx.currentTime; osc('square', 300, 80, t, 0.08, 0.2); osc('square', 300, 80, t + 0.09, 0.08, 0.2); noise(t, 0.06, 0.2, 'bandpass', 900); },
    dive(){ const t = ctx.currentTime; osc('p25', 1400, 300, t, 0.45, 0.1); },
    crumble(){ const t = ctx.currentTime; noise(t, 0.25, 0.25, 'lowpass', 1200, null, 200); },
    zap(){ const t = ctx.currentTime; noise(t, 0.12, 0.2, 'bandpass', 4000); osc('sawtooth', 90, 60, t, 0.12, 0.06); },
    bosshit(){ const t = ctx.currentTime; noise(t, 0.2, 0.35, 'bandpass', 2600, null, 600); osc('square', 400, 100, t, 0.2, 0.18); },
    unplug(){ const t = ctx.currentTime; osc('sine', 880, 40, t, 1.0, 0.3); noise(t, 0.4, 0.3, 'bandpass', 3000, null, 300); },
    powerdown(){ const t = ctx.currentTime; osc('sine', 1200, 30, t, 1.6, 0.25); osc('triangle', 60, 30, t, 1.6, 0.3); noise(t, 1.2, 0.25, 'bandpass', 4000, null, 200); },
    roar(){ const t = ctx.currentTime; noise(t, 0.8, 0.3, 'bandpass', 1500, null, 4000); osc('sawtooth', 70, 140, t, 0.8, 0.1); osc('sawtooth', 73, 150, t, 0.8, 0.08); },
    warp(){ const t = ctx.currentTime; for (let i = 0; i < 12; i++) osc('p25', mtof(84 - i * 3), null, t + i * 0.05, 0.06, 0.12); },
    worldclear(){ const t = ctx.currentTime; seq([64, 67, 71, 76, 79, 83, 88, 0, 86, 88, 91, 0, 88, 0, 0, 0, 76, 79, 83, 88], t, 0.11, 'p25', 0.18, 0.2); seq([40, 0, 47, 0, 52, 0, 55, 0, 50, 0, 55, 0, 52, 0, 0, 0, 40, 0, 47, 52], t, 0.11, 'triangle', 0.35, 0.2); },
    // World 2
    honk(){ const t = ctx.currentTime; osc('square', 392, null, t, 0.14, 0.12); osc('square', 330, null, t, 0.14, 0.1); osc('square', 392, null, t + 0.18, 0.22, 0.12); osc('square', 330, null, t + 0.18, 0.22, 0.1); },
    boost(){ const t = ctx.currentTime; osc('p25', 300, 1400, t, 0.3, 0.14); noise(t, 0.3, 0.12, 'bandpass', 1200, null, 4000); },
    splash(){ const t = ctx.currentTime; noise(t, 0.4, 0.3, 'lowpass', 2500, null, 300); osc('sine', 500, 120, t, 0.2, 0.15); },
    plank(){ const t = ctx.currentTime; osc('square', 180, 120, t, 0.12, 0.08); osc('square', 150, 90, t + 0.1, 0.1, 0.06); },
    lightbar(){ const t = ctx.currentTime; seq([72, 79, 84, 79, 84, 91, 96], t, 0.04, 'p25', 0.16); noise(t, 0.4, 0.1, 'highpass', 5000); },
    lever(){ const t = ctx.currentTime; osc('square', 900, 200, t, 0.08, 0.15); osc('sine', 1568, null, t + 0.06, 0.5, 0.2); },
    ding(){ const t = ctx.currentTime; osc('sine', 1568, null, t, 1.2, 0.25); osc('sine', 3136, null, t, 0.6, 0.08); },
    bone(){ const t = ctx.currentTime; for (let i = 0; i < 4; i++) osc('square', 800 + i * 140, 500, t + i * 0.04, 0.03, 0.08); },
    launch(){ const t = ctx.currentTime; noise(t, 0.35, 0.22, 'bandpass', 900, null, 3000); osc('sawtooth', 120, 400, t, 0.3, 0.06); },
    sizzle(){ const t = ctx.currentTime; noise(t, 0.5, 0.16, 'highpass', 3500); },
    // v0.4 bro overhaul (all original synth sounds)
    boom(){ const t = ctx.currentTime; noise(t, 0.5, 0.5, 'lowpass', 1800, null, 90); osc('triangle', 120, 30, t, 0.45, 0.45); osc('square', 80, 30, t, 0.2, 0.12); },
    bigboom(){ const t = ctx.currentTime; noise(t, 0.9, 0.6, 'lowpass', 2400, null, 60); osc('triangle', 90, 22, t, 0.8, 0.5); osc('sawtooth', 60, 25, t, 0.5, 0.1); },
    shot(){ const t = ctx.currentTime; noise(t, 0.06, 0.25, 'bandpass', 2400); osc('square', 600, 180, t, 0.05, 0.08); },
    shotgun(){ const t = ctx.currentTime; noise(t, 0.18, 0.4, 'lowpass', 2600, null, 400); osc('square', 220, 60, t, 0.12, 0.14); },
    snipe(){ const t = ctx.currentTime; noise(t, 0.08, 0.35, 'highpass', 2000); osc('sawtooth', 1800, 200, t, 0.22, 0.1); osc('sine', 3000, 2200, t + 0.03, 0.3, 0.05); },
    paper(){ const t = ctx.currentTime; noise(t, 0.09, 0.18, 'highpass', 5000); osc('p12', 1200, 1500, t, 0.05, 0.05); },
    spray(){ const t = ctx.currentTime; noise(t, 0.05, 0.16, 'bandpass', 3200); },
    shriek(){ const t = ctx.currentTime; osc('sawtooth', 1400, 2600, t, 0.25, 0.08); osc('square', 1900, 3200, t, 0.25, 0.05); noise(t, 0.25, 0.12, 'highpass', 4000); },
    curse(){ const t = ctx.currentTime; seq([60, 59, 58, 57, 56, 55, 54, 48], t, 0.07, 'p25', 0.16); noise(t, 0.8, 0.2, 'bandpass', 800, null, 3000); },
    turret(){ const t = ctx.currentTime; osc('square', 1300, 900, t, 0.04, 0.07); },
    slam(){ const t = ctx.currentTime; osc('triangle', 220, 40, t, 0.35, 0.5); noise(t, 0.4, 0.45, 'lowpass', 1200, null, 80); },
    dash(){ const t = ctx.currentTime; osc('sawtooth', 90, 300, t, 0.3, 0.12); noise(t, 0.3, 0.2, 'bandpass', 700, null, 2400); },
    freed(){ const t = ctx.currentTime; seq([72, 76, 79, 84, 0, 79, 84, 88, 91], t, 0.06, 'p25', 0.18); seq([48, 0, 55, 0, 60, 0, 55, 60, 67], t, 0.06, 'triangle', 0.3); },
    wallkick(){ const t = ctx.currentTime; osc('p25', 330, 900, t, 0.1, 0.16); noise(t, 0.04, 0.12, 'bandpass', 1800); },
    ammo(){ const t = ctx.currentTime; seq([67, 74, 79, 86], t, 0.05, 'p25', 0.17); },
    roll(){ const t = ctx.currentTime; for (let i = 0; i < 5; i++) osc('triangle', 260 - i * 20, 180, t + i * 0.04, 0.035, 0.18); },
    melee(){ const t = ctx.currentTime; osc('square', 260, 90, t, 0.07, 0.16); noise(t, 0.05, 0.18, 'bandpass', 1200); },
    chomp(){ const t = ctx.currentTime; osc('square', 360, 90, t, 0.07, 0.2); osc('square', 360, 90, t + 0.08, 0.07, 0.2); },
    hit(){ const t = ctx.currentTime; osc('square', 500, 260, t, 0.04, 0.1); },
    clang(){ const t = ctx.currentTime; osc('square', 1500, 1400, t, 0.12, 0.08); osc('square', 2200, 2100, t, 0.1, 0.05); },
    alarm(){ const t = ctx.currentTime; for (let i = 0; i < 4; i++){ osc('square', 880, null, t + i * 0.3, 0.14, 0.1); osc('square', 660, null, t + i * 0.3 + 0.15, 0.14, 0.1); } },
    rifle(){ const t = ctx.currentTime; noise(t, 0.08, 0.25, 'bandpass', 1600); osc('square', 420, 140, t, 0.07, 0.08); },
    spark(){ const t = ctx.currentTime; noise(t, 0.18, 0.22, 'bandpass', 5200); osc('square', 2400, 600, t, 0.12, 0.06); },
    beep(){ const t = ctx.currentTime; osc('square', 3100, null, t, 0.05, 0.07); },
    squeak(){ const t = ctx.currentTime; osc('square', 900, 1700, t, 0.08, 0.08); },
    reel(){ const t = ctx.currentTime; for (let i = 0; i < 8; i++) osc('p12', 700 + (i % 2) * 200, null, t + i * 0.035, 0.025, 0.06); },
    reelstop(){ const t = ctx.currentTime; osc('square', 520, 260, t, 0.07, 0.14); noise(t, 0.05, 0.15, 'lowpass', 1400); },
    burn(){ const t = ctx.currentTime; noise(t, 1.4, 0.25, 'bandpass', 1200, null, 400); osc('sawtooth', 110, 55, t, 1.2, 0.06); },
    magnet(){ const t = ctx.currentTime; for (let i = 0; i < 6; i++) osc('p25', 600 + i * 180, null, t + i * 0.04, 0.05, 0.12); },
    boing(){ const t = ctx.currentTime; osc('triangle', 180, 720, t, 0.22, 0.35); osc('p25', 360, 1100, t, 0.16, 0.08); },
    start(){ const t = ctx.currentTime; seq([64, 71, 76, 83], t, 0.06, 'p25', 0.16); noise(t, 0.2, 0.12, 'bandpass', 2600); },
  };
  function sfx(name, arg){ if (!ready()) return; try { SFX[name](arg); } catch (e) { /* ignore audio errors */ } }
  return { unlock, startMusic, stopMusic, setTempo, setMode, pause, sfx, get ctx(){ return ctx; }, isPlaying: () => playing, current: () => current, songs: () => Object.keys(SONGS) };
})();
