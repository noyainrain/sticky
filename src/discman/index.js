/** Disc-Man. */

import p5 from "p5";
import { NEON_PALETTE, Rectangle, transparent, variable } from "#sticky";

/**
 * @type {Game}
 */
let game;

/** ... */
class Screen {
  /** ... */
  render() {}
}

/** ... */
class World extends Screen {
  /** @type {Rectangle} */
  #model;

  constructor() {
    super();
    this.#model = new Rectangle(
      { variables: { ...NEON_PALETTE }, fill: variable("black", "color"), stroke: transparent() },
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
