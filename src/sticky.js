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

// https://squaresrng.wixsite.com/rand
// inline static uint32_t squares32(uint64_t ctr, uint64_t key) {
//    uint64_t x, y, z;
//    y = x = ctr * key; z = y + key;
//    x = x*x + y; x = (x>>32) | (x<<32);       /* round 1 */
//    x = x*x + z; x = (x>>32) | (x<<32);       /* round 2 */
//    x = x*x + y; x = (x>>32) | (x<<32);       /* round 3 */
//    return (x*x + z) >> 32;                   /* round 4 */
// }

const SQUARES_32_KEY = BigInt("0xc8e4fd154ce32f6d");

// TODO a good test for this is running it against the original code with a high counter number
/**
 * @param {bigint} counter
 * @param {bigint} key
 * @returns {bigint} counter
 */
function squares32(counter, key) {
  let x = BigInt.asUintN(64, counter * key);
  let y = x;
  let z = BigInt.asUintN(64, y + key);
  x = BigInt.asUintN(64, x * x + y);
  x = BigInt.asUintN(64, x >> 32n | x << 32n);
  x = BigInt.asUintN(64, x * x + z);
  x = BigInt.asUintN(64, x >> 32n | x << 32n);
  x = BigInt.asUintN(64, x * x + y);
  x = BigInt.asUintN(64, x >> 32n | x << 32n);
  x = BigInt.asUintN(64, x * x + z);
  return x >> 32n;
}

// // for (let i = 2n << 62n; i < 20n + (2n << 62n); i++) {
// for (let i = 0n; i < 20n; i++) {
//   console.log(squares32(BigInt(i), SQUARES_32_KEY));
// }
// for (let i = 0; i < 10; i++) {
//   console.log(rand(i));
// }

/**
 * @param {number} counter
 * @returns {number}
 */
export function rand(counter) {
  return Number(squares32(BigInt(counter), SQUARES_32_KEY)) / (2 ** 32);
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
     <T extends Constructor<unknown> | "number" | "string">(type: T, test?: TestCallback<ConcreteType<T>>)
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
   * @template {Constructor<unknown> | "number" | "string"} T
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
        (typeof type === "string" && typeof arg === type)
        || (typeof type !== "string" && arg instanceof /** @type {Constructor<unknown>} */ (type))
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
 * @property {boolean} bool
 * @property {AUTO} auto
 * @property {number} length - Length quantity.
 * @property {number} angle
 * @property {Point} position - Position, i.e. the description of a point in space.
 * @property {p5.Color} color
 * @property {CanvasGradient} linear-gradient
 * @property {WaveCallback} wave
 */

/**
 * ...
 * @typedef {"scalar" | "length" | "angle"} Numeric
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

  /**
   * ...
   * @returns {Value<T>}
   */
  clone() {
    // TODO throw new Error("Abstract method");
    return this;
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
    if (reference instanceof p5) {
      // const shape = { viewport: 360 };
      // OQ is this good, or should it be viewport width + viewport height? but then we would also
      // need some aspect ratio preserving flag or behaviour?
      return this.value * (shape.viewport
        ? shape.viewport * reference.width / reference.height
        : reference.width);
    } else {
      return this.value * reference.width.evaluate();
    }
    // return this.value * (reference instanceof p5 ? reference.width : reference.width.evaluate());
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
    // let h;
    // if (reference instanceof p5) {
    //   // h = reference.height / (shape.viewport ? reference.height / shape.viewport : 1);
    //   const shape = { viewport: 360 };
    //   h = shape.viewport ?? reference.height;
    // } else {
    //   h = reference.height.evaluate();
    // }
    // return this.value * h;

    // const shape = { viewport: 360 };
    return this.value * (
      reference instanceof p5 ? (shape.viewport ?? reference.height) : reference.height.evaluate()
    );
    // return this.value * (reference instanceof p5 ? reference.height : reference.height.evaluate());
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
 * Fraction of an edge length of a reference shape.
 * @extends {QuantityValue<"length">}
 */
export class EdgeLengthValue extends QuantityValue {
  /**
   * ...
   * @type {number}
   */
  index;

  /**
   * @param {number} index
   * @param {number} value
   */
  constructor(index, value) {
    super("length", value);
    this.index = index;
  }

  /**
   * @param {Shape | p5} reference
   */
  // eslint-disable-next-line no-unused-vars
  toPixels(reference) {
    return 0;
    // shape.getEdge(this.index)
    // this.value * shape.getEdgeLengthPx(this.index);
  }
}

/**
 * Fraction of an edge length of a reference shape.
 * @param {number} index
 * @param {number} value - Length value
 */
export function e(index, value) {
  return new EdgeLengthValue(index, value);
}

// e(0, 1 / 2)
// edge(0, px(50))
// edge(0, 1 / 2)
// edge(0, e(0, 1 / 2))

// export class PolygonEdge {
//   a;
//   b;
//
//   get lengthPx {
//   }
//
//   getPointPx(offsetPx) {
//
//   }
// }

// export class EllipseEdge {
//   center;
//   radiusX;
//   radiusY;
//   //start;
//   //end;
//
// }
//
// shape.getEdge(index).getPointPx(offset.px(shape))
//                                 shape.getEdge(index).lengthPx

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

  clone() {
    return new PointPositionValue(this.x.clone(), this.y.clone());
  }

  // XXX
  angle() {
    return 0;
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

// TODO better name?
/**
 * ...
 * @extends {Value<"position">}
 */
export class PolarValue extends Value {
  /**
   * ...
   * @type {Value<"length">}
   */
  r;
  /**
   * ...
   * @type {Angle}
   */
  a;

  /**
   * @param {Value<"length">} r
   * @param {Angle} a
   */
  constructor(r, a) {
    super("position");
    this.r = r;
    this.a = a;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.r.bind(shape, reference);
    this.a.bind(shape, reference);
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  compute(shape, reference) {
    const r = this.r.evaluate();
    // TODO handle canvas / root element better
    const cx = reference instanceof p5 ? 0 : reference.width.evaluate() / 2;
    const cy = reference instanceof p5 ? 0 : reference.height.evaluate() / 2;
    const a = this.a.evaluate();
    return new p5.Vector(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }

  angle() {
    return this.a.evaluate();
  }
}

/**
 * ...
 * @param {Value<"length">} r - ...
 * @param {Angle} a - ...
 */
export function polar(r, a) {
  return new PolarValue(r, a);
}

// getEdges() -> curves (basically every curve is an axis)
// getCartesianCoordinateSystem() -> origin, xAxis, yAxis
// getPolarCoordinateSystem() -> pole, axis
/**
 * ...
 * @extends {Value<"position">}
 */
export class EdgeValue extends Value {
  /**
   * ...
   * @type {number}
   */
  index;
  /**
   * ...
   * @type {Value<"length">}
   */
  offset;
  /**
   * ...
   * @type {Value<"length">}
   */
  crossOffset;

  /**
   * @param {number} index
   * @param {Value<"length"> | number} offset
   * @param {Value<"length"> | number} crossOffset
   */
  constructor(index, offset = 1 / 2, crossOffset = 0) {
    super("position");
    this.index = index;
    this.offset = typeof offset === "number" ? e(index, offset) : offset;
    this.crossOffset = typeof crossOffset === "number" ? e(index, crossOffset) : crossOffset;
  }

  // TODO design without chaining
  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.offset.bind(shape, reference);
    this.crossOffset.bind(shape, reference);
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  compute(shape, reference) {
    // OQ getedgepoint was shape.base, crossoffset was shape, now it's the same (shape.base), but I
    // think that makes more sense right?
    return reference instanceof p5
      ? new p5.Vector()
      : reference.getEdgePoint(this.index, this.offset, this.crossOffset.evaluate());
  }

  // XXX
  /**
   * @param {Shape | p5} reference
   */
  angle(reference) {
    return reference instanceof p5 ? 0 : reference.getEdgeAngle(this.index, this.offset);
  }
}

/**
 * ...
 * @param {number} index
 * @param {Value<"length"> | number} offset
 * @param {Value<"length"> | number} crossOffset
 */
export function edge(index, offset = 1 / 2, crossOffset = 0) {
  return new EdgeValue(index, offset, crossOffset);
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
   * ...
   * @type {Scalar}
   */
  alpha;

  /**
   * @param {Angle} hue
   * @param {Scalar | number} saturation
   * @param {Scalar | number} lightness
   * @param {Object} options
   * @param {Scalar | number} [options.alpha]
   */
  constructor(hue, saturation, lightness, { alpha = scalar(1) } = {}) {
    super("color");
    this.hue = hue ?? tr(0);
    this.saturation = typeof saturation === "number" ? scalar(saturation) : saturation;
    this.lightness = typeof lightness === "number" ? scalar(lightness) : lightness;
    this.alpha = typeof alpha === "number" ? scalar(alpha) : alpha;
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
    this.alpha.bind(shape, reference);
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
      this.alpha.evaluate(),
    );
  }
}

/**
 * ...
 * @param {Angle} hue - ...
 * @param {Scalar | number} saturation - ...
 * @param {Scalar | number} lightness - ...
 * @param {Object} options
 * @param {Scalar | number} [options.alpha] - ...
 * @returns {ColorValue}
 */
export function color(hue, saturation, lightness, { alpha = scalar(1) } = {}) {
  return new ColorValue(hue, saturation, lightness, { alpha });
}

/**
 * ...
 * @returns {ColorValue}
 */
export function transparent() {
  return new ColorValue(tr(0), 0, 0, { alpha: 0 });
}

/** @typedef {Value<"color">} Color */

/**
 * ...
 * @extends {Value<"color">}
 */
export class HuedValue extends Value {
  /**
   * ...
   * @type {Color}
   */
  color;
  /**
   * ...
   * @type {Angle}
   */
  rotation;

  /**
   * @param {Color} color
   * @param {Angle} rotation
   */
  constructor(color, rotation) {
    super("color");
    this.color = color;
    this.rotation = rotation;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.color.bind(shape, reference);
    this.rotation.bind(shape, reference);
  }

  /**
   * @param {Shape} shape
   */
  compute(shape) {
    if (!shape.p) {
      throw new Error(`Unrendered shape ${shape}`);
    }
    const color = this.color.evaluate();
    return shape.p.color(
      ((shape.p.hue(color) + shape.p.degrees(this.rotation.evaluate())) % 360 + 360) % 360,
      shape.p.saturation(color), shape.p.lightness(color),
    );
  }
}

/**
 * ...
 * @param {Color} color
 * @param {Angle} rotation
 */
export function hued(color, rotation) {
  return new HuedValue(color, rotation);
}

/**
 * ...
 * @extends {Value<"color">}
 */
export class ShadedValue extends Value {
  /**
   * ...
   * @type {Color}
   */
  color;
  // TODO OQ better name?
  /**
   * ...
   * @type {Scalar}
   */
  scale;

  /**
   * @param {Color} color
   * @param {Scalar | number} scale
   */
  constructor(color, scale) {
    super("color");
    this.color = color;
    this.scale = typeof scale === "number" ? scalar(scale) : scale;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.color.bind(shape, reference);
    this.scale.bind(shape, reference);
  }

  /**
   * @param {Shape} shape
   */
  compute(shape) {
    if (!shape.p) {
      throw new Error(`Unrendered shape ${shape}`);
    }
    const color = this.color.evaluate();
    return shape.p.color(
      shape.p.hue(color), shape.p.saturation(color),
      shape.p.lightness(color) * this.scale.evaluate(),
    );
  }
}

/**
 * ...
 * @param {Color} color - ...
 * @param {Scalar | number} scale - ...
 * @returns {ShadedValue}
 */
export function shaded(color, scale) {
  return new ShadedValue(color, scale);
}

/**
 * @typedef LinearGradientOptions
 * @property {Value<"position">} [from]
 * @property {Value<"position">} [to]
 */

/**
 * ...
 * @extends {Value<"linear-gradient">}
 */
export class LinearGradientValue extends Value {
  /** @type {Value<"position">} */
  from;
  /** @type {Value<"position">} */
  to;
  /** @type {Color[]} */
  colors;

  /**
   * @param {LinearGradientOptions | Color} [options]
   * @param {...Color} colors
   */
  constructor(options = {}, ...colors) {
    super("linear-gradient");
    if (options instanceof Value) {
      colors.unshift(options);
      options = {};
    }
    this.from = options.from ?? body(w(0), h(1 / 2));
    this.to = options.to ?? body(w(1), h(1 / 2));
    this.colors = colors;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.from.bind(shape, reference);
    this.to.bind(shape, reference);
    for (const color of this.colors) {
      color.bind(shape, reference);
    }
  }

  /**
   * @param {Shape} shape
   */
  compute(shape) {
    if (!shape.p) {
      throw new Error(`Unrendered shape ${shape}`);
    }
    // TODO rather if? okay to return null? throw error?
    assert(shape.p.drawingContext instanceof CanvasRenderingContext2D);
    const from = this.from.evaluate();
    const to = this.to.evaluate();
    const gradient = shape.p.drawingContext.createLinearGradient(from.x, from.y, to.x, to.y);
    for (const [i, color] of this.colors.entries()) {
      gradient.addColorStop(i / (this.colors.length - 1), color.evaluate().toString());
    }
    return gradient;
  }
}

/**
 * ...
 * @param {LinearGradientOptions | Color} [options]
 * @param {...Color} colors
 * @returns LinearGradientValue
 */
export function linearGradient(options = {}, ...colors) {
  return new LinearGradientValue(options, ...colors);
}

/**
 * ...
 * @typedef {Value<"linear-gradient">} LinearGradient
 */

/**
 * ...
 * @typedef {LinearGradient} Gradient
 */

/**
 * ...
 * @template {Numeric} T
 * @extends {Value<T>}
 */
export class MultiplyValue extends Value {
  /**
   * ...
   * @type {[Value<T>, ...Scalar[]]}
   */
  values;

  /**
   * @param {Value<T> | number} a
   * @param {Scalar | number} b
   * @param {(Scalar | number)[]} values
   */
  constructor(a, b, ...values) {
    if (typeof a === "number") {
      a = /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(a)));
    }
    super(a.type);
    this.values = [
      a, ...[b, ...values].map(value => typeof value === "number" ? scalar(value) : value),
    ];
  }

  // TODO design without chaining
  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    for (const value of this.values) {
      value.bind(shape, reference);
    }
  }

  compute() {
    return this.values.map(value => value.evaluate()).reduce((a, b) => a * b);
  }
}

/**
 * ...
 * @template {Numeric} T
 * @param {Value<T> | number} a
 * @param {Scalar | number} b
 * @param {(Scalar | number)[]} values
 * @returns {MultiplyValue<T>}
 */
export function multiply(a, b, ...values) {
  return new MultiplyValue(a, b, ...values);
}

/**
 * ...
 * @template {Numeric} [T = "scalar"]
 * @extends {Value<T>}
 */
export class RoundedValue extends Value {
  /**
   * ...
   * @type {Value<T>}
   */
  value;

  /**
   * @param {Value<T> | number} value
   */
  constructor(value) {
    if (typeof value === "number") {
      value = /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(value)));
    }
    super(value.type);
    this.value = value;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.value.bind(shape, reference);
  }

  compute() {
    // TODO multiple rounding methods of course
    return Math.floor(this.value.evaluate());
  }
}

/**
 * ...
 * @template {Numeric} [T = "scalar"]
 * @param {Value<T> | number} value - ...
 * @returns {RoundedValue<T>}
 */
export function rounded(value) {
  return new RoundedValue(value);
}

/**
 * ...
 * @template {Numeric} [T = "scalar"]
 * @extends Value<T>
 */
export class WrapValue extends Value {
  /**
   * ...
   * @type {Value<T>}
   */
  value;
  /**
   * ...
   * @type {Value<T>}
   */
  min;
  /**
   * ...
   * @type {Value<T>}
   */
  max;

  /**
   * @param {Value<T> | number} min
   * @param {Value<T> | number} value
   * @param {Value<T> | number} max
   */
  constructor(min, value, max) {
    if (typeof value === "number") {
      value = /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(value)));
    }
    super(value.type);
    this.value = value;
    this.min = typeof min === "number"
      ? /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(min)))
      : min;
    this.max = typeof max === "number"
      ? /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(max)))
      : max;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.value.bind(shape, reference);
    this.min.bind(shape, reference);
    this.max.bind(shape, reference);
  }

  compute() {
    const value = this.value.evaluate();
    const min = this.min.evaluate();
    const max = this.max.evaluate();
    const range = max - min;
    // TODO modulo good or floor impl?
    // TODO what if max < min?
    return ((value - min) % range + range) % range + min;
  }
}

/**
 * @template {Numeric} [T = "scalar"]
 * @param {Value<T> | number} min
 * @param {Value<T> | number} value
 * @param {Value<T> | number} max
 * @returns {WrapValue<T>}
 */
export function wrap(min, value, max) {
  return new WrapValue(min, value, max);
}

/**
 * ...
 * @template {Numeric} [T = "scalar"]
 * @extends {Value<T>}
 */
export class LerpValue extends Value {
  /**
   * ...
   * @type {Value<T>} from
   */
  from;
  /**
   * ...
   * @type {Value<T>} to
   */
  to;
  /**
   * ...
   * @type {Scalar} t
   */
  t;

  /**
   * @param {Value<T> | number} from
   * @param {Value<T> | number} to
   * @param {Scalar | number} t
   */
  constructor(from, to, t) {
    if (typeof from === "number") {
      from = /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(from)));
    }
    super(from.type);
    this.from = from;
    this.to = typeof to === "number"
      ? /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(to)))
      : to;
    this.t = typeof t === "number" ? scalar(t) : t;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.from.bind(shape, reference);
    this.to.bind(shape, reference);
    this.t.bind(shape, reference);
  }

  compute() {
    const t = this.t.evaluate();
    return (1 - t) * this.from.evaluate() + t * this.to.evaluate();
  }
}

/**
 * ...
 * @template {Numeric} [T = "scalar"]
 * @param {Value<T> | number} from
 * @param {Value<T> | number} to
 * @param {Scalar | number} t
 * @returns {LerpValue<T>}
 */
export function lerp(from, to, t) {
  return new LerpValue(from, to, t);
}

/**
 * @template {Numeric} T
 * @extends {Value<T>}
 */
export class RandomValue extends Value {
  /**
   * ...
   * @type {Value<T>}
   */
  from;
  /**
   * ...
   * @type {Value<T>}
   */
  to;

  #random = Math.random();

  /**
   * @param {Value<T> | number} from
   * @param {Value<T> | number} to
   */
  constructor(from, to) {
    from = typeof from === "number"
      ? /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(from)))
      : from;
    super(from.type);
    this.from = from;
    this.to = typeof to === "number"
      ? /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(to)))
      : to;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.from.bind(shape, reference);
    this.to.bind(shape, reference);
  }

  compute() {
    return (1 - this.#random) * this.from.evaluate() + this.#random * this.to.evaluate();
  }

  clone() {
    // TODO throw new Error("Abstract method");
    return new RandomValue(this.from.clone(), this.to.clone());
  }
}

/**
 * ...
 * @template {Numeric} T
 * @param {Value<T> | number} from
 * @param {Value<T> | number} to
 * @returns {RandomValue<T>}
 */
export function random(from, to) {
  return new RandomValue(from, to);
}

// TODO compute this per shape and inherit I think
// float max, half for seed and half for counter
// XXX i think with values near 2^52, i loose precision when the input is a float :/
const SEED = rand(new Date().valueOf()) * (2 ** 32); // (2 ** 52);

/**
 * ...
 * @extends {Value<"scalar">}
 */
export class NoiseValue extends Value {
  /**
   * ...
   * @type {Value<"scalar">}
   */
  x;

  /**
   * @param {Value<"scalar"> | number} x
   */
  constructor(x) {
    super("scalar");
    this.x = typeof x === "number" ? scalar(x) : x;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.x.bind(shape, reference);
  }

  compute() {
    const x = this.x.evaluate() + SEED;
    const floor = Math.floor(x);
    const t = x % 1;
    return (1 - t) * rand(floor) + t * rand(floor + 1);
  }
}

/**
 * ...
 * @param {Value<"scalar"> | number} x
 * @returns {NoiseValue}
 */
export function noise(x) {
  return new NoiseValue(x);
}

/**
 * ...
 * @extends {Value<"scalar">}
 */
export class TimeValue extends Value {
  constructor() {
    super("scalar");
  }

  /**
   * @param {Shape} shape
   */
  compute(shape) {
    if (!shape.p) {
      throw new Error(`Unrendered shape ${shape}`);
    }
    return shape.p.millis() / 1000;
  }
}

/**
 * ...
 * @returns {TimeValue}
 */
export function time() {
  return new TimeValue();
}

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
 * ...
 * @param {boolean} value
 * @returns {ConstValue<"bool">}
 */
export function bool(value) {
  return new ConstValue("bool", value);
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

// TODO move after color (and also const/scalar to top)
/**
 * ...
 */
export const CGA_PALETTE = {
  red: color(tr(0 / 6), 1, 1 / 3),
  brown: color(tr(1 / 12), 1, 1 / 3),
  yellow: color(tr(1 / 6), 1, 2 / 3),
  green: color(tr(2 / 6), 1, 1 / 3),
  cyan: color(tr(3 / 6), 1, 1 / 3),
  blue: color(tr(4 / 6), 1, 1 / 3),
  magenta: color(tr(5 / 6), 1, 1 / 3),

  lightRed: color(tr(0 / 6), 1, 2 / 3),
  lightBrown: color(tr(1 / 12), 1, 2 / 3),
  lightYellow: color(tr(1 / 6), 1, 2 / 3),
  lightGreen: color(tr(2 / 6), 1, 2 / 3),
  lightCyan: color(tr(3 / 6), 1, 2 / 3),
  lightBlue: color(tr(4 / 6), 1, 2 / 3),
  lightMagenta: color(tr(5 / 6), 1, 2 / 3),

  black: color(tr(0), 0, 0),
  darkGray: color(tr(0), 0, 1 / 3),
  lightGray: color(tr(0), 0, 2 / 3),
  white: color(tr(0), 0, 3 / 3),
};

/**
 * @param {number} progress
 */
export function ease(progress) {
  return (1 - Math.cos(progress * Math.PI)) / 2;
}

// OQ the typing with T = "scalar" is cool, but it allows mixing of to:Value/from:number still
// a more complex version with @param {V} to/from and @extends {Value<ValueType<V>, number>} is
// possible and also works :) - but maybe overkill for now...
// * @template T
// * @typedef {
//     T extends Value<infer O, number>
//       ? O
//       : T extends number
//         ? "scalar"
//         : never
//   } ValueType
// *

/**
 * @param {number} progress
 */
export function linear(progress) {
  return progress;
}

/**
 * @param {number} progress
 */
export function easeOn(progress) {
  // XXX
  return progress < 0.5 ? 0 : 1;
  // return 1;
}

/**
 * ...
 * @param {number} progress
 */
export function easeOut(progress) {
  return Math.sin(progress * Math.PI / 2);
}

/**
 * ...
 * @callback EasingCallback
 * @param {number} progress - ...
 * @returns {number}
 */

/**
 * ...
 * @template {Numeric} [T = "scalar"]
 * @extends {Value<T>}
 */
export class TweenValue extends Value {
  /** @type {Value<T>} */
  from;
  /** @type {Value<T>} */
  to;
  /** @type {Scalar} */
  duration;
  /**
   * ...
   * @type {Scalar}
   */
  offset;
  /** @type {Scalar} */
  pause;

  /**
   * @param {Value<T> | number} from
   * @param {Value<NoInfer<T>> | number} to
   * @param {Scalar | number} duration
   * @param {Object} [options]
   * @param {Scalar | number} [options.offset]
   * @param {Scalar | number} [options.pause]
   * @param {EasingCallback} [options.easing]
   * @param {boolean} [options.yoyo]
   */
  constructor(from, to, duration, { offset = 0, pause = 0, easing = ease, yoyo = false } = {}) {
    if (typeof from === "number") {
      from = /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(from)));
    }
    super(from.type);
    this.from = from;
    this.to = typeof to === "number"
      ? /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(to)))
      : to;
    this.duration = typeof duration === "number" ? scalar(duration) : duration;
    this.easing = easing;
    this.yoyo = yoyo;
    this.offset = typeof offset === "number" ? scalar(offset) : offset;
    this.pause = typeof pause === "number" ? scalar(pause) : pause;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.from.bind(shape, reference);
    this.to.bind(shape, reference);
    this.duration.bind(shape, reference);
    this.offset.bind(shape, reference);
    this.pause.bind(shape, reference);
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   * @returns {number}
   */
  compute(shape, reference) {
    const time = (reference instanceof p5 ? reference : reference.p)?.millis() ?? 0;
    const duration = this.duration.evaluate();
    const pause = this.pause.evaluate();
    let p = (time / 1000 + this.offset.evaluate()) / (duration + pause) % 1;
    // TODO OQ could also % (this.duration + pause), then if >= duration 0, then scale to 1 with /
    // duration, hmm....
    p = p * (duration + pause) / duration;
    if (p >= 1) {
      p = 0;
    }
    if (this.yoyo) {
      p = p * 2;
      p = p >= 1 ? 2 - p : p;
    }
    const progress = this.easing(p);
    const v = (1 - progress) * this.from.evaluate() + progress * this.to.evaluate();
    // console.log("v", (canvas.millis() / 1000).toFixed(2), v);
    return v;
  }
}

/**
 * @template {Numeric} [T = "scalar"]
 * @param {Value<T> | number} from
 * @param {Value<NoInfer<T>> | number} to
 * @param {Scalar | number} duration
 * @param {Object} [options]
 * @param {Scalar | number} [options.offset]
 * @param {Scalar | number} [options.pause]
 * @param {EasingCallback} [options.easing]
 * @param {boolean} [options.yoyo]
 * @returns {TweenValue<T>}
 */
export function tween(from, to, duration, { offset = 0, pause = 0, easing = ease, yoyo = false } = {}) {
  return new TweenValue(from, to, duration, { offset, pause, easing, yoyo });
}

/**
 * @extends {Value<"wave">}
 * @callback WaveCallback
 * @param {number} y
 * @returns {number}
 */
export class WaveValue extends Value {
  /** @type {Value<"length">} */
  length;
  /** @type {Value<"length">} */
  amplitude;

  /**
   * @param {Value<"length">} length
   * @param {Value<"length">} amplitude
   */
  constructor(length, amplitude) {
    super("wave");
    this.length = length;
    this.amplitude = amplitude;
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    this.length.bind(shape, reference);
    this.amplitude.bind(shape, reference);
  }

  compute() {
    /** @param {number} y */
    // return y => Math.sin(2 * Math.PI * y / this.length.evaluate()) * this.amplitude.evaluate();
    // XXX just for testing amplitude = phase
    const phase = this.amplitude.evaluate();
    const length = this.length.evaluate();
    // XXX just for testing, gap should be set by user
    const gap = 360 - length; // this.length.evaluate();
    /** @param {number} y */
    return (y) => {
      y = (y + phase) / (length + gap) % 1;
      y = y * (length + gap) / length;
      if (y >= 1) {
        y = 0;
      }
      return Math.sin(2 * Math.PI * y) * 128;
    };
  }
}

/**
 * @param {Value<"length">} length - ...
 * @param {Value<"length">} amplitude - ...
 * @returns {WaveValue}
 */
export function wave(length, amplitude) {
  return new WaveValue(length, amplitude);
}

/**
 * @typedef {Value<"wave">} Wave
 */

/**
 * @typedef {Wave} WarpMethod
 */

/**
 * Shape attributes.
 * @typedef ShapeAttributes
 * @property {Value<"length">} [width]
 * @property {Value<"length">} [height]
 * @property {Value<"position">} [at]
 * @property {Scalar | number} [orientation]
 * @property {Value<"position">} [anchor]
 * @property {Scalar | number} [z]
 * @property {Color | Gradient | Auto} [fill]
 * @property {Color | Gradient | Auto} [stroke]
 * @property {Value<"length"> | Auto} [strokeWidth]
 * @property {Scalar | number} [opacity]
 * @property {Value<"scalar"> | number} [clip]
 * @property {WarpMethod | Auto} [warp]
 * @property {Color} [shadow]
 * @property {Value<"length">} [shadowBlur]
 * @property {Value<"length">} [blur]
 * @property {number} [start]
 * @property {number} [end]
 * @property {?number} [viewport]
 * @property {Object<string, Value<keyof ValueTypes>>} [variables]
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
   * ...
   * @type {Scalar}
   */
  #orientation = scalar(0);
  /**
   * Anchor for positioning. Relative to the shape itself.
   * @type {Value<"position">}
   */
  anchor;
  /**
   * TODO.
   * @type {Color | Gradient | Auto}
   */
  fill;
  /**
   * TODO.
   * @type {Color | Gradient | Auto}
   */
  stroke;
  /**
   * ...
   * @type {Value<"length"> | Auto}
   */
  strokeWidth;
  /**
  // TODO none
  /**
   * ...
   * @type {WarpMethod | Auto}
   */
  warp;
  /**
   * ...
   * @type {Color}
   */
  shadow;
  /**
   * ...
   * @type {Value<"length">}
   */
  shadowBlur;
  /**
   * ...
   * @type {Value<"length">}
   */
  blur;
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
   * ...
   * @type {?number}
   */
  viewport = null;
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

  /** @type {Scalar} */
  #z = scalar(0);
  /** @type {Scalar} */
  #opacity = scalar(1);
  /** @type {Value<"scalar">} */
  #clip = scalar(0);
  /** @type {Map<string, Value<keyof ValueTypes>>} */
  #variables = new Map();

  #composited = false;
  /** @type {?p5.Graphics} */
  #compositeP = null;

  #warpOn = false;
  /** @type {?SVGSVGElement} */
  #warpSVG = null;
  /** @type {?SVGFEImageElement} */
  #warpImage = null;
  /** @type {?p5.Graphics} */
  #warpP = null;

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

  // TODO public + accept map in constructor?
  get variables() {
    return this.#variables;
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
    if (attributes.orientation !== undefined) {
      this.orientation = attributes.orientation;
    }
    this.anchor = attributes.anchor ?? body(1 / 2, 1 / 2);
    if (attributes.z !== undefined) {
      this.z = attributes.z;
    }
    this.fill = attributes.fill === undefined ? auto() : attributes.fill;
    this.stroke = attributes.stroke === undefined ? auto() : attributes.stroke;
    this.strokeWidth = attributes.strokeWidth === undefined ? auto() : attributes.strokeWidth;
    if (attributes.opacity !== undefined) {
      this.opacity = attributes.opacity;
    }
    if (attributes.clip !== undefined) {
      this.clip = attributes.clip;
    }
    this.warp = attributes.warp === undefined ? auto() : attributes.warp;
    this.shadow = attributes.shadow === undefined ? transparent() : attributes.shadow;
    this.shadowBlur = attributes.shadowBlur === undefined ? h(0) : attributes.shadowBlur;
    this.blur = attributes.blur ?? h(0);
    this.start = attributes.start ?? 0;
    this.end = attributes.end ?? -0;
    this.viewport = attributes.viewport ?? null;

    for (const [name, value] of Object.entries(attributes.variables ?? {})) {
      this.setVariable(name, value);
    }

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
   * @param {Scalar | number} value
   */
  set orientation(value) {
    this.#orientation = typeof value === "number" ? scalar(value) : value;
  }

  /**
   * ...
   * @returns {Scalar}
   */
  get orientation() {
    return this.#orientation;
  }

  /**
   * ...
   * @returns {Scalar}
   */
  get z() {
    return this.#z;
  }

  /**
   * @param {Scalar | number} value
   */
  set z(value) {
    this.#z = typeof value === "number" ? scalar(value) : value;
  }

  /**
   * ...
   * @returns {Scalar}
   */
  get opacity() {
    return this.#opacity;
  }

  /**
   * @param {Scalar | number} value
   */
  set opacity(value) {
    this.#opacity = typeof value === "number" ? scalar(value) : value;
  }

  /**
   * ...
   * @returns {Value<"scalar">}
   */
  get clip() {
    return this.#clip;
  }

  /**
   * @param {Value<"scalar"> | number} value
   */
  set clip(value) {
    this.#clip = typeof value === "number" ? scalar(value) : value;
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
    this.#orientation.bind(this, this.base ?? p);
    this.anchor.bind(this, this);
    this.fill.bind(this, this);
    this.stroke.bind(this, this);
    this.strokeWidth.bind(this, this);
    this.#opacity.bind(this, this);
    this.#clip.bind(this, this);
    this.warp.bind(this, this);
    this.shadow.bind(this, this);
    this.shadowBlur.bind(this, this);
    this.blur.bind(this, this.base ?? p);

    for (const variable of this.#variables.values()) {
      variable.bind(this, this);
      variable.evaluate();
    }

    // Set up global drawing state
    this.p.push();
    this.#transform();

    const warp = this.warp.evaluate();
    const warpOn = warp !== AUTO;
    if (warpOn !== this.#warpOn) {
      this.#warpOn = warpOn;
      // Invalidate cache
      if (this.#warpSVG && this.#warpP) {
        this.#warpSVG.remove();
        this.#warpP.remove();
        this.#warpSVG = null;
        this.#warpImage = null;
        this.#warpP = null;
      }
    }

    const opacity = this.#opacity.evaluate();
    const composited = opacity < 1 || warpOn;
    // TODO width + height dependency
    if (composited !== this.#composited) {
      console.log("COMPOSITED");
      this.#composited = composited;
      // XXX this was a memory leak in compositing ouch BACKPORT
      // Invalidate cache
      if (this.#compositeP) {
        this.#compositeP.remove();
        this.#compositeP = null;
      }
    }

    // Prepare compositing
    if (composited) {
      if (opacity < 1) {
        // OQ draws twice internally, should we optimize?
        // OQ why is opacity range 0 - 1, docs say something else
        this.p.tint(255, opacity);
      }
      if (warpOn) {
        if (!(this.#warpSVG && this.#warpImage && this.#warpP)) {
          this.#warpSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
          filter.id = "meowfilter";
          filter.setAttribute("filterUnits", "userSpaceOnUse");
          // OQ
          filter.setAttribute("color-interpolation-filters", "srgb");
          this.#warpImage = document.createElementNS("http://www.w3.org/2000/svg", "feImage");
          this.#warpImage.setAttribute("result", "map");
          this.#warpImage.setAttribute("preserveAspectRatio", "none");
          // const image = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
          // image.setAttribute("flood-color", "blue");
          const displacementMap = document.createElementNS("http://www.w3.org/2000/svg", "feDisplacementMap");
          displacementMap.setAttribute("in", "SourceGraphic");
          displacementMap.setAttribute("in2", "map");
          displacementMap.setAttribute("xChannelSelector", "R");
          displacementMap.setAttribute("scale", "23"); // h(1/8) / 2, pixels are interpreted from -0.5 to 0.5
          filter.append(this.#warpImage, displacementMap);
          this.#warpSVG.append(filter);
          document.body.append(this.#warpSVG);

          const height = this.height.evaluate();
          // const width = this.width.evaluate();
          const width = 1;
          this.#warpP = this.p.createGraphics(width, height);
          this.#warpP.loadPixels();
        }

        for (let y = 0; y < this.#warpP.height; y++) {
          for (let x = 0; x < this.#warpP.width; x++) {
            this.#warpP.pixels[y * this.#warpP.width * 4 + x * 4] = warp(y) + 128;
            // this.#warpP.pixels[y * this.#warpP.width * 4 + x * 4 + 1] = 128;
            // this.#warpP.pixels[y * this.#warpP.width * 4 + x * 4 + 2] = 128;
            this.#warpP.pixels[y * this.#warpP.width * 4 + x * 4 + 3] = 128;
          }
        }
        this.#warpP.updatePixels();
        // this seems async in firefox, thus it seems we _need_ to cache the filter, otherwise it
        // won't work at all or flicker
        // if (!this.#warpImage.getAttribute("href")) {
        assert(this.#warpP.drawingContext.canvas instanceof HTMLCanvasElement);
        // OQ might work with canvas ID in chrome? (standard says href takes everything that <use>
        // can take, so svg elements, maybe html elements?)
        // But not in FF: https://bugzilla.mozilla.org/show_bug.cgi?id=455986
        this.#warpImage.setAttribute("href", this.#warpP.drawingContext.canvas.toDataURL());
        // }

        if (this.p.drawingContext instanceof CanvasRenderingContext2D) {
          this.p.drawingContext.filter = "url(#meowfilter)";
        }
        // (async () => {
        //   assert(offscreenP.drawingContext.canvas instanceof OffscreenCanvas);
        //   const blob = await offscreenP.drawingContext.canvas.convertToBlob();
        //   image.setAttribute("href", URL.createObjectURL(blob));
        // })();
      }

      if (!this.#compositeP) {
        this.#compositeP = this.p.createGraphics(this.width.evaluate(), this.height.evaluate());
      }
      p = this.#compositeP;
      p.push();
      if (
        p.drawingContext instanceof CanvasRenderingContext2D
        && this.p.drawingContext instanceof CanvasRenderingContext2D
      ) {
        p.drawingContext.fillStyle = this.p.drawingContext.fillStyle;
        p.drawingContext.strokeStyle = this.p.drawingContext.strokeStyle;
        p.drawingContext.lineWidth = this.p.drawingContext.lineWidth;
      }
      // OQ
      p.textFont(this.p.textFont(), this.p.textSize());
      p.textStyle(this.p.textStyle());
      p.textLeading(this.p.textLeading());
    }

    // Set up local drawing state
    const fill = this.fill.evaluate();
    if (fill instanceof p5.Color) {
      p.fill(fill);
    } else if (
      fill instanceof CanvasGradient && p.drawingContext instanceof CanvasRenderingContext2D
    ) {
      p.fill(0);
      p.drawingContext.fillStyle = fill;
    }
    const stroke = this.stroke.evaluate();
    if (stroke instanceof p5.Color) {
      p.stroke(stroke);
    } else if (
      stroke instanceof CanvasGradient && p.drawingContext instanceof CanvasRenderingContext2D
    ) {
      p.stroke(0);
      p.drawingContext.strokeStyle = stroke;
    }
    const strokeWidth = this.strokeWidth.evaluate();
    if (strokeWidth !== AUTO) {
      p.strokeWeight(strokeWidth);
    }
    // OQ this assumes clip is applied after filter, so we need to filter inside composite to get
    // blur shadow etc
    if (this.#clip.evaluate() >= 0.5) {
      p.beginClip();
      this.renderShape(p);
      p.endClip();
    }

    const shadow = this.shadow.evaluate();
    const shadowAlpha = p.alpha(shadow);
    if (shadowAlpha !== 0 && p.drawingContext instanceof CanvasRenderingContext2D) {
      p.drawingContext.shadowColor = shadow.toString();
      // stddev = blur / 2 (see https://html.spec.whatwg.org/multipage/canvas.html#shadows)
      p.drawingContext.shadowBlur = 2 * this.shadowBlur.evaluate() * p.pixelDensity();
    }
    const blur = this.blur.evaluate();
    if (blur && p.drawingContext instanceof CanvasRenderingContext2D) {
      p.drawingContext.filter = `blur(${blur * p.pixelDensity()}px)`;
    }

    // Draw
    this.renderShape(p);

    if (shadowAlpha !== 0 && p.drawingContext instanceof CanvasRenderingContext2D) {
      p.drawingContext.shadowColor = "transparent";
      p.drawingContext.shadowBlur = 0;
    }
    if (blur && p.drawingContext instanceof CanvasRenderingContext2D) {
      p.drawingContext.filter = "none";
    }

    for (const link of this.links) {
      link.render(p);
    }

    // Composite
    if (composited) {
      p.pop();
      this.p.image(p, 0, 0);
    }

    // Reset drawing state
    this.p.pop();
  }

  #transform() {
    if (!this.p) {
      throw new Error("Unrendered shape");
    }

    // OQ only if parent is null?
    if (this.viewport) {
      this.p.scale(this.p.height / this.viewport);
    }
    const at = this.at.evaluate();
    this.p.translate(at.x, at.y);
    this.p.rotate(
      // XXX true, angle does not exist on Value... design this differently
      // @ts-ignore
      this.orientation.evaluate() * 2 * Math.PI + this.at.angle(this.base ?? this.p),
    );
    // OQ unit test: a) via renderX property, which makes sense for renderWidth, renderOrientation,
    // etc. (corresponding to computed values of user input), but I guess not to renderTranslation
    // (internal prop), for the user the position is at renderAt with renderAnchor; b) via canvas
    // test, but I guess like in a, renderAt and renderAnchor are passed individually, so it becomes
    // c) renderer test, i.e. have right svg props been called, has right translate call been made
    const anchor = this.anchor.evaluate();
    this.p.translate(-anchor.x, -anchor.y);
  }

  /**
   * Render the shape itself to a sketch.
   * @param {p5} p - p5.js sketch.
   */
  // eslint-disable-next-line no-unused-vars
  renderShape(p) {
    throw new Error("Unimplemented method");
  }

  // OQ should this return number? what would getBoundingBox() return?
  /**
   * ...
   * @param {p5} p - ...
   * @returns {number}
   */
  getZ(p) {
    this.p = p;
    this.z.bind(this, this.base ?? p);
    for (const variable of this.#variables.values()) {
      variable.bind(this, this);
    }
    return this.z.evaluate();
  }

  /**
   * ...
   *
   * Note that the behavior of picking from a non-root shape is undefined.
   * @param {p5.Vector} point
   * @returns {Shape | undefined}
   */
  pick(point) {
    if (!this.p) {
      throw new Error("Unrendered shape");
    }

    this.p.push();
    this.#transform();

    // latest = in front first
    let shape = this.links.findLast(link => link.pick(point));

    if (!shape) {
      this.p.beginClip();
      this.renderShape(this.p);
      if (!(this.p.drawingContext instanceof CanvasRenderingContext2D)) {
        throw new Error("no");
      }
      /**
       * @typedef Renderer
       * @property {Path2D} clipPath
       * @typedef Priv
       * @property {Renderer} _renderer
       * @typedef {p5 & Priv} P5P
       */
      if (this.p.drawingContext.isPointInPath(
        /** @type {P5P} */ (this.p)._renderer.clipPath, point.x, point.y)
      ) {
        shape = this;
      }
      this.p.endClip();
    };
    this.p.pop();

    return shape;
  }

  /**
   * ...
   * @param {number} index - ...
   * @param {Value<"length"> | number} offset - ...
   * @param {number} crossOffset - ...
   * @returns {p5.Vector}
   */
  // eslint-disable-next-line no-unused-vars
  getEdgePoint(index, offset, crossOffset) {
    throw new Error("Unimplemented method");
  }

  /**
   * ...
   * @param {number} index
   * @param {Value<"length">} offset
   * @returns {number}
   */
  // eslint-disable-next-line no-unused-vars
  getEdgeAngle(index, offset) {
    throw new Error("Unimplemented method");
  }

  // TODO on shape, children can overwrite and chain if needed
  cloneAttributes() {
    return {
      width: this.width.clone(),
      height: this.height.clone(),
      at: this.at.clone(),
      anchor: this.anchor.clone(),
      orientation: this.orientation.clone(),
      z: this.z.clone(),
      stroke: this.stroke.clone(),
      fill: this.fill.clone(),
      opacity: this.opacity.clone(),
      blur: this.blur.clone(),
      start: this.start,
      end: this.end,
      variables: Object.fromEntries([...this.variables].map(([name, variable]) => [name, variable.clone()])),
    };
  }

  cloneLinks() {
    return this.links.map(link => link.clone());
  }

  /**
   * ...
   * @returns {Shape}
   */
  clone() {
    // @ts-ignore
    return new this.constructor(this.cloneAttributes(), ...this.cloneLinks());
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

  clone() {
    return new Triangle(
      this.width, this.height, this.at.clone(),
      {
        anchor: this.anchor,
        orientation: this.orientation,
        z: this.z.clone(),
        stroke: this.stroke,
        fill: this.fill,
        opacity: this.opacity,
        blur: this.blur,
        start: this.start,
        end: this.end,
        variables: Object.fromEntries([...this.variables].map(([name, variable]) => [name, variable.clone()])),
      },
      ...this.links.map(link => link.clone()),
    );
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

  // getEdgeLength(index) {
  // }

  /**
   * ...
   * @param {number} index
   * @param {Value<"length">} offset
   * @param {number} crossOffset
   */
  getEdgePoint(index, offset, crossOffset) {
    // TODO maybe this can be done better now with new Value architecture?
    if (offset instanceof EdgeLengthValue) {
      const angle = offset.value * 2 * Math.PI;
      const radiusX = this.width.evaluate() / 2;
      const radiusY = this.height.evaluate() / 2;
      return new p5.Vector(
        (radiusX + crossOffset) * Math.cos(angle) + radiusX,
        (radiusY + crossOffset) * Math.sin(angle) + radiusY,
      );

      // const renderCrossOffset = crossOffset.px(this);
      // const crossAxis = p5.Vector.fromAngle(angle);
      // const point = new p5.Vector(center.x * Math.cos(t), center.y * Math.sin(t));
      // const center = new p5.Vector(this.renderWidth / 2, this.renderHeight / 2);
      // const crossAxis = p5.Vector.sub(point, center).normalize();
      // return point;
    } else {
      // const t = offsetPx / this.lengthPx;
      return new p5.Vector(0, 0);
    }
  }

  /**
   * ...
   * @param {number} index
   * @param {Value<"length">} offset
   */
  getEdgeAngle(index, offset) {
    // TODO maybe this can be done better now with new Value architecture?
    if (offset instanceof EdgeLengthValue) {
      return offset.value * 2 * Math.PI + Math.PI / 2;
    } else {
      return 0;
    }
  }

  clone() {
    return new Ellipse(
      this.width, this.height, this.at.clone(),
      {
        anchor: this.anchor,
        orientation: this.orientation,
        z: this.z.clone(),
        stroke: this.stroke,
        fill: this.fill,
        opacity: this.opacity,
        blur: this.blur,
        start: this.start,
        end: this.end,
        variables: Object.fromEntries([...this.variables].map(([name, variable]) => [name, variable.clone()])),
      },
      ...this.links.map(link => link.clone()),
    );
  }
}

/**
 * @typedef TextAttributesProperties
 * @property {string} [content]
 * @property {Value<"length"> | Auto} [fontSize]
 * @typedef {ShapeAttributes & TextAttributesProperties} TextAttributes
 */

/** ... */
export class Text extends Shape {
  /**
   * ...
   * @type {string}
   */
  content;

  /**
   * @overload
   * @param {TextAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {string} content
   * @param {TextAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {string} content
   * @param {Value<"length">} width
   * @param {TextAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {string} content
   * @param {Value<"length">} width
   * @param {Value<"length">} height
   * @param {TextAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {string} content
   * @param {Value<"length">} width
   * @param {Value<"length">} height
   * @param {Value<"position">} at
   * @param {TextAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @function
   * @param {...unknown} args
   */
  constructor(...args) {
    const next = argumentStream(args);
    /** @type {TextAttributes} */
    const attributes = {};
    const content = next("string");
    if (content.value !== undefined) {
      attributes.content = content.value;
      Object.assign(attributes, readShapeShortcutArguments(next));
    }
    Object.assign(attributes, next(Object, arg => !(arg instanceof Shape)).value ?? {});
    const links = readShapeArguments(next);

    super(attributes, ...links);
    this.content = attributes.content ?? "";
    this.fontSize = attributes.fontSize === undefined ? auto() : attributes.fontSize;
  }

  /**
   * @param {p5} p
   */
  renderShape(p) {
    this.fontSize.bind(this, this);

    // TODO textSize option
    // TODO textFont option
    // TODO 0 0 once we have anchor
    const fontSize = this.fontSize.evaluate();
    if (fontSize !== AUTO) {
      p.textFont("sans-serif", fontSize);
      // p.textLeading(3 / 2 * fontSize);
      p.textLeading(fontSize);
    }

    p.textAlign(p.CENTER, p.CENTER);
    p.textAlign(p.LEFT, p.TOP);
    p.text(this.content, 0, 0, this.width.evaluate(), this.height.evaluate());
  }
}

/**
 * @typedef ImageAttributeProperties
 * @property {string} [url]
 * @typedef {ShapeAttributes & ImageAttributeProperties} ImageAttributes
 */

/**
 * ...
 */
export class Image extends Shape {
  /**
   * @overload
   * @param {ImageAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {string} url
   * @param {ImageAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {string} url
   * @param {Value<"length">} width
   * @param {ImageAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {string} url
   * @param {Value<"length">} width
   * @param {Value<"length">} height
   * @param {ImageAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @overload
   * @param {string} url
   * @param {Value<"length">} width
   * @param {Value<"length">} height
   * @param {Value<"position">} at
   * @param {ImageAttributes | Shape} [attributes]
   * @param {...Shape[]} links
   * @function
   * @param {...unknown} args
   */
  constructor(...args) {
    const next = argumentStream(args);
    /** @type {ImageAttributes} */
    const attributes = {};
    const url = next("string");
    if (url.value !== undefined) {
      attributes.url = url.value;
      Object.assign(attributes, readShapeShortcutArguments(next));
    }
    Object.assign(attributes, next(Object, arg => !(arg instanceof Shape)).value ?? {});
    const links = readShapeArguments(next);

    super(attributes, ...links);
    this.url = attributes.url ?? "";
  }

  /** @type {?p5.Image} */
  #image = null;
  #imageURL = "";

  /**
   * @param {p5} p
   */
  renderShape(p) {
    if (this.url !== this.#imageURL) {
      this.#imageURL = this.url;
      // OQ destroy/remove?
      this.#image = null;
    }
    if (!this.#image) {
      // OQ maybe this fetches it multiple times meh
      if (this.url) {
        (async () => {
          this.#image = await p.loadImage(this.url);
        })();
      }
    }

    if (this.#image) {
      p.image(this.#image, 0, 0, this.width.evaluate(), this.height.evaluate());
    }
  }
}

/**
 * @typedef RepeatedShapeAttributesProperties
 * @property {Scalar | number} [count]
 * @typedef {ShapeAttributes & RepeatedShapeAttributesProperties} RepeatedShapeAttributes
 */

/**
 * Shape repeated multiple times.
 */
export class RepeatedShape extends Shape {
  /**
   * One or more repeated shapes.
   * @type {Shape[]}
   */
  shapes;
  /**
   * Count of repetitions.
   * @type {Scalar}
   */
  count;

  // OQ what about with and height? - not applicable? ignored?
  // position - children placed relatively?
  // -> don't specify size and position, should always match parent
  // OQ what about blur? opacity? fill? stroke? - applied to all children?
  // OQ  start /end? - not applicable?

  /**
   * @overload
   * @param {RepeatedShapeAttributes | Shape} [attributes]
   * @param {...Shape[]} shapes
   * @overload
   * @param {Scalar | number} count
   * @param {RepeatedShapeAttributes | Shape} [attributes]
   * @param {...Shape[]} shapes
   * @function
   * @param {...unknown} args
   */
  constructor(...args) {
    const next = argumentStream(args);

    /** @type {RepeatedShapeAttributes} */
    const attributes = {};
    /** @type {IteratorResult<Value<keyof ValueTypes> | number | undefined, Value<keyof ValueTypes> | number | undefined>} */
    let count = next("number");
    if (count.value === undefined) {
      count = next(Value, arg => arg.type === "scalar");
    }
    if (count.value !== undefined) {
      attributes.count = /** @type {Scalar | number} */ (count.value);
    }
    Object.assign(attributes, next(Object, arg => !(arg instanceof Shape)).value ?? {});
    const shapes = readShapeArguments(next);

    super(attributes);
    this.count = typeof attributes.count === "number"
      ? scalar(attributes.count)
      : attributes.count ?? scalar(1);
    this.shapes = shapes;
  }

  /**
   * @type {?Shape[]}
   */
  #shadow = null;
  /** @type {?[Shape, number][]} */
  #shadowStack = null;

  /**
   * @param {p5} p
   */
  renderShape(p) {
    this.count.bind(this, this);

    // TODO a) for now only support simple iteration n / x y
    // layout (for align and fill algorithms) might be overkill (we don't do layout anywhere else in
    // the library), maybe we're just no layout library, maybe in future
    // approach:
    // a) for each new clone, chain offset using prev clone.width directly (implemented below)
    //    cool, but only works for simple align algorithm, we can't do any advanced math with Length
    // b) layout is done in render coordinates
    //    seems fair
    //    we can do all math we need for line-wrapping and filling space etc. because we dont use
    //    prev clone.width directly, if its size changes the layout will not be updated
    //    automatically like with chaining - but its no problem, as soon as base or one of the
    //    clones size changes (bc of var), we have to rerun the layout anyway, because fill/wrap
    //    might be different
    // TODO OQ how to cache internal deps?
    if (!(this.#shadow && this.#shadowStack)) {
      this.#shadow = [];
      this.#shadowStack = [];
      // let offset = 0;
      for (let i = 0; i < this.count.evaluate(); i++) {
        // for (const [j, shape] of this.shapes.entries()) {
        for (const shape of this.shapes) {
          const clone = shape.clone();
          // TODO OQ how to chain base?
          clone.base = this;
          // clone.setVariable("i", scalar(i * this.shapes.length + j));
          clone.setVariable("i", scalar(i));
          this.#shadow.push(clone);
          this.#shadowStack.push([clone, 0]);
        }
      }

      // let offset = w(0);
      // for (let i = 0; i < this.count; i++) {
      //   // OQ how to handle multiple shapes? only expect single one, right, hmmm?
      //   // -> nah, cycle through them, nice for alternating shapes :)
      //   for (const shape of this.shapes) {
      //     const clone = shape.clone();
      //     clone.base = this;
      //     // offset = add(offset, clone.width)
      //     // clone.at = body(0.5 - offset, 0.5);
      //     // clone.at = body(px(offset), 0.5);
      //     clone.at = body(offset, 0.5);

      //     this.#shadow.push(clone);
      //     // const width = evaluate(clone.width);
      //     // TODO how to get width of clone?
      //     // offset += clone.width;
      //     // offset += 0.1;

      //     // OQ why is typing broken here?
      //     // @ts-ignore
      //     offset = add(offset, clone.width);

      //     // clone.render(p);
      //     // offset += clone.renderWidth;
      //   }
      // }
    }

    for (const item of this.#shadowStack) {
      item[1] = item[0].getZ(p);
    }
    this.#shadowStack.sort(([, a], [, b]) => a - b);

    for (const [shape] of this.#shadowStack) {
      shape.render(p);
    }
  }

  cloneAttributes() {
    return {
      count: this.count.clone(),
      ...super.cloneAttributes(),
    };
  }

  cloneLinks() {
    return this.shapes.map(shape => shape.clone());
  }
}

/**
 * Shape repeated multiple times.
 * @overload
 * @param {RepeatedShapeAttributes | Shape} [attributes]
 * @param {...Shape[]} shapes
 * @returns RepeatedShape
 * @overload
 * @param {Scalar | number} count
 * @param {RepeatedShapeAttributes | Shape} [attributes]
 * @param {...Shape[]} shapes
 * @returns RepeatedShape
 * @function
 * @param {...unknown} args
 * @returns RepeatedShape
 */
export function repeated(...args) {
  return new RepeatedShape(...(/** @type {[]} */ (args)));
}

/**
 * ...
 * @template {Numeric} T
 * @extends {Value<T>}
 */
export class AddValue extends Value {
  /**
   * ...
   * @type {Value<T>[]}
   */
  values;

  /**
   * @param {Value<T>} a
   * @param {Value<T>} b
   * @param {Value<T>[]} values
   */
  constructor(a, b, ...values) {
    super(a.type);
    this.values = [a, b, ...values];
  }

  // TODO design without chaining
  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    for (const value of this.values) {
      value.bind(shape, reference);
    }
  }

  compute() {
    return this.values.map(value => value.evaluate()).reduce((a, b) => a + b);
  }
}

/**
 * ...
 * @template {Numeric} T
 * @param {Value<T>} a
 * @param {Value<NoInfer<T>>} b
 * @param {Value<NoInfer<T>>[]} values
 * @returns {AddValue<T>}
 */
export function add(a, b, ...values) {
  return new AddValue(a, b, ...values);
}

/**
 * ...
 * @template {Numeric} [T = "scalar"]
 * @extends {Value<T>}
 */
export class SubtractValue extends Value {
  /**
   * ...
   * @type {Value<T>[]}
   */
  values;

  // OQ how to not allow mixing and matching of number and other Values?
  /**
   * @param {Value<T> | number} a
   * @param {Value<NoInfer<T>> | number} b
   * @param {(Value<NoInfer<T>> | number)[]} values
   */
  constructor(a, b, ...values) {
    if (typeof a === "number") {
      a = /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(a)));
    }
    super(a.type);
    this.values = [
      a, ...[b, ...values].map(
        value => typeof value === "number"
          ? /** @type {Value<T>} */ (/** @type {unknown} */ (scalar(value)))
          : value,
      ),
    ];
  }

  /**
   * @param {Shape} shape
   * @param {Shape | p5} reference
   */
  bind(shape, reference) {
    super.bind(shape, reference);
    for (const value of this.values) {
      value.bind(shape, reference);
    }
  }

  compute() {
    return this.values.map(value => value.evaluate()).reduce((a, b) => a - b);
  }
}

/**
 * @template {Numeric} [T = "scalar"]
 * @param {Value<T> | number} a
 * @param {Value<NoInfer<T>> | number} b
 * @param {(Value<NoInfer<T>> | number)[]} values
 * @returns {SubtractValue<T>}
 */
export function subtract(a, b, ...values) {
  return new SubtractValue(a, b, ...values);
}
