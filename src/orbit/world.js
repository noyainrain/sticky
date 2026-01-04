import p5 from "p5";
import { Rectangle, Triangle, body, h, w } from "#sticky";

/**
 * ...
 * @typedef EntityOptions
 * @property {p5.Vector} [position]
 */

/**
 * ...
 */
class Entity {
  /**
   * ...
   * @type {import("#sticky").Shape}
   */
  model;

  #position = new p5.Vector();

  /**
   * @param {import("#sticky").Shape} model
   * @param {EntityOptions} [options]
   */
  constructor(model, { position = new p5.Vector() } = {}) {
    this.model = model;
    this.position = position;
  }

  get position() {
    return this.#position;
  }

  set position(value) {
    this.#position = value;
    this.model.at = body(value.x, value.y);
  }
}

/**
 * ...
 */
class Shuttle extends Entity {
  // Reference https://en.wikipedia.org/wiki/SpaceX_Dragon_2
  /**
   * ...
   * @type {number}
   */
  static SIZE = 8;

  /**
   * @param {EntityOptions} [options]
   */
  constructor(options = {}) {
    super(new Triangle(w(Shuttle.SIZE), h(Shuttle.SIZE), body(0, 0), { fill: "blue" }), options);
  }
}

/**
 * ...
 */
export class World {
  // speed * reaction = 50m/s * 1s = 50m; for pixel perfect make sure its a divisor of 360p
  /**
   * ...
   */
  static #VIEW = 60;

  /**
   * ...
   * @type {p5}
   */
  p;

  /**
   * @param {p5} p
   */
  constructor(p) {
    this.p = p;
    this.shuttle = new Shuttle();
    // maps m to px
    this.camera = new Rectangle(
      h(1 / World.#VIEW), h(1 / World.#VIEW), body(0, 0), { fill: null }, this.shuttle.model,
    );
    this.model = new Rectangle({ fill: "black", stroke: null }, this.camera);
  }

  /**
   * ...
   */
  render() {
    const cameraOffset = 1 - Shuttle.SIZE / World.#VIEW;
    this.camera.at = body(1 / 2, cameraOffset);

    this.model.render(this.p);
  }
};
