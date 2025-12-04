/** Library for describing and rendering 2D models made entirely of simple shapes. */

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
