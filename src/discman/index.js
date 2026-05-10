/** Disc-Man. */

import p5 from "p5";
import {
  NEON_PALETTE, Ellipse, Rectangle, Text, h, point, px, subtract, transparent, variable, w,
} from "#sticky";
import { KEYS, OCTAVE, Audio, noteFreq } from "#audio";

/** @typedef {"north" | "east" | "south" | "west"} Direction */

/**
 * @type {Game}
 */
let game;

/** ... */
class Screen {
  /** ... */
  render() {}

  /**
   * ...
   * @param {string} key
   */
  // eslint-disable-next-line no-unused-vars
  onKeyPressed(key) {}
}

/**
 * ...
 */
class Entity {
  /**
   * ...
   * @type {number}
   */
  x = 0;
  /**
   * ...
   * @type {number}
   */
  y = 0;
  /**
   * ...
   * @type {import("#sticky").Shape}
   */
  model;

  /**
   * @param {import("#sticky").Shape} model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * ...
   * @param {number} x - ...
   * @param {number} y - ...
   */
  moveTo(x, y) {
    this.x = x;
    this.y = y;
  }
}

/**
 * ...
 */
class Cell extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super(
      new Rectangle(
        subtract(h(1 / World.GRID_SIZE), px(5)), subtract(h(1 / World.GRID_SIZE), px(5)),
        point(h((x + 1 / 2) / World.GRID_SIZE), h((y + 1 / 2) / World.GRID_SIZE)),
        { stroke: variable("darkGray", "color") },
      ),
    );
    this.moveTo(x, y);
  }
}

/** ... */
class Character extends Entity {
  constructor() {
    super(
      new Ellipse(
        h(1 / World.GRID_SIZE / 2), h(1 / World.GRID_SIZE / 2),
        { fill: variable("lightCyan", "color") },
      ),
    );
  }

  /**
   * ...
   * @param {number} x - ...
   * @param {number} y - ...
   */
  moveTo(x, y) {
    super.moveTo(x, y);
    this.model.at = point(h((x + 1 / 2) / World.GRID_SIZE), h((y + 1 / 2) / World.GRID_SIZE));
  }
}

/** ... */
class World extends Screen {
  /**
   * ...
   * @type {Cell[][]}
   */
  grid;
  /**
   * ...
   * @type {Character}
   */
  player;

  /** @type {Rectangle} */
  #model;
  #nextBeat = 0;
  #debugText = new Text(
    "", w(1), px(22), point(w(1), h(0)),
    { anchor: point(w(1), h(0)), fill: variable("white", "color"), alignment: 1 },
  );

  static GRID_SIZE = 10;
  static BPM = 120;
  static INTERVAL = 1 / (World.BPM / 60);

  constructor() {
    super();
    this.grid = [...Array(World.GRID_SIZE).keys()].map(
      y => [...Array(World.GRID_SIZE).keys()].map(x => new Cell(x, y)),
    );
    this.player = new Character();
    this.player.moveTo(0, World.GRID_SIZE - 1);

    this.#model = new Rectangle(
      { variables: { ...NEON_PALETTE }, fill: variable("black", "color"), stroke: transparent() },

      // Grid
      new Rectangle(
        h(1), ...this.grid.flatMap(row => row.map(cell => cell.model)), this.player.model,
      ),

      this.#debugText,
    );
  }

  render() {
    const t = game.p.millis() / 1000;
    this.clockShift = t - game.audio.t;
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
      beatT = (this.#nextBeat * World.INTERVAL) - this.clockShift - game.audio.t;
      if (beatT >= 0) {
        break;
      }
      // console.log("Dropping beat meh");
      this.#nextBeat++;
    }

    const latency = 2;
    if (beatT <= latency && game.audio.t) {
      const firstBeat = this.#nextBeat % 4 === 0;

      //          1   2   3   4
      // kick     X - x - x - x -
      // snare    - - x - - - x -
      // hisnare  - x - x - x - x

      // snare half beat
      if (this.#nextBeat % 1 === 0) {
        game.audio.play(
          noteFreq(KEYS.C + 4 * OCTAVE), beatT + World.INTERVAL / 2, World.INTERVAL / 2,
          { attack: 0, sustain: 1 / 16, noise: true },
        );
      }
      // snare 2 4
      if (this.#nextBeat % 2 === 1) {
        // || firstBeat
        game.audio.play(
          noteFreq(KEYS.C + 2 * OCTAVE),
          beatT - (firstBeat ? World.INTERVAL / 2 : 0), World.INTERVAL / 2,
          { attack: 0, sustain: 1 / 4 * (firstBeat ? 2 : 1), noise: true },
        );
      }
      // kick
      if (this.#nextBeat % 1 === 0) {
        game.audio.play(
          noteFreq(KEYS.C + 1 * OCTAVE), beatT, World.INTERVAL / 2,
          { attack: 0, frequencyRelease: true, sustain: 1 / 2 * (firstBeat ? 2 : 1) },
        );
      }
      this.#nextBeat++;
    }

    this.#model.render(game.p);

    this.#debugText.content = `${game.p.frameRate().toFixed(0)} fps`;
  }

  /**
   * @param {string} key
   */
  onKeyPressed(key) {
    /** @type {Object<string, Direction>} */
    const directions = {
      [game.p.UP_ARROW]: "north",
      [game.p.RIGHT_ARROW]: "east",
      [game.p.DOWN_ARROW]: "south",
      [game.p.LEFT_ARROW]: "west",
    };
    const direction = directions[key];
    if (direction) {
      this.move(direction);
    }
  }

  /**
   * ...
   * @param {Direction} direction
   */
  move(direction) {
    /** @type {Object<Direction, [number, number]>} */
    const offsets = {
      north: [0, -1],
      east: [1, 0],
      south: [0, 1],
      west: [-1, 0],
    };
    const offset = offsets[direction];
    const x = this.player.x + offset[0];
    const y = this.player.y + offset[1];
    if (x >= 0 && x < World.GRID_SIZE && y >= 0 && y < World.GRID_SIZE) {
      this.player.moveTo(x, y);
    }
  }
}

/** ... */
class Pause extends Screen {
  /** @type {import("#sticky").Shape} */
  #model = new Rectangle(
    {
      variables: { ...NEON_PALETTE },
      fill: variable("black", "color"),
      stroke: transparent(),
    },
    new Text(
      "Disc-Man",
      w(1), px(4 * 22),
      {
        at: point(w(1 / 2), px(22)),
        anchor: point(w(1 / 2), h(0)),
        fill: variable("white", "color"),
      },
    ),
    new Text(
      "Press Space to Play", w(1), px(2 * 22), point(w(1 / 2), h(2 / 3)),
      { fill: variable("white", "color") },
    ),
  );

  render() {
    this.#model.render(game.p);
  }

  /**
   * @param {string} key
   */
  onKeyPressed(key) {
    if (key === " ") {
      game.play();
    }
  }
}

/** ... */
class Game extends HTMLElement {
  /**
   * ...
   * @type {p5} p
   */
  p;
  /**
   * ...
   * @type {Audio}
   */
  audio = new Audio();
  /**
   * ...
   * @type {World}
   */
  world = new World();
  /**
   * ...
   * @type {?Pause}
   */
  overlay = new Pause();

  constructor() {
    super();
    game = this;

    this.p = new p5((p) => {
      p.setup = () => {
        p.createCanvas(640, 360);
        p.textFont("\"Noto Sans\", sans-serif");
      };

      p.draw = () => {
        this.world.render();
        if (this.overlay) {
          this.overlay.render();
        }
      };

      p.keyPressed = () => {
        if (this.overlay) {
          this.overlay.onKeyPressed(p.key);
        } else {
          this.world.onKeyPressed(p.key);
        }
      };
    });
  }

  /** ... */
  play() {
    this.overlay = null;
    this.audio.resume();
  }
}
customElements.define("discman-game", Game);
