/**
 * ...
 * @param {number} n
 */
export function noteFreq(n) {
  return 2 ** ((n - 49) / 12) * 440;
}

export const KEYS = {
  C: 40,
  Cs: 41,
  D: 42,
  Ds: 43,
  E: 44,
  F: 45,
  Fs: 46,
  G: 47,
  Gs: 48,
  A: 49,
  As: 50,
  B: 51,
};

export const OCTAVE = 12;

// const K = {
//     C: oct => key(1, oct),
//     Cs: oct => key(2, oct),
//     D: oct => key(3, oct),
//     Ds: oct => key(4, oct),
//     E: oct => key(5, oct),
//     F: oct => key(6, oct),
//     Fs: oct => key(7, oct),
//     G: oct => key(8, oct),
//     Gs: oct => key(9, oct),
//     A: oct => key(10, oct),
//     As: oct => key(11, oct),
//     B: oct => key(12, oct)
// };
//
// function key(n, oct = 4) {
//     return (oct - 1) * 12 + (n - 1 + 4);
// }

export const SCALES = {
  /**
   * ...
   * @param {number} key
   */
  // eslint-disable-next-line no-unused-vars
  chromatic(key) {
    return KEYS;
  },

  /**
   * ...
   * @param {number} key
   */
  major(key) {
    // return {
    //     ...Object.entries(KEYS).filter(
    //         (_, index) => [0, 2, 4, 5, 7, 9, 11].contains(index - offset)
    //     )
    // };
    // return [key, key + 2, key + 4, key + 5, key + 7, key + 9, key + 11];
    const offset = key - KEYS.C;
    const names = Object.keys(KEYS);
    return Object.fromEntries(
      [0, 2, 4, 5, 7, 9, 11].map(i => [names[(i + offset) % OCTAVE], key + i]),
    );
  },

  /**
   * ...
   * @param {number} key
   */
  majorPentatonic(key) {
    // return [key, key + 2, key + 4, key + 7, key + 9];
    const offset = key - KEYS.C;
    const names = Object.keys(KEYS);
    return Object.fromEntries(
      [0, 2, 4, 7, 9].map(i => [names[(i + offset) % OCTAVE], key + i]),
    );
  },
};

// export const SCALES = {
//     CHROMATIC: Object.values(KEYS),
//     MAJOR: [KEYS.C, D, E, F, G, A, B],
//     MAJOR_PENTATONIC: [C, D, E, G, A]
// };

export const INSTRUMENTS = {
  PIANO: {
    attack: 0.01,
    harmonic: [0.5, 0.25],
    frequencyRelease: false,
  },
  DRUM: {
    attack: 0,
    frequencyRelease: true,
    harmonic: [],
  },
};

export class Audio {
  #context;
  #compressor;
  /** @type {AudioNode} */
  #out;
  /** @type {?BiquadFilterNode} */
  #filter = null;
  #level;

  constructor() {
    this.#context = new AudioContext();
    this.context = this.#context; // XXX
    const audio = document.createElement("audio");
    document.body.append(audio);
    // audio.src = "./song.mp3";
    // const track = context.createMediaElementSource(audio);

    this.#level = this.#context.createGain();
    this.#level.gain.value = 0.5;
    this.#level.connect(this.#context.destination);

    // const compressor = context.destination;
    this.#compressor = this.#context.createDynamicsCompressor();
    // this.#compressor.connect(this.#context.destination);
    this.#compressor.connect(this.#level);
    this.#out = this.#compressor;
  }

  /**
   * ...
   * @param {number} value - ...
   */
  set volume(value) {
    this.#level.gain.value = value;
    console.log(this.#level.gain.value);
  }

  /**
   * @param {?number} frequency
   */
  filter(frequency) {
    if (frequency === null) {
      this.#filter = null;
      this.#out = this.#compressor;
    } else {
      if (!this.#filter) {
        this.#filter = this.#context.createBiquadFilter();
        this.#filter.type = "lowpass";
        this.#filter.connect(this.#compressor);
        this.#out = this.#filter;
      }
      this.#filter.frequency.value = frequency;
    }
  }

  get t() {
    return this.#context.currentTime;
  }

  resume() {
    this.#context.resume();
  }

  playPause() {
    if (this.#context.state === "running") {
      this.#context.suspend();
    } else {
      this.#context.resume();
    }
  }

  /**
   * ...
   * @param {number} [frequency]
   * @param {number} [t]
   * @param {number} [duration]
   * @param {Object} [options]
   * @param {number} [options.attack]
   * @param {number} [options.sustain]
   * @param {?number} [options.release]
   * @param {number} [options.tremolo]
   * @param {number} [options.tremoloFrequency]
   * @param {boolean} [options.noise]
   * @param {boolean} [options.frequencyRelease]
   * @param {OscillatorType} [options.wave]
   * @param {number[]} [options.harmonic]
   */
  play(
    frequency = 440, t = 0, duration = 1,
    {
      attack = 0,
      sustain = 0.5,
      release = null,
      tremolo = 0,
      tremoloFrequency = 15,
      noise = false,
      frequencyRelease = false,
      wave = "sine",
      harmonic = [],
    } = {},
  ) {
    // let wave = "sawtooth";
    // let wave = "square";
    /** @type {OscillatorType} */
    // let wave = "sine";
    // let wave = "triangle";

    attack = Math.max(attack, 0.01);
    // OQ was 0.1, why? (maybe for release rest, but that would be too long
    attack = Math.min(attack, duration - 0.01);
    if (release === null) {
      release = duration - attack;
    }
    release = Math.max(release, 0.01);
    release = Math.min(release, duration - attack);

    t += this.#context.currentTime;
    // console.log("PLAY", t, duration, frequency, sustain);

    let src;
    if (noise) {
      const buffer = this.#context.createBuffer(
        1, duration * this.#context.sampleRate, this.#context.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      src = this.#context.createBufferSource();
      src.buffer = buffer;
      const filter = this.#context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = frequency;
      src.start(t);
      src.stop(t + duration);
      src = src.connect(filter);
    } else {
      src = this.#context.createOscillator();
      src.type = wave;
      if (frequencyRelease) {
        // src.frequency.setValueAtTime(0, t);
        // src.frequency.linearRampToValueAtTime(frequency, t + attack);
        src.frequency.setValueAtTime(frequency, t);
        // src.frequency.exponentialRampToValueAtTime(0.01, t + duration);
        src.frequency.exponentialRampToValueAtTime(1, t + duration);
        // src.frequency.linearRampToValueAtTime(0.01, t + duration);
      } else {
        src.frequency.value = frequency;
      }
      src.start(t);
      src.stop(t + duration);
    }

    const gain = this.#context.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(sustain, t + attack);
    gain.gain.setValueAtTime(sustain, t + duration - release);
    // gain.gain.linearRampToValueAtTime(0, t + duration);
    gain.gain.setTargetAtTime(0, t + duration - release, release / 5);

    if (harmonic) {
      // const every = 1;
      // for (let i = 0; i < harmonic; i++) {
      for (const [i, x] of Object.entries(harmonic)) {
        let harmon = this.#context.createOscillator();
        harmon.type = wave;
        // const n = ((i + 1) * every + 1);
        // const n = harmonic;
        const n = parseInt(i) + 2;
        if (frequencyRelease) {
          harmon.frequency.setValueAtTime(n * frequency, t);
          harmon.frequency.exponentialRampToValueAtTime(1, t + duration);
        } else {
          harmon.frequency.value = n * frequency;
        }
        harmon.start(t);
        harmon.stop(t + duration);
        const level = this.#context.createGain();
        // level.gain.value = sustain / n;
        // level.gain.value = sustain;
        level.gain.value = x;
        harmon.connect(level).connect(gain);
        // console.log("Harmonic with freq", n, harmon.frequency.value, level.gain.value);
      }
    }

    if (tremolo) {
      const lfo = this.#context.createOscillator();
      lfo.frequency.value = tremoloFrequency;
      lfo.start(t);
      lfo.stop(t + duration);
      const scale = this.#context.createGain();
      scale.gain.value = tremolo / 2; // -0.125 to 0.125
      const amp = this.#context.createGain();
      amp.gain.value = 1 - tremolo / 2; // 0.75 - 1
      lfo.connect(scale).connect(amp.gain);
      src = src.connect(amp);
    }

    src.connect(gain).connect(this.#out);

    // const src = context.createConstantSource();
    // src.start();
    // src.stop(context.currentTime + duration);
    // src.connect(gain).connect(context.destination);
  }
}

/**
 * ...
 * @typedef Note
 * @property {number} frequency
 * @property {number} sustain
 */

/** ... */
export class Track {
  /**
   * ...
   * @type {number}
   */
  bpm;
  /**
   * ...
   * @type {number}
   */
  noteValue;
  /**
   * ...
   * @type {(Note | null)[]}
   */
  notes;
  /**
   * ...
   * @type {number}
   */
  attack;
  /**
   * ...
   * @type {number}
   */
  sustain;
  /**
   * ...
   * @type {?number}
   */
  release;
  /**
   * ...
   * @type {boolean}
   */
  noise;
  /**
   * ...
   * @type {boolean}
   */
  frequencyRelease;
  /**
   * ...
   * @type {OscillatorType}
   */
  wave;
  /**
   * ...
   * @type {Audio}
   */
  audio;

  #i = 0;

  /**
   * @param {Audio} audio
   * @param {Object} options
   * @param {number} [options.bpm]
   * @param {number} [options.noteValue]
   * @param {number} [options.attack]
   * @param {number} [options.sustain]
   * @param {?number} [options.release]
   * @param {boolean} [options.noise]
   * @param {boolean} [options.frequencyRelease]
   * @param {OscillatorType} [options.wave]
   * @param {(?Note | number)[]} notes
   */
  constructor(
    audio,
    {
      bpm = 120,
      noteValue = 4,
      attack = 0,
      sustain = 0.5,
      release = null,
      noise = false,
      frequencyRelease = false,
      wave = "sine",
    } = {},
    ...notes
  ) {
    this.bpm = bpm;
    this.noteValue = noteValue;
    this.notes = notes.map(
      note => (typeof note === "number" ? { frequency: note, sustain } : note),
    );
    this.attack = attack;
    this.sustain = sustain;
    this.release = release;
    this.noise = noise;
    this.frequencyRelease = frequencyRelease;
    this.wave = wave;
    this.audio = audio;
  }

  /**
   * ...
   * @param {number} t
   */
  play(t) {
    const interval = 1 / (this.bpm / 60) / (this.noteValue / 4);
    const clockShift = t - this.audio.t;
    // console.log(
    //   "CLOCK",
    //   this.clockShift, "/",
    //   game.audio.context.getOutputTimestamp().performanceTime, performance.now(),
    //   game.audio.context.getOutputTimestamp().performanceTime - performance.now(),
    //   "/", game.audio.context.getOutputTimestamp().contextTime, game.audio.context.currentTime,
    //   game.audio.context.getOutputTimestamp().contextTime - game.audio.context.currentTime
    // );
    let beatT;
    while (true) {
      beatT = (this.#i * interval) - clockShift - this.audio.t;
      if (beatT >= 0) {
        break;
      }
      console.log("Dropping beat meh");
      this.#i++;
    }

    const latency = 2;
    if (beatT <= latency && this.audio.t) {
      const note = this.notes[this.#i % this.notes.length];
      // console.log("SCHEDULING", beatT, note);
      if (note) {
        this.audio.play(
          note.frequency, beatT, interval,
          {
            attack: this.attack,
            sustain: note.sustain,
            release: this.release,
            noise: this.noise,
            frequencyRelease: this.frequencyRelease,
            wave: this.wave,
          },
        );
      }
      this.#i++;
    }
  }
}
