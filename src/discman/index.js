/** Disc-Man. */

import p5 from "p5";

/** ... */
class Game extends HTMLElement {
  /**
   * ...
   * @type {p5} p
   */
  p;

  constructor() {
    super();
    this.p = new p5((p) => {
      p.setup = () => {
        p.createCanvas(640, 360);
      };

      p.draw = () => {
      };
    });
  }
}
customElements.define("discman-game", Game);
