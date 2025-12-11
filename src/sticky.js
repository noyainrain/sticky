/** Library for describing and rendering 2D models made entirely of simple shapes. */

import p5 from "p5";

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
 * @property {number} length - Length quantity.
 * @property {Point} position - Position, i.e. the description of a point in space.
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
   * @param {Shape | p5} reference - Reference shape or canvas for relative values.
   */
  bind(reference) {
    this.reference = reference;
    this.#cache = undefined;
  }

  /**
   * Determine the value in viewport units.
   * @returns {ValueTypes[T]}
   */
  evaluate() {
    if (this.#cache === undefined) {
      if (!this.reference) {
        throw new Error("Unbound value");
      }
      this.#cache = this.compute(this.reference);
    }
    return this.#cache;
  }

  /**
   * Subclass: Compute the value in viewport units.
   * @param {Shape | p5} reference - Reference shape or canvas for relative values.
   * @returns {ValueTypes[T]}
   */
  // eslint-disable-next-line no-unused-vars
  compute(reference) {
    throw new Error("Abstract method");
  }
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
   * @param {Shape | p5} reference
   */
  compute(reference) {
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
   * @param {Shape | p5} reference
   */
  compute(reference) {
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
   * @param {Shape | p5} reference
   */
  bind(reference) {
    super.bind(reference);
    this.x.bind(reference);
    this.y.bind(reference);
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

/**
 * Shape attributes.
 * @typedef ShapeAttributes
 * @property {Value<"length">} [width]
 * @property {Value<"length">} [height]
 * @property {Value<"position">} [at]
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
    this.width.bind(this.base ?? p);
    this.height.bind(this.base ?? p);
    this.at.bind(this.base ?? p);

    p.push();
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

/**
 * Triangle.
 */
export class Triangle extends Shape {
  /**
   * @param {p5} p
   */
  renderShape(p) {
    //     ^ C
    //    / \
    // B .---. A
    const width = this.width.evaluate();
    const height = this.height.evaluate();
    p.triangle(width, height, 0, height, width / 2, 0);
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
    const width = this.width.evaluate();
    const height = this.height.evaluate();
    p.ellipse(width / 2, height / 2, width, height);
  }
}
