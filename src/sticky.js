/** Library for describing and rendering 2D models made entirely of simple shapes. */

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
 * Result type of each dynamic value type.
 * @typedef ValueTypes
 * @property {number} length - Length quantity.
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
   * @param {T} type
   */
  constructor(type) {
    this.type = type;
  }

  /**
   * Determine the value in viewport units.
   * @returns {ValueTypes[T]}
   */
  evaluate() {
    return this.compute();
  }

  /**
   * Subclass: Compute the value in viewport units.
   * @returns {ValueTypes[T]}
   */
  compute() {
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
