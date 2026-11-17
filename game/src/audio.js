/** Web Audio synthesized effects and a small generative night motif. No samples. */

const NOTES = [0, 3, 5, 7, 10, 12, 15];

export function createAudio() {
  let ctx = null;
  let master = null;
  let muted = false;
  let started = false;
  let musicTimer = 0;
  let stepIndex = 0;
  let noise = null;

  function context() {
    if (ctx) return ctx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.2;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
      master = null;
    }
    return ctx;
  }

  function unlock() {
    const ac = context();
    if (!ac) return;
    if (ac.state === 'suspended') ac.resume();
    started = true;
  }

  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.2;
    if (!muted) unlock();
    return muted;
  }

  function tone(freq, duration, type, gain, delay = 0) {
    const ac = context();
    if (!ac || !master || muted) return;
    const start = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  function crackle(duration, gain) {
    const ac = context();
    if (!ac || !master || muted) return;
    if (!noise) {
      const length = Math.floor(ac.sampleRate * 0.2);
      noise = ac.createBuffer(1, length, ac.sampleRate);
      const data = noise.getChannelData(0);
      let n = 2463534242;
      for (let i = 0; i < length; i += 1) {
        n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
        data[i] = (n / 4294967296) * 2 - 1;
      }
    }
    const src = ac.createBufferSource();
    const amp = ac.createGain();
    const start = ac.currentTime;
    src.buffer = noise;
    amp.gain.setValueAtTime(gain, start);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.connect(amp);
    amp.connect(master);
    src.start(start);
    src.stop(start + duration + 0.02);
  }

  function play(name) {
    unlock();
    if (muted || !ctx) return;
    if (name === 'fire') {
      tone(720, 0.05, 'square', 0.05);
      crackle(0.04, 0.04);
    } else if (name === 'hit') {
      tone(480, 0.05, 'square', 0.04);
    } else if (name === 'kill') {
      tone(520, 0.08, 'triangle', 0.06);
      tone(780, 0.1, 'sine', 0.04, 0.04);
    } else if (name === 'dash') {
      crackle(0.09, 0.06);
      tone(180, 0.08, 'sawtooth', 0.03);
    } else if (name === 'hurt') {
      tone(110, 0.12, 'sawtooth', 0.06);
    } else if (name === 'pulse') {
      tone(220, 0.18, 'triangle', 0.06);
      tone(330, 0.2, 'sine', 0.04);
      tone(440, 0.22, 'sine', 0.03, 0.02);
    } else if (name === 'heat') {
      crackle(0.16, 0.07);
      tone(90, 0.16, 'square', 0.04);
    } else if (name === 'night') {
      tone(392, 0.14, 'sine', 0.05);
      tone(494, 0.18, 'triangle', 0.04, 0.08);
    } else if (name === 'pick') {
      tone(523, 0.1, 'triangle', 0.05);
      tone(659, 0.12, 'sine', 0.04, 0.07);
      tone(784, 0.16, 'sine', 0.04, 0.14);
    } else if (name === 'start') {
      tone(262, 0.12, 'triangle', 0.05);
      tone(392, 0.16, 'sine', 0.04, 0.08);
    } else if (name === 'dawn') {
      tone(330, 0.2, 'triangle', 0.06);
      tone(415, 0.24, 'sine', 0.05, 0.1);
      tone(494, 0.3, 'sine', 0.05, 0.2);
    } else if (name === 'dark') {
      tone(196, 0.28, 'sawtooth', 0.05);
      tone(98, 0.4, 'sine', 0.06, 0.08);
    } else if (name === 'boss') {
      tone(92, 0.42, 'sawtooth', 0.05);
      tone(138, 0.48, 'triangle', 0.045, 0.08);
      tone(184, 0.36, 'sine', 0.04, 0.16);
    } else if (name === 'crown') {
      tone(150, 0.09, 'square', 0.04);
      tone(86, 0.16, 'sawtooth', 0.03, 0.02);
    }
  }

  function update(dt, state) {
    if (!started || !ctx) return;
    musicTimer -= dt;
    if (musicTimer > 0) return;
    const night = state.night || 1;
    const dark = state.outcome === 'dark';
    const bright = state.outcome === 'dawn';
    musicTimer = (dark ? 0.72 : 0.5) - Math.min(0.16, (night - 1) * 0.02);
    const degree = NOTES[stepIndex % NOTES.length];
    const root = (bright ? 146 : 110) * (dark ? 0.75 : 1);
    tone(root * 2 ** (degree / 12), dark ? 0.5 : 0.34, 'triangle', 0.035);
    if (stepIndex % 4 === 0) tone(root / 2, 0.62, 'sine', 0.04);
    if (night >= 5 && stepIndex % 2 === 0) {
      const high = NOTES[(stepIndex + 3) % NOTES.length];
      tone(root * 2 * 2 ** (high / 12), 0.22, 'sine', 0.02);
    }
    if (state.boss && state.boss.active && stepIndex % 2 === 0) {
      tone(root * 0.5, 0.42, 'sawtooth', 0.018);
    }
    stepIndex += 1;
  }

  return {
    unlock,
    toggleMute,
    play,
    update,
    muted() {
      return muted;
    },
  };
}
