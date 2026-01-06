import p5 from "p5";
import { Ellipse, Rectangle, Triangle, body, h, w } from "#sticky";

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
  /**
   * ...
   * @type {p5.Vector}
   */
  velocity = new p5.Vector();
  /**
   * ...
   * @type {p5.Vector}
   */
  acceleration = new p5.Vector();

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
class Particle extends Entity {
  /**
   * ...
   * @type {number} size
   */
  size;

  /**
   * @param {number} size
   * @param {EntityOptions} options
   */
  constructor(size, options = {}) {
    super(new Ellipse(w(size), h(size), body(0, 0), { fill: "purple" }), options);
    this.size = size;
  }
}

/**
 * ...
 */
export class World {
  // https://en.wikipedia.org/wiki/Standard_gravity
  static G = 10; // m/s^2
  /**
   * ...
   */
  // static #VIEW = 120;
  // static MAX_SPEED = Shuttle.SIZE * 4 * 2; // m/s
  // static MAX_SPEED_X = Shuttle.SIZE * 2 * 4; // m/s
  // // static ENGINE = Shuttle.SIZE * 4 / 10 * 4 * World.G;
  // static ENGINE = World.MAX_SPEED_X * 4; // g
  // evasion >= 45deg at top speed feels responsive

  // Maximum speed. Upper limit: Visual obstacle range (?) over reaction time
  // (~ 1s, see https://en.wikipedia.org/wiki/Braking_distance), for evasive maneuvers.
  static MAX_SPEED = 60;
  // Maximum lateral speed. Upper limit: Evasive maneuver distance (>= shuttle size) over simple
  // reaction time (~ 1/4 s, see https://en.wikipedia.org/wiki/Mental_chronometry), for tight
  // evasive maneuvers. 2 * shuttle size * 4 = 64
  static MAX_SPEED_X = 60;
  // Full engine acceleration. Lower limit: Maximum lateral speed over simple reaction time
  // (~ 1/4 s), i.e. breaking in reaction time, for responsive handling. Upper limit: Human
  // tolerance (~ 10 g, see https://en.wikipedia.org/wiki/G-force).
  static ENGINE = World.MAX_SPEED_X * 4;
  // Visual range. Lower limit: Maximum speed times reaction time (~ 1s), for evasive maneuvers. for
  // pixel perfect make sure its a divisor of 360p
  // dogfight distance (?)
  static #VIEW = 120;

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

    // OQ negative / positive Y?
    const dist = World.MAX_SPEED;
    const level = [...Array(50).keys()].map(
      i => ({ size: i % 2 ? 5 : 10, position: [i % 2 ? 5 : -5, -(i + 1) * dist] }),
    );
    // const level = [
    //   { size: 10, position: [-5, -50] }, { size: 5, position: [5, -100] },
    // ];
    this.particles = level.map(
      particle => new Particle(particle.size, { position: new p5.Vector(...particle.position) }),
    );

    // maps m to px
    this.camera = new Rectangle(
      h(1 / World.#VIEW), h(1 / World.#VIEW), body(0, 0), { fill: null }, this.shuttle.model,
      ...this.particles.map(particle => particle.model),
    );
    this.model = new Rectangle({ fill: "black", stroke: null }, this.camera);
  }

  /**
   * ...
   */
  render() {
    let throttleX = 0;
    let throttleY = 0;
    if (this.p.keyIsDown(this.p.UP_ARROW)) {
      throttleY -= 1;
    }
    if (this.p.keyIsDown(this.p.DOWN_ARROW)) {
      throttleY += 1;
    }
    if (this.p.keyIsDown(this.p.LEFT_ARROW)) {
      throttleX -= 1;
    }
    if (this.p.keyIsDown(this.p.RIGHT_ARROW)) {
      throttleX += 1;
    }

    const t = this.p.deltaTime / 1000;

    // https://en.wikipedia.org/wiki/Standard_gravity
    const g = 10; // m/s^2
    const MAX_SPEED = World.MAX_SPEED;
    const MAX_SPEED_X = World.MAX_SPEED_X;
    const ENGINE = World.ENGINE;

    const speedAssist = true;
    if (speedAssist) {
      const targetX = MAX_SPEED_X * throttleX;
      throttleX = (targetX - this.shuttle.velocity.x) / (ENGINE * t);
      const targetY = MAX_SPEED * throttleY;
      throttleY = (targetY - this.shuttle.velocity.y) / (ENGINE * t);
    }

    const inertia = true;
    if (inertia) {
      throttleX = Math.max(Math.min(throttleX, 1), -1);
      throttleY = Math.max(Math.min(throttleY, 1), -1);
    }

    const limit = 50;
    if (limit) {
      const lt = (-MAX_SPEED_X - this.shuttle.velocity.x) / (ENGINE * t);
      const rt = (MAX_SPEED_X - this.shuttle.velocity.x) / (ENGINE * t);
      throttleX = Math.min(Math.max(throttleX, lt), rt);
      const ft = (-MAX_SPEED - this.shuttle.velocity.y) / (ENGINE * t);
      const bt = (MAX_SPEED - this.shuttle.velocity.y) / (ENGINE * t);
      throttleY = Math.min(Math.max(throttleY, ft), bt);
    }
    // throttleX = Math.max(
    //   Math.min((Math.sign(throttleX) * MAX_SPEED - this.shuttle.velocity.x) / (ENGINE * t), throttleX), -throttleX,
    // );

    this.shuttle.acceleration = new p5.Vector(throttleX * ENGINE, throttleY * ENGINE);

    // https://en.wikipedia.org/wiki/Semi-implicit_Euler_method
    this.shuttle.velocity = p5.Vector.add(
      this.shuttle.velocity, p5.Vector.mult(this.shuttle.acceleration, t),
    );
    this.shuttle.position = p5.Vector.add(
      this.shuttle.position, p5.Vector.mult(this.shuttle.velocity, t),
    );

    const cameraOffset = 1 - Shuttle.SIZE / World.#VIEW;
    this.camera.at = body(1 / 2, cameraOffset - this.shuttle.position.y / World.#VIEW);

    this.model.render(this.p);

    this.p.fill("white");
    this.p.textSize(16);
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    const ax = this.shuttle.acceleration.x / g;
    const ay = this.shuttle.acceleration.y / g;

    const breakTimeX = MAX_SPEED_X / ENGINE;
    const breakDistanceX = (MAX_SPEED_X * MAX_SPEED_X) / (2 * ENGINE);
    const breakTime = MAX_SPEED / ENGINE;
    const breakDistance = (MAX_SPEED * MAX_SPEED) / (2 * ENGINE);

    const info = [
      `${this.p.frameRate().toFixed()} fps`,
      `${this.shuttle.velocity.y.toFixed()}m/s`,
      `${this.shuttle.velocity.x.toFixed()}m/s`,
      `${ay.toFixed()}g`,
      `${ax.toFixed()}g`,
      `b ${breakDistance.toFixed()}m ${(breakDistance / Shuttle.SIZE).toFixed(2)} ${breakTime.toFixed(2)}s`,
      `b ${breakDistanceX.toFixed()}m ${(breakDistanceX / Shuttle.SIZE).toFixed(2)} ${breakTimeX.toFixed(2)}s`,
    ];
    this.p.text(
      info.join("\n"), this.p.width - this.p.textSize(), this.p.textSize());
  }
};
