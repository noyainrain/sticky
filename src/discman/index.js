/** Disc-Man. */

import p5 from "p5";
import { NEON_PALETTE, Rectangle, h, point, px, subtract, transparent, variable } from "#sticky";

/**
 * @type {Game}
 */
let game;

/** ... */
class Screen {
  /** ... */
  render() {}
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
class World extends Screen {
  /**
   * ...
   * @type {Cell[][]}
   */
  grid;

  /** @type {Rectangle} */
  #model;

  static GRID_SIZE = 10;

  constructor() {
    super();
    this.grid = [...Array(World.GRID_SIZE).keys()].map(
      y => [...Array(World.GRID_SIZE).keys()].map(x => new Cell(x, y)),
    );

    this.#model = new Rectangle(
      { variables: { ...NEON_PALETTE }, fill: variable("black", "color"), stroke: transparent() },

      // Grid
      new Rectangle(
        h(1),
        ...this.grid.flatMap(row => row.map(cell => cell.model)),
      ),
    );
  }

  render() {
    this.#model.render(game.p);
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
   * @type {World}
   */
  world = new World();

  constructor() {
    super();
    game = this;

    this.p = new p5((p) => {
      p.setup = () => {
        p.createCanvas(640, 360);
      };

      p.draw = () => {
        this.world.render();
      };
    });
  }
}
customElements.define("discman-game", Game);
