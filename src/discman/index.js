/** Disc-Man. */

import p5 from "p5";
import {
  NEON_PALETTE, Ellipse, Rectangle, Text, Triangle, add, assert, color, easeOut, h, multiply, point,
  px, scalar, subtract, tr, transparent, tween, variable, w,
} from "#sticky";
import { KEYS, OCTAVE, Audio, Track, noteFreq } from "#audio";

/** @typedef {"north" | "east" | "south" | "west"} Direction */

/**
 * @type {Game}
 */
let game;

/**
 * ...
 * @template T
 * @param {Array<T>} array
 * @return {Array<T>}
 */
export function shuffle(array) {
  return array.map(item => /** @type {[T, number]} */ ([item, Math.random()]))
    .sort((a, b) => b[1] - a[1])
    .map(item => item[0]);
}

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

  deactivate() {
    this.activated = false;
    this.model.fill = transparent();
    this.#updateColor();
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
  // lifetime = 10;

  /**
   * @param {string} color
   */
  constructor(color) {
    super(
      new Rectangle(
        h(1 / World.GRID_SIZE / 2), h(1 / World.GRID_SIZE / 2),
        {
          orientation: tween(1 / 32, 0, World.INTERVAL, { easing: easeOut, mirror: true }),
          fill: variable(color, "color"),
        },
      ),
    );
  }

  update() {
    // this.lifetime--;
    // if (this.lifetime === 0) {
    //   game.world.despawnTail(this);
    // }
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
  /**
   * ...
   * @type {Tail[]}
   */
  tails = [];

  #energy = 0;

  /**
   * @param {string} color
   */
  constructor(color) {
    super(
      new Triangle(
        h(1 / World.GRID_SIZE / 2), h(1 / World.GRID_SIZE / 2),
        {
          orientation:
            add(scalar(1 / 2), tween(1 / 32, 0, World.INTERVAL, { easing: easeOut, mirror: true })),
          fill: variable(color, "color"),
        },
      ),
    );
    this.color = color;
  }

  /**
   * ...
   * @returns {?Cell}
   */
  plan() {
    throw new Error("Abstract method");
  }

  update() {
    const cell = game.world.getCell(this.x, this.y, Error);
    this.#energy += cell.activated ? 1 : 2;
    if (this.#energy < 2) {
      return;
    }

    const target = this.plan();
    if (target) {
      const x = this.x;
      const y = this.y;
      // const target = cells[Math.trunc(Math.random() * cells.length)];
      if (game.world.getCell(target.x, target.y)?.entity instanceof Character) {
        game.pause();
      } else {
        game.world.moveTo(this, target.x, target.y);
        this.tails.unshift(game.world.spawnTail(x, y, this.color));
        this.#energy = 0;
        if (this.tails.length > 10) {
          const tail = this.tails.pop();
          if (tail) {
            game.world.despawnTail(tail);
          }
        }
      }
    } else {
      const tail = this.tails.pop();
      if (tail) {
        game.world.despawnTail(tail);
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

  /**
   * ...
   * @param {Object} [options]
   * @param {boolean} [options.avoid]
   */
  pickRandom({ avoid = false } = {}) {
    const cells = game.world.getNeighbors(this.x, this.y).filter(
      cell => !(cell.entity instanceof Other || cell.entity instanceof Tail),
    ).map(
      (cell) => {
        let priority = game.world.getNeighbors(cell.x, cell.y)
          .filter(cell => !cell.entity || cell.entity instanceof Character).length + Math.random();
        if (avoid && !cell.activated) {
          priority += 10;
        }
        return {
          cell,
          // TODO if we would consider the direction here, we could look at the three cells ahead, if
          // any is set, we're closing the path (any of the other 6 cells would mean the path is
          // already closed)
          priority,
        };
      },
    ).sort((a, b) => b.priority - a.priority);
    return cells[0]?.cell ?? null;
  }

  /**
   * ...
   * @callback TestFunc
   * @param {Cell} cell
   * @returns {boolean}
   * @param {TestFunc} test
   * @returns {?Cell[]}
   */
  walk(test) {
    const c = game.world.getCell(this.x, this.y, Error);
    const path = [c];
    const queue = [path];
    const visited = new Set([c]);

    while (queue.length) {
      const path = queue.shift();
      assert(path);
      const current = path.at(-1);
      assert(current);
      // console.log("VISIT", current.x, current.y);
      if (test(current)) {
        return path;
      }

      let cells = game.world.getNeighbors(current.x, current.y).filter(
        cell => !(cell.entity instanceof Other || cell.entity instanceof Tail),
      );
      cells = shuffle(cells);
      for (const cell of cells) {
        if (visited.has(cell)) {
          continue;
        }
        // console.log("ADD", cell.x, cell.y);
        visited.add(cell);
        queue.push([...path, cell]);
      }
    }

    return null;
  }
}

/** ... */
class RandomOther extends Other {
  constructor() {
    super("lightMagenta");
  }

  plan() {
    return this.pickRandom();
  }
}

/** ... */
class ConfrontingOther extends Other {
  constructor() {
    super("lightCrimson");
  }

  meow = false;
  plan() {
    if (this.meow) {
      return null;
    }
    // this.meow = true;
    const path = this.walk(cell => cell.entity instanceof Character);
    return path?.[1] ?? null;
  }
}

/** ... */
class AvoidingOther extends Other {
  constructor() {
    super("lightPurple");
  }

  plan() {
    let target = null;
    if (game.world.getCell(this.x, this.y, Error).activated) {
      // for (const row of game.world.grid) {
      //   for (const cell of row) {
      //     cell.unmark();
      //   }
      // }
      const path = this.walk(cell => !cell.activated);
      // if (path) {
      //   for (const cell of path) {
      //     cell.mark();
      //   }
      // }
      target = path?.[1] ?? null;
    }
    return target ?? this.pickRandom({ avoid: true });
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
   * @type {Tail[]}
   */
  // @ts-ignore
  tails;
  /**
   * ...
   * @type {boolean}
   */
  paused = true;

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

    //          1   2   3   4
    // kick     X - x - x - x -
    // snare    - - x - - - x -
    // hisnare  - x - x - x - x

    this.#kick.play(t);
    this.#snare.play(t);
    this.#hisnare.play(t);
    this.#synth.play(t);

    this.#model.render(game.p);

    this.#debugText.content = `${game.p.frameRate().toFixed(0)} fps\n${(this.#meanDeviation * 100).toFixed(0)} %`;
  }

  #kick = new Track(
    game.audio, { bpm: World.BPM, noteValue: 8, attack: 0, frequencyRelease: true },
    { frequency: noteFreq(KEYS.C + OCTAVE), sustain: 1 }, null, noteFreq(KEYS.C + OCTAVE), null,
    noteFreq(KEYS.C + OCTAVE), null, noteFreq(KEYS.C + OCTAVE), null,
  );

  #snare = new Track(
    game.audio, { bpm: World.BPM, noteValue: 8, attack: 0, sustain: 1 / 4, noise: true },
    null, null, noteFreq(KEYS.C + 2 * OCTAVE), null,
  );

  #hisnare = new Track(
    game.audio, { bpm: World.BPM, noteValue: 8, attack: 0, sustain: 1 / 16, noise: true },
    null, noteFreq(KEYS.C + 4 * OCTAVE),
  );

  #synth = new Track(
    game.audio, { bpm: World.BPM, noteValue: 8, wave: "triangle" },
    // noteFreq(KEYS.C),
    // noteFreq(KEYS.E),
    // noteFreq(KEYS.G),
    // null,
    // noteFreq(KEYS.D),
    // noteFreq(KEYS.F),
    // noteFreq(KEYS.A),
    // null,
    // noteFreq(KEYS.C),
    // noteFreq(KEYS.E),
    // noteFreq(KEYS.G),
    // null,
    // noteFreq(KEYS.F),
    // noteFreq(KEYS.A),
    // noteFreq(KEYS.C + OCTAVE),
    // null,

    noteFreq(KEYS.C),
    noteFreq(KEYS.C + OCTAVE),
    noteFreq(KEYS.G),
    noteFreq(KEYS.E),

    noteFreq(KEYS.C + OCTAVE),
    noteFreq(KEYS.G),
    noteFreq(KEYS.E),
    null,

    noteFreq(KEYS.D),
    noteFreq(KEYS.D + OCTAVE),
    noteFreq(KEYS.F),
    noteFreq(KEYS.A),

    noteFreq(KEYS.D + OCTAVE),
    noteFreq(KEYS.F),
    noteFreq(KEYS.A),
    null,

    noteFreq(KEYS.C),
    noteFreq(KEYS.C + OCTAVE),
    noteFreq(KEYS.G),
    noteFreq(KEYS.E),

    noteFreq(KEYS.C + OCTAVE),
    noteFreq(KEYS.G),
    noteFreq(KEYS.E),
    null,

    noteFreq(KEYS.F),
    noteFreq(KEYS.A),
    noteFreq(KEYS.C + OCTAVE),
    noteFreq(KEYS.F + OCTAVE),

    null,
    null,
    null,
    null,
  );

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
   * @overload
   * @param {number} x
   * @param {number} y
   * @returns {Cell | undefined}
   * @overload
   * @param {number} x
   * @param {number} y
   * @param {ErrorConstructor} value
   * @returns {Cell}
   * @param {number} x
   * @param {number} y
   * @param {new (message: string) => Error} [value]
   * @returns {Cell | undefined}
   */
  getCell(x, y, value) {
    const cell = this.grid[y]?.[x];
    if (cell === undefined) {
      if (value !== undefined) {
        throw new value("NOOOOOO");
      }
      return value;
    }
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
    this.tails = [];

    const others = [ConfrontingOther, RandomOther, AvoidingOther];
    const n = others.length;
    const side = Math.ceil(Math.sqrt(n + 1));
    /** @type {[number, number][]} */
    let points = [];
    for (let y = 0; y < side; y++) {
      for (let x = 0; x < side; x++) {
        points.push([
          Math.trunc((x + 1 / 4 + Math.random() / 2) / side * World.GRID_SIZE),
          Math.trunc((y + 1 / 4 + Math.random() / 2) / side * World.GRID_SIZE),
        ]);
      }
    }
    points.splice(side * (side - 1), 1);
    points = shuffle(points);
    // for (const point of points) {
    //   this.getCell(point[0], point[1]).mark();
    // }
    // points[side * side - side] = [0, World.GRID_SIZE - 1];
    for (let i = 0; i < n; i++) {
      const point = points[i];
      assert(point);
      const type = others[i];
      assert(type);
      this.#spawnOther(type, point[0], point[1]);
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {string} color
   * @returns {Tail}
   */
  spawnTail(x, y, color) {
    const tail = new Tail(color);
    this.moveTo(tail, x, y);
    this.tails.push(tail);
    this.#entities.stick(tail.model);
    return tail;
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

  /**
   * @param {new () => Other} type
   * @param {number} x
   * @param {number} y
   */
  #spawnOther(type, x, y) {
    const other = new type();
    this.moveTo(other, x, y); // Math.trunc(World.GRID_SIZE / 2), Math.trunc(World.GRID_SIZE / 2));
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
        } else {
          this.grid[y]?.[x]?.deactivate();
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
  world;
  /**
   * ...
   * @type {?Screen}
   */
  overlay = null;

  constructor() {
    super();
    game = this;
    this.world = new World();

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
