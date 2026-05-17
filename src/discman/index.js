/** Disc-Man. */

import p5 from "p5";
import {
  NEON_PALETTE, Ellipse, Rectangle, Text, Triangle, add, assert, color, easeOut, h, multiply, point,
  px, subtract, tr, transparent, tween, variable, w,
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
   * ...
   * @type {?Entity}
   */
  entity = null;
  /** ... */
  activated = false;
  /**
   * ...
   * @type {boolean}
   */
  marked = false;

  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    super(
      new Rectangle(
        subtract(h(1 / World.GRID_SIZE), px(5)), subtract(h(1 / World.GRID_SIZE), px(5)),
        point(h((x + 1 / 2) / World.GRID_SIZE), h((y + 1 / 2) / World.GRID_SIZE)),
        { stroke: variable("color", "color") },
      ),
    );
    this.moveTo(x, y);
    this.#updateColor();
  }

  /**
   * ...
   */
  mark() {
    this.marked = true;
    this.#updateColor();
  }

  /**
   * ...
   */
  unmark() {
    this.marked = false;
    this.#updateColor();
  }

  #updateColor() {
    this.model.setVariable(
      "color",
      this.marked
        ? variable("lightRed", "color")
        : (this.activated ? variable("lightCyan", "color") : variable("darkGray", "color")),
    );
  }

  activate() {
    this.activated = true;
    this.#updateColor();
    // this.model.fill = radialGradient(
    //   color(
    //     tr(3 / 6), 1, 1 / 2, { alpha: tween(1 / 2, 1 / 3, World.INTERVAL, { easing: easeOut }) },
    //   ),
    //   color(tr(3 / 6), 1, 1 / 2, { alpha: 1 / 2 }),
    // );
    this.model.fill = color(
      tr(3 / 6), 1, 1 / 2, { alpha: tween(1 / 2, 1 / 3, World.INTERVAL, { easing: easeOut }) },
    );
  }
}

/** ... */
class Character extends Entity {
  constructor() {
    super(
      new Ellipse(
        h(1 / World.GRID_SIZE / 2),
        multiply(h(1 / World.GRID_SIZE / 2), tween(7 / 8, 1, World.INTERVAL, { easing: easeOut })),
        { anchor: point(w(1 / 2), h(1)), fill: variable("lightCyan", "color") },
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
    this.model.at = point(
      h((x + 1 / 2) / World.GRID_SIZE),
      add(
        h((y + 1 / 2) / World.GRID_SIZE),
        h(1 / World.GRID_SIZE / 2 / 2),
        tween(h(1 / World.GRID_SIZE / 2 / 8), 0, World.INTERVAL, { easing: easeOut }),
      ),
    );
  }
}

/** ... */
class Tail extends Entity {
  // XXX
  lifetime = 10;

  constructor() {
    super(
      new Rectangle(
        h(1 / World.GRID_SIZE / 2), h(1 / World.GRID_SIZE / 2),
        { fill: variable("lightMagenta", "color") },
      ),
    );
  }

  update() {
    this.lifetime--;
    if (this.lifetime === 0) {
      game.world.despawnTail(this);
    }
  }

  /**
   * @param {number} x - ...
   * @param {number} y - ...
   */
  moveTo(x, y) {
    super.moveTo(x, y);
    this.model.at = point(
      h((x + 1 / 2) / World.GRID_SIZE),
      h((y + 1 / 2) / World.GRID_SIZE),
    );
  }
}

/** ... */
class Other extends Entity {
  constructor() {
    super(
      new Triangle(
        h(1 / World.GRID_SIZE / 2), h(1 / World.GRID_SIZE / 2),
        { fill: variable("lightMagenta", "color") },
      ),
    );
  }

  update() {
    const cells = game.world.getNeighbors(this.x, this.y).filter(
      cell => !(cell.entity instanceof Other || cell.entity instanceof Tail),
    ).map(
      cell => ({
        cell,
        // TODO if we would consider the direction here, we could look at the three cells ahead, if
        // any is set, we're closing the path (any of the other 6 cells would mean the path is
        // already closed)
        priority:
          game.world.getNeighbors(cell.x, cell.y)
            .filter(cell => !cell.entity || cell.entity instanceof Character).length + Math.random(),
      }),
    ).sort((a, b) => b.priority - a.priority);

    if (cells.length) {
      const x = this.x;
      const y = this.y;
      // const target = cells[Math.trunc(Math.random() * cells.length)];
      const target = cells[0];
      assert(target);
      if (game.world.getCell(target.cell.x, target.cell.y)?.entity instanceof Character) {
        game.pause();
      } else {
        game.world.moveTo(this, target.cell.x, target.cell.y);
        game.world.spawnTail(x, y);
      }
    }
  }

  /**
   * @param {number} x - ...
   * @param {number} y - ...
   */
  moveTo(x, y) {
    super.moveTo(x, y);
    this.model.at = point(
      h((x + 1 / 2) / World.GRID_SIZE),
      h((y + 1 / 2) / World.GRID_SIZE),
    );
  }
}

/**
 * @typedef Hit
 * @property {?boolean} hit
 * @property {?number} deviation
 */

/** ... */
class World extends Screen {
  /**
   * ...
   * @type {Cell[][]}
   */
  // @ts-ignore
  grid;
  /**
   * ...
   * @type {Character}
   */
  // @ts-ignore
  player;
  /**
   * ...
   * @type {Other[]}
   */
  // @ts-ignore
  others;
  /**
   * ...
   * @type {Other[]}
   */
  // @ts-ignore
  tails;
  /**
   * ...
   * @type {boolean}
   */
  paused = true;

  #nextBeat = 0;
  #beatWindow = 0;
  /** @type {Hit[]} */
  #hits = [{ hit: null, deviation: null }];
  #meanDeviation = 0;
  /** @type {Rectangle} */
  #entities = new Rectangle(h(1));
  /** @type {Rectangle} */
  #model;
  #debugText = new Text(
    "", w(1), px(22), point(w(1), h(0)),
    { anchor: point(w(1), h(0)), fill: variable("white", "color"), alignment: 1 },
  );

  static GRID_SIZE = 10;
  static BPM = 120;
  static INTERVAL = 1 / (World.BPM / 60);

  /** @type {Object<Direction, [number, number]>} */
  static #OFFSETS = {
    north: [0, -1],
    east: [1, 0],
    south: [0, 1],
    west: [-1, 0],
  };

  constructor() {
    super();
    this.#model = new Rectangle(
      { variables: { ...NEON_PALETTE }, fill: variable("black", "color"), stroke: transparent() },
      this.#entities, this.#debugText,
    );
  }

  update() {
    for (const tail of this.tails) {
      tail.update();
    }
    for (const other of this.others) {
      other.update();
    }
  }

  render() {
    if (!game.overlay) {
      const activated = this.grid.flat().reduce((sum, cell) => sum + (cell.activated ? 1 : 0), 0);
      if (activated === World.GRID_SIZE * World.GRID_SIZE) {
        game.rollCredits();
      }
    }

    const t = game.p.millis() / 1000;
    const beat = t / World.INTERVAL;
    if (beat - this.#beatWindow >= 0.5) {
      this.#beatWindow++;
      this.#hits.unshift({ hit: null, deviation: null });
      if (this.#hits.length >= 16) {
        this.#hits.pop();
      }
      const stats = this.#hits.filter(hit => hit.deviation !== null).map(hit => hit.deviation ?? 0);
      if (stats.length) {
        this.#meanDeviation = stats.reduce((sum, deviation) => sum + deviation) / stats.length;
      } else {
        this.#meanDeviation = 0;
      }

      if (!game.overlay) {
        this.update();
      }
    }

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

    // function snare(beat) {
    //   return {freq: x};
    // }

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

    this.#debugText.content = `${game.p.frameRate().toFixed(0)} fps\n${(this.#meanDeviation * 100).toFixed(0)} %`;
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
   * @param {number} x
   * @param {number} y
   * @returns {Cell | undefined}
   */
  getCell(x, y) {
    const cell = this.grid[y]?.[x];
    // if (cell === undefined) {
    //   throw new Error("NOOOOOO");
    // }
    return cell;
  }

  /**
   * ...
   * @param {number} x
   * @param {number} y
   * @return {Cell[]}
   */
  getNeighbors(x, y) {
    return Object.values(World.#OFFSETS).map(
      offset => this.getCell(x + offset[0], y + offset[1]),
    ).filter(cell => cell !== undefined);
  }

  start() {
    if (this.grid) {
      this.#entities.unstick(...this.grid.flatMap(row => row.map(cell => cell.model)));
    }
    if (this.player) {
      this.#entities.unstick(this.player.model);
    }
    if (this.others) {
      this.#entities.unstick(...this.others.map(other => other.model));
    }
    if (this.tails) {
      this.#entities.unstick(...this.tails.map(tail => tail.model));
    }

    this.grid = [...Array(World.GRID_SIZE).keys()].map(
      y => [...Array(World.GRID_SIZE).keys()].map(x => new Cell(x, y)),
    );
    this.#entities.stick(...this.grid.flatMap(row => row.map(cell => cell.model)));
    this.player = new Character();
    this.moveTo(this.player, 0, World.GRID_SIZE - 1);
    this.#entities.stick(this.player.model);

    this.others = [];
    this.#spawnOther();
    this.tails = [];
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  spawnTail(x, y) {
    const tail = new Tail();
    this.moveTo(tail, x, y);
    this.tails.push(tail);
    console.log("TAILS", this.tails.length, this.tails);
    this.#entities.stick(tail.model);
  }

  /**
   * @param {Tail} tail
   */
  despawnTail(tail) {
    this.tails.splice(this.tails.indexOf(tail), 1);
    this.#entities.unstick(tail.model);

    let cell = this.grid[tail.y]?.[tail.x];
    assert(cell);
    cell.entity = null;
  }

  #spawnOther() {
    const other = new Other();
    this.moveTo(other, Math.trunc(World.GRID_SIZE / 2), Math.trunc(World.GRID_SIZE / 2));
    this.others.push(other);
    this.#entities.stick(other.model);
  }

  /**
   * @param {Entity} entity
   * @param {number} x
   * @param {number} y
   */
  moveTo(entity, x, y) {
    let cell = this.grid[entity.y]?.[entity.x];
    assert(cell);
    cell.entity = null;
    cell = this.grid[y]?.[x];
    assert(cell);
    cell.entity = entity;
    entity.moveTo(x, y);
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
      if (this.grid[y]?.[x]?.entity instanceof Other || this.grid[y]?.[x]?.entity instanceof Tail) {
        game.pause();
      } else {
        this.moveTo(this.player, x, y);

        // const t = game.audio.t;
        const t = game.p.millis() / 1000;
        // const diff1 = t - Math.floor(t / World.INTERVAL) * World.INTERVAL;
        // const diff2 = Math.abs(t - Math.ceil(t / World.INTERVAL) * World.INTERVAL);
        // const diff = Math.min(diff1, diff2);
        const diff = Math.abs(t - (this.#beatWindow * World.INTERVAL));
        const rel = diff / World.INTERVAL;

        const hit = this.#hits[0];
        assert(hit);
        if (hit.hit === null) {
          hit.hit = rel < 1 / 2 / 2;
          hit.deviation = rel;
        } else {
          hit.hit = false;
        }
        if (hit.hit) {
          this.grid[y]?.[x]?.activate();
        }
      }
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
class Credits extends Screen {
  #model = new Rectangle(
    {
      variables: { ...NEON_PALETTE },
      fill: variable("black", "color"),
      stroke: transparent(),
    },
    new Text(
      "Fin", w(1), px(4 * 22),
      {
        at: point(w(1 / 2), px(22)),
        anchor: point(w(1 / 2), h(0)),
        fill: variable("white", "color"),
      },
    ),
    new Text("Thank you for playing!", w(1), px(2 * 22), { fill: variable("white", "color") }),
    new Text(
      "Press Space to Continue", w(1), px(2 * 22),
      {
        at: point(w(1 / 2), subtract(h(1), px(22))),
        anchor: point(w(1 / 2), h(1)),
        fill: variable("white", "color"),
      },
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
      game.pause();
    }
  }
};

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
   * @type {?Screen}
   */
  overlay = null;

  constructor() {
    super();
    game = this;

    this.pause();

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
    this.#showOverlay(null);
    this.audio.resume();
    this.world.start();
  }

  /** ... */
  pause() {
    this.#showOverlay(new Pause());
  }

  /** ... */
  rollCredits() {
    this.#showOverlay(new Credits());
  }

  /**
   * @param {?Screen} overlay
   */
  #showOverlay(overlay) {
    this.overlay = overlay;
    this.audio.volume = overlay ? 1 / 8 : 1 / 2;
  }
}
customElements.define("discman-game", Game);
