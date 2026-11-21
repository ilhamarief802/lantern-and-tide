// Sound made on the spot with the Web Audio API: no audio files, no network, and silence until the
// player's first gesture (browsers refuse to start audio before one). Every cue is a short, soft bell.

const CUES = {
  found: { notes: [660, 880, 1180], length: 0.16, type: 'triangle', gain: 0.16 },
  miss: { notes: [220, 174], length: 0.13, type: 'sawtooth', gain: 0.10 },
  hint: { notes: [520, 620], length: 0.14, type: 'sine', gain: 0.10 },
  level: { notes: [523, 659, 784, 1046], length: 0.19, type: 'triangle', gain: 0.15 },
  over: { notes: [392, 330, 262], length: 0.26, type: 'sine', gain: 0.14 },
  click: { notes: [880], length: 0.05, type: 'sine', gain: 0.07 },
};

export function createAudio() {
  let context = null;
  let muted = readMuted();

  function ensure() {
    if (context) return context;
    const Audio = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!Audio) return null;
    try {
      context = new Audio();
    } catch {
      context = null;
    }
    return context;
  }

  function play(name) {
    if (muted) return;
    const cue = CUES[name];
    const audio = ensure();
    if (!cue || !audio) return;
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    const start = audio.currentTime + 0.01;
    cue.notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const at = start + index * cue.length * 0.62;
      oscillator.type = cue.type;
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(cue.gain, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + cue.length);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(at);
      oscillator.stop(at + cue.length + 0.02);
    });
  }

  return {
    play,
    /** Called on the first pointer or key event: the gesture that lets audio start. */
    unlock() {
      const audio = ensure();
      if (audio && audio.state === 'suspended') audio.resume().catch(() => {});
    },
    toggleMute() {
      muted = !muted;
      writeMuted(muted);
      return muted;
    },
    get muted() {
      return muted;
    },
  };
}

function readMuted() {
  try {
    return globalThis.localStorage?.getItem('lantern-and-tide.muted') === '1';
  } catch {
    return false;
  }
}

function writeMuted(value) {
  try {
    globalThis.localStorage?.setItem('lantern-and-tide.muted', value ? '1' : '0');
  } catch {
    // Storage is optional: a muted browser just forgets the setting.
  }
}
