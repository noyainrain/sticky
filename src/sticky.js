/** Library for describing and rendering 2D models made entirely of simple shapes. */

import p5 from "p5";

/** TODO. */
export const AUTO = Symbol();

/**
 * ...
 * @param {unknown} condition
 * @returns {asserts condition}
 */
export function assert(condition) {
  if (!condition) {
    throw new Error("Assertion failed");
  }
}

/**
 * @template T
 * @typedef {new (...args: never[]) => T} Constructor
 */

/**
 * @template T
 * @typedef {
     T extends Constructor<infer R>
       ? R
       : T extends "number"
         ? number
         : T extends "string"
           ? string
           : never
  } ConcreteType
 */

/**
 * @template T
 * @callback TestCallback
 * @param {T} arg
 * @returns {boolean}
 */

// no callback bc typescript @template doesn't support generic function signature
/**
 * @typedef {
     <T extends Constructor<unknown> | "number">(type: T, test?: TestCallback<ConcreteType<T>>)
       => IteratorResult<ConcreteType<T> | undefined, ConcreteType<T> | undefined>
   } NextCallback
 */

/**
 * ...
 * @param {unknown[]} values
 * @returns {NextCallback}
 */
export function argumentStream(values) {
  let i = 0;
  /**
   * @template {Constructor<unknown> | "number"} T
   * @param {T} type
   * @param {TestCallback<ConcreteType<T>>} [test]
   * @returns {IteratorResult<ConcreteType<T> | undefined, ConcreteType<T> | undefined>}
   */
  return (type, test) => {
    const arg = values[i];
    if (arg === undefined) {
      return { value: undefined, done: true };
    }
    let value;
    if (
      (
        (type === "number" && typeof arg === type)
        || (type !== "number" && arg instanceof /** @type {Constructor<unknown>} */ (type))
      )
      && (!test || test(/** @type {ConcreteType<T>} */ (arg)))
    ) {
      value = /** @type {ConcreteType<T>} */ (arg);
      i++;
    }
    return { value, done: false };
  };
}

/**
 * Viewport point.
 * @typedef Point
 * @property {number} x - Horizontal distance in pixels.
 * @property {number} y - Vertical distance in pixels.
 */

/**
 * Result type of each dynamic value type.
 * @typedef ValueTypes
 * @property {number} scalar
 * @property {AUTO} auto
 * @property {number} length - Length quantity.
 * @property {number} angle
 * @property {Point} position - Position, i.e. the description of a point in space.
 * @property {p5.Color} color
 */

/**
 * Dynamic value.
 * @template {keyof ValueTypes} T
 */
export class Value {
  /**
   * Type of the value.
   * @type {T}
   */
  type;
  /**
   * ...
   * @type {?Shape}
   */
  shape = null;
  /**
   * Reference shape or canvas for relative values. `null` if the value is unbound.
   * @type {?Shape | p5}
   */
  reference = null;

  /** @type {ValueTypes[T] | undefined} */
  #cache = undefined;

  /**
   * @param {T} type
   */
  constructor(type) {
    this.type = type;
  }

  /**
   * Bind the value to a reference shape or canvas.
   * @param {Shape} shape - ...
   * @param {Shape | p5} reference - Reference shape or canvas for relative values.
   */
  bind(shape, reference) {
    this.shape = shape;
    this.reference = reference;
    this.#cache = undefined;
  }

  /**
   * Determine the value in viewport units.
   * @returns {ValueTypes[T]}
   */
  evaluate() {
    if (this.#cache === undefined) {
      if (!(this.shape && this.reference)) {
        throw new Error("Unbound value");
      }
      this.#cache = this.compute(this.shape, this.reference);
    }
    return this.#cache;
  }

  /**
   * Subclass: Compute the value in viewport units.
   * @param {Shape} shape - ...
   * @param {Shape | p5} reference - Reference shape or canvas for relative values.
   * @returns {ValueTypes[T]}
   */
  // eslint-disable-next-line no-unused-vars
  compute(shape, reference) {
    throw new Error("Abstract method");
  }
}

/**
 * ...
 * @template {keyof ValueTypes} T
 * @extends {Value<T>}
 */
export class VariableValue extends Value {
  /**
   * ...
   * @type {string} name
   */
  name;

  /**
   * @param {T} type
   * @param {string} name
   */
  constructor(type, name) {
    super(type);
    this.name = name;
  }

  /**
   * @param {Shape} shape
   */
  compute(shape) {
    const variable = shape.getVariable(this.name, this.type);
    if (variable.type !== this.type) {
      throw new TypeError(`Baaaad variable type ${variable.type} for ${this.name}`);
    }
    return /** @type {ValueTypes[T]} */ (variable.evaluate());
  }
}

/**
 * ...
 * @template {keyof ValueTypes} T
 * @param {string} name
 * @param {T} type
 * @returns {VariableValue<T>}
 */
export function variable(name, type) {
  return new VariableValue(type, name);
}

/**
 * Quantity, i.e. a value with a unit.
 * @template {keyof ValueTypes} T
 * @extends {Value<T>}
 */
export class QuantityValue extends Value {
  /**
   * Quantity value.
   * @type {number}
   */
  value;

  /**
   * @param {T} type
   * @param {number} value
   */
  constructor(type, value) {
    super(type);
    this.value = value;
  }
}

/**
 * Length in pixels.
 * @extends {QuantityValue<"length">}
 */
export class PixelLengthValue extends QuantityValue {
  /**
   * @param {number} value
   */
  constructor(value) {
    super("length", value);
  }

  compute() {
    return this.value;
  }
}

/**
 * Length in pixels.
 * @param {number} value - Quantity value.
 * @returns {PixelLengthValue}
 */
export function px(value) {
  return new PixelLengthValue(value);
}

/**
 * Fraction of the width of a reference shape.
 * @extends {QuantityValue<"length">}
 */
export class WidthLengthValue extends QuantityValue {
  /**
   * @param {number} value
   */
  constructor(value) {
    super("length", value);
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  compute(shape, reference) {
    return this.value * (reference instanceof p5 ? reference.width : reference.width.evaluate());
  }
}

/**
 * Fraction of the width of a reference shape.
 * @param {number} value - Quantity value.
 * @returns {WidthLengthValue}
 */
export function w(value) {
  return new WidthLengthValue(value);
}

/**
 * Fraction of the height of a reference shape.
 * @extends {QuantityValue<"length">}
 */
export class HeightLengthValue extends QuantityValue {
  /**
   * @param {number} value
   */
  constructor(value) {
    super("length", value);
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  compute(shape, reference) {
    return this.value * (reference instanceof p5 ? reference.height : reference.height.evaluate());
  }
}

/**
 * Fraction of the height of a reference shape.
 * @param {number} value - Quantity value.
 * @returns {HeightLengthValue}
 */
export function h(value) {
  return new HeightLengthValue(value);
}

/**
 * ...
 * @extends {QuantityValue<"angle">}
 */
export class TurnAngleValue extends QuantityValue {
  /**
   * @param {number} value
   */
  constructor(value) {
    super("angle", value);
  }

  compute() {
    return this.value * 2 * Math.PI;
  }
}

/**
 * ...
 * @param {number} value - ...
 * @returns {TurnAngleValue}
 */
export function tr(value) {
  return new TurnAngleValue(value);
}

/**
 * ...
 * @typedef {Value<"angle">} TurnAngle
 */

/**
 * ...
 * @typedef {TurnAngle} Angle
 */

/**
 * Position on the face of a reference shape in Cartesian coordinates.
 * @extends Value<"position">
 */
export class PointPositionValue extends Value {
  /**
   * Horizontal distance.
   * @type {Value<"length">}
   */
  x;
  /**
   * Vertical distance.
   * @type {Value<"length">}
   */
  y;

  /**
   * @param {Value<"length">} x
   * @param {Value<"length">} y
   */
  constructor(x, y) {
    super("position");
    this.x = x;
    this.y = y;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.x.bind(shape, reference);
    this.y.bind(shape, reference);
  }

  compute() {
    return { x: this.x.evaluate(), y: this.y.evaluate() };
  }
}

/**
 * Position on the face of a reference shape in Cartesian coordinates.
 * @param {Value<"length">} x - Horizontal distance.
 * @param {Value<"length">} y - Vertical distance.
 * @returns {PointPositionValue}
 */
export function point(x, y) {
  return new PointPositionValue(x, y);
}

// Backwards compatibility
/**
 * @param {Value<"length"> | number} x
 * @param {Value<"length"> | number} y
 */
export function body(x, y) {
  x = typeof x === "number" ? w(x) : x;
  y = typeof y === "number" ? h(y) : y;
  return new PointPositionValue(x, y);
}

// TODO OQ p5.Color, right? use whatever fill() accepts and _doesnt_ convert - IIRC tuples or
// strings are converted to p5.Color internally by fill

/**
 * ...
 * @extends {Value<"color">}
 */
export class ColorValue extends Value {
  /**
   * ...
   * @type {Angle}
   */
  hue;

  /**
   * ...
   * @type {Scalar}
   */
  saturation;

  /**
   * ...
   * @type {Scalar}
   */
  lightness;

  /**
   * @param {Angle} hue
   * @param {Scalar | number} saturation
   * @param {Scalar | number} lightness
   */
  constructor(hue, saturation, lightness) {
    super("color");
    this.hue = hue ?? tr(0);
    this.saturation = typeof saturation === "number" ? scalar(saturation) : saturation;
    this.lightness = typeof lightness === "number" ? scalar(lightness) : lightness;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.hue.bind(shape, reference);
    this.saturation.bind(shape, reference);
    this.lightness.bind(shape, reference);
  }

  /**
   * @param {Shape} shape
   */
  compute(shape) {
    if (!shape.p) {
      throw new Error(`Unrendered shape ${shape}`);
    }
    // OQ
    shape.p.colorMode(shape.p.HSL);
    return shape.p.color(
      // this.hue.evaluate() * 360 / (2 * Math.PI),
      (this.hue.evaluate() * 360 / (2 * Math.PI)) % 360,
      this.saturation.evaluate() * 100, this.lightness.evaluate() * 100,
    );
  }
}

/**
 * ...
 * @param {Angle} hue - ...
 * @param {Scalar | number} saturation - ...
 * @param {Scalar | number} lightness - ...
 * @returns {ColorValue}
 */
export function color(hue, saturation, lightness) {
  return new ColorValue(hue, saturation, lightness);
}

/** @typedef {Value<"color">} Color */

/**
 * ...
 * @template {keyof ValueTypes} T
 * @extends {Value<T>}
 */
export class ConstValue extends Value {
  /**
   * @param {T} type
   * @param {ValueTypes[T]} value
   */
  constructor(type, value) {
    super(type);
    this.value = value;
  }

  compute() {
    return this.value;
  }
}

/**
 * ...
 * @param {number} value
 * @returns {ConstValue<"scalar">}
 */
export function scalar(value) {
  return new ConstValue("scalar", value);
}

/**
 * @typedef {Value<"scalar">} Scalar
 */

/**
 * ...
 * @returns {ConstValue<"auto">}
 */
export function auto() {
  return new ConstValue("auto", AUTO);
}

/**
 * @typedef {Value<"auto">} Auto
 */

/**
 * Shape attributes.
 * @typedef ShapeAttributes
 * @property {Value<"length">} [width]
 * @property {Value<"length">} [height]
 * @property {Value<"position">} [at]
 * @property {?string | Auto} [fill]
 * @property {?string | Auto} [stroke]
 * @property {number} [start]
 * @property {number} [end]
 */

/**
 * @param {NextCallback} next
 * @returns {ShapeAttributes}
 */
function readShapeShortcutArguments(next) {
  const attributes = {};
  let width = next(Value, arg => arg.type === "length");
  if (width.value !== undefined) {
    attributes.width = /** @type {Value<"length">} */ (width.value);
    let height = next(Value, arg => arg.type === "length");
    if (height.value !== undefined) {
      attributes.height = /** @type {Value<"length">} */ (height.value);
      const at = next(Value, arg => arg.type === "position");
      if (at.value !== undefined) {
        attributes.at = /** @type {Value<"position">} */ (at.value);
      }
    }
  }
  return attributes;
}

/**
 * @param {NextCallback} next
 * @returns {Shape[]}
 */
function readShapeArguments(next) {
  /** @type {Shape[]} */
  const shapes = [];
  let shape;
  while ((shape = next(Shape)).value !== undefined) {
    shapes.push(shape.value);
  }
  // TODO support any object
  // TODO move out of function, if (!next().done) { ...
  // OQ or maybe ignore because typescript checks this for us already...
  // ^ yeah i think
  if (!shape.done) {
    throw new TypeError(`Bad arguments item ${shape.value}`);
  }
  return shapes;
}

/**
 * Basic geometric shape.
 */
export class Shape {
  /**
   * Width of the shape. Relative to the base.
   * @type {Value<"length">}
   */
  width;
  /**
   * Height of the shape. Relative to the base.
   * @type {Value<"length">}
   */
  height;
  /**
   * ...
   * @type {Value<"position">}
   */
  at;
  /**
   * TODO.
   * @type {?string | Auto}
   */
  fill;
  /**
   * TODO.
   * @type {?string | Auto}
   */
  stroke;
  /**
   * TODO.
   * @type {number}
   */
  start;
  /**
   * TODO.
   * @type {number}
   */
  end;
  /**
   * Base the shape is linked to, if any.
   * @type {?Shape}
   */
  base = null;
  /**
   * Shapes linked to the shape.
   * @type {Shape[]}
   */
  links = [];
  /**
   * ...
   * @type {?p5}
   */
  p = null;

  /** @type {Map<string, Value<keyof ValueTypes>>} */
  #variables = new Map();

  /**
   * ...
   * @param {string} name
   * @param {Value<keyof ValueTypes>} value
   */
  setVariable(name, value) {
    // TODO this has to be bound on render also, right?
    // TODO bind reference to parent or self? (this could make us reconsider reference binding and
    // passing it explicitly again, but then we would need cache per reference which is super ugly
    // :/ )
    // value.bind(this, this);
    this.#variables.set(name, value);
  }

  // OQ type could be optional, defaulting to unknown
  /**
   * ...
   * @template {keyof ValueTypes} T
   * @param {string} name
   * @param {T} type
   * @returns {Value<T>}
   */
  getVariable(name, type) {
    const value = this.#variables.get(name);
    if (value !== undefined) {
      if (value.type !== type) {
        throw new TypeError(`Bad variable type ${value.type} of ${name}`);
      }
      return /** @type {Value<T>} */ (value);
    }
    if (!this.base) {
      // TODO better error?
      throw new Error(`Unknown variable ${name}`);
    }
    return this.base.getVariable(name, type);
  }

  /**
   * @overload
   * @param {ShapeAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {Value<"length">} width
   * @param {ShapeAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {Value<"length">} width
   * @param {Value<"length">} height
   * @param {ShapeAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {Value<"length">} width
   * @param {Value<"length">} height
   * @param {Value<"position">} at
   * @param {ShapeAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @function
   * @param {...unknown} args
   */
  constructor(...args) {
    const next = argumentStream(args);
    const attributes = Object.assign(
      {}, readShapeShortcutArguments(next),
      next(Object, arg => !(arg instanceof Shape)).value ?? {},
    );
    const links = readShapeArguments(next);

    this.width = attributes.width ?? w(1);
    this.height = attributes.height ?? h(1);
    this.at = attributes.at ?? point(w(1 / 2), h(1 / 2));
    this.fill = attributes.fill ?? auto();
    this.stroke = attributes.stroke ?? auto();
    this.start = attributes.start ?? 0;
    this.end = attributes.end ?? -0;
    this.stick(...links);
  }

  /**
   * Link one or more shapes to the shape.
   *
   * If a shape is already linked to another base, it is unlinked from it.
   * @param {...Shape} shapes - Shapes to stick.
   */
  stick(...shapes) {
    for (const shape of shapes) {
      if (shape.base) {
        shape.base.unstick(shape);
      }
      this.links.push(shape);
      shape.base = this;
    }
  }

  /**
   * Unlink one or more shapes from the shape.
   * @param {...Shape} shapes - Shapes to unstick.
   */
  unstick(...shapes) {
    for (const shape of shapes) {
      const i = this.links.lastIndexOf(shape);
      if (i === -1) {
        throw new DOMException(`No links entry ${shape}`, "NotFoundError");
      }
      this.links.splice(i, 1);
      shape.base = null;
    }
  }

  /**
   * Render the shape to a sketch.
   * @param {p5} p - p5.js sketch.
   */
  render(p) {
    this.p = p;
    this.width.bind(this, this.base ?? p);
    this.height.bind(this, this.base ?? p);
    this.at.bind(this, this.base ?? p);
    if (this.fill instanceof Value) {
      this.fill.bind(this, this);
    }
    if (this.stroke instanceof Value) {
      this.stroke.bind(this, this);
    }

    for (const variable of this.#variables.values()) {
      variable.bind(this, this);
      variable.evaluate();
    }

    p.push();
    if (!(this.fill instanceof Value)) {
      p.fill(this.fill ?? "transparent");
    }
    if (!(this.stroke instanceof Value)) {
      p.stroke(this.stroke ?? "transparent");
    }
    const at = this.at.evaluate();
    p.translate(at.x, at.y);
    p.translate(-this.width.evaluate() / 2, -this.height.evaluate() / 2);

    this.renderShape(p);
    for (const link of this.links) {
      link.render(p);
    }
    p.pop();
  }

  /**
   * Render the shape itself to a sketch.
   * @param {p5} p - p5.js sketch.
   */
  // eslint-disable-next-line no-unused-vars
  renderShape(p) {
    throw new Error("Unimplemented method");
  }

  toString() {
    const path = [];
    /** @type {?Shape} */
    let shape = this;
    while (shape) {
      const index = shape.base ? `[${shape.base.links.findIndex(link => link === shape)}]` : "";
      path.unshift(`${shape.constructor.name}${index}`);
      shape = shape.base;
    }
    return path.join("/");
  }
}

class Polygon extends Shape {
  /** @type {p5.Vector[]} */
  vertices = [];
  /** @type {p5.Vector[]} */
  #points = [];
  /** @type {number} */
  #width = 0;
  /** @type {number} */
  #height = 0;
  /** @type {boolean} */
  #closed = false;

  /**
   * @param {p5} p
   */
  renderShape(p) {
    const width = this.width.evaluate();
    const height = this.height.evaluate();
    if (!(width === this.#width && height === this.#height)) {
      this.#width = width;
      this.#height = height;
      this.#points = [];

      const startIndex = Math.trunc(this.start);
      const startOffset = this.start - startIndex;
      const end = Object.is(this.end, -0) ? this.vertices.length : this.end;
      const endIndex = Math.trunc(end);
      const endOffset = end - endIndex;

      this.#points.push(this.getEdgePoint(startIndex, startOffset));
      // console.log("PARAMS", startIndex, startOffset, endIndex, endOffset);
      // console.log("INITIAL POINT", this.#points[0]);

      // const limit = (endIndex + 1) % this.#vertices.length;
      // let i = (startIndex + 1) % this.#vertices.length;

      // console.log("STARTLIMIT", (startIndex + 1) % this.vertices.length, endIndex % this.vertices.length);
      for (
        let i = startIndex + 1;
        i < endIndex + Math.ceil(endOffset);
        i++
        // let i = (startIndex + 1) % this.vertices.length;
        // i !== (endIndex + 1) % this.vertices.length;
        // i = i + 1
      ) {
      // while (i !== limit) {
        // console.log("COLLECTION POINT", i);
        const point = this.vertices[i % this.vertices.length];
        if (!point) {
          throw new Error("Assertion failed");
        }
        this.#points.push(point);
        // i = (i + 1) % this.#vertices.length;
      }
      if (
        (startIndex % this.vertices.length) === (endIndex % this.vertices.length)
        && startOffset === endOffset
      ) {
        this.#closed = true;
      } else {
        this.#points.push(this.getEdgePoint(endIndex, endOffset));
        this.#closed = false;
      }
      // console.log("TRI POINTS", this.#points, this.#closed);
    }

    p.beginShape();
    for (const point of this.#points) {
      p.vertex(point.x, point.y);
    }
    p.endShape(this.#closed ? p.CLOSE : undefined);
  }

  /**
   * @param {number} index
   * @param {number} offset
   * @returns {p5.Vector}
   */
  getEdgePoint(index, offset) {
    const p1 = this.vertices[index % this.vertices.length];
    const p2 = this.vertices[(index + 1) % this.vertices.length];
    if (!(p1 && p2)) {
      throw new Error("Assertion failed");
    }
    // console.log("GEP", p1, p2, offset);
    return p5.Vector.sub(p2, p1).mult(offset).add(p1);
  }
}

/**
 * Triangle.
 */
export class Triangle extends Polygon {
  /**
   * @param {p5} p
   */
  renderShape(p) {
    //     ^ C
    //    / \
    // B .---. A
    const width = this.width.evaluate();
    const height = this.height.evaluate();
    // if (this.renderWidth !== this.cacheWidth && this.renderHeight !== this.cacheHeight) {
    this.vertices = [
      new p5.Vector(width, height),
      new p5.Vector(0, height),
      new p5.Vector(width / 2, 0),
    ];
    super.renderShape(p);
    // TODO orientation positive x I think or positive y, right?
  }
}

/**
 * Rectangle.
 */
export class Rectangle extends Polygon {
  /**
   * @param {p5} p
   */
  renderShape(p) {
    const width = this.width.evaluate();
    const height = this.height.evaluate();
    this.vertices = [
      new p5.Vector(0, 0),
      new p5.Vector(width, 0),
      new p5.Vector(width, height),
      new p5.Vector(0, height),
    ];
    super.renderShape(p);
  }
}

/**
 * Ellipse.
 */
export class Ellipse extends Shape {
  /**
   * @param {p5} p
   */
  renderShape(p) {
    const end = Object.is(this.end, -0) ? 1 : this.end;
    const width = this.width.evaluate();
    const height = this.height.evaluate();
    p.arc(
      width / 2, height / 2, width, height, this.start * 2 * Math.PI, end * 2 * Math.PI, p.OPEN,
    );
  }
}
