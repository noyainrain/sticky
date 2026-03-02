import { expect } from "chai";
import p5 from "p5";
import {
  ConstValue, Ellipse, Rectangle, Triangle, argumentStream, assert, body, color, h, hued, px,
  scalar, tr, tween, variable, w,
} from "#sticky";

// OQ or just path in general?
/** @typedef {[string, ...unknown[]]} PathCommand */

/**
 * @typedef DrawCommand
 * @property {"fill" | "stroke"} type
 * @property {PathCommand[]} path
 */

/**
 * @typedef {HTMLCanvasElement & RecordedCanvasProperties} RecordedCanvas
 * @typedef RecordedCanvasProperties
 * @property {DrawCommand[]} commands
 */

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {RecordedCanvas}
 */
function recordedCanvas(canvas) {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new TypeError("Bad canvas context type");
  }
  /** @type {PathCommand[]} */
  let path = [];
  /** @type {DrawCommand[]} */
  const commands = [];

  // Patch because
  // Inherit from anything but HTMLElement is forbidden
  // DOM does not accept Proxy objects, e.g. for append
  Object.defineProperties(context, {
    beginPath: {
      value: () => {
        CanvasRenderingContext2D.prototype.beginPath.call(context);
        path = [];
      },
    },

    moveTo: {
      /**
       * @param {number} x
       * @param {number} y
       */
      value: (x, y) => {
        CanvasRenderingContext2D.prototype.moveTo.call(context, x, y);
        path.push(["moveTo", x, y]);
      },
    },

    lineTo: {
      /**
       * @param {number} x
       * @param {number} y
       */
      value: (x, y) => {
        CanvasRenderingContext2D.prototype.lineTo.call(context, x, y);
        path.push(["lineTo", x, y]);
      },
    },

    ellipse: {
      /**
       * @param {number} x
       * @param {number} y
       * @param {number} radiusX
       * @param {number} radiusY
       * @param {number} rotation
       * @param {number} startAngle
       * @param {number} endAngle
       */
      value: (x, y, radiusX, radiusY, rotation, startAngle, endAngle) => {
        CanvasRenderingContext2D.prototype.ellipse.call(
          context, x, y, radiusX, radiusY, rotation, startAngle, endAngle,
        );
        path.push(["ellipse", x, y, radiusX, radiusY, rotation, startAngle, endAngle]);
      },
    },

    rect: {
      /**
       * @param {number} x
       * @param {number} y
       * @param {number} width
       * @param {number} height
       */
      value: (x, y, width, height) => {
        CanvasRenderingContext2D.prototype.rect.call(context, x, y, width, height);
        path.push(["rect", x, y, width, height]);
      },
    },

    fill: {
      value: () => {
        // TODO look up issue
        // Work around TypeScript binding wrong overload
        // @ts-ignore
        CanvasRenderingContext2D.prototype.fill.call(context);
        commands.push({ type: "fill", path: [...path] });
      },
    },

    stroke: {
      value: () => {
        // Work around TypeScript binding wrong overload
        // @ts-ignore
        CanvasRenderingContext2D.prototype.stroke.call(context);
        commands.push({ type: "stroke", path: [...path] });
      },
    },
  });

  Object.defineProperty(canvas, "commands", { value: commands });
  return /** @type {RecordedCanvas} */ (canvas);
}

/**
 * @param {OnSketchSetUpCallback} onSketchSetUp
 * @callback OnSketchSetUpCallback
 * @param {p5} p
 * @param {RecordedCanvas} canvas
 */
function beforeEachSetUpSketch(onSketchSetUp) {
  beforeEach(async function () {
    const canvas = recordedCanvas(document.createElement("canvas"));
    const p = await new Promise((resolve) => {
      new p5((p) => {
        p.setup = () => {
          p.createCanvas(640, 360, p.P2D, canvas);
          resolve(p);
        };
      });
    });
    onSketchSetUp(p, canvas);
  });
}

describe("argumentStream", function () {
  describe("call", function () {
    const args = [[], new Date()];
    /** @type {import("#sticky").NextCallback} */
    let next;

    beforeEach(function () {
      next = argumentStream(args);
    });

    it("should match", function () {
      const a = next(Array);
      const b = next(Date);
      expect(a.value).to.equal(args[0]);
      expect(a.done).to.be.false;
      expect(b.value).to.not.equal(undefined);
    });

    it("should not match", function () {
      const a = next(Date);
      const b = next(Array);
      expect(a.value).to.equal(undefined);
      expect(a.done).to.be.false;
      expect(b.value).to.not.equal(undefined);
    });

    it("should end", function () {
      next(Array);
      next(Date);
      const c = next(Date);
      expect(c.value).to.equal(undefined);
      expect(c.done).to.be.true;
    });
  });
});

describe("VariableValue", function () {
  /** @type {p5} */
  let p;

  beforeEachSetUpSketch((newP) => {
    p = newP;
  });

  describe("evaluate", function () {
    it("should determine value", function () {
      const shape = new Ellipse();
      // TODO set in constr
      shape.setVariable("foo", scalar(7));
      shape.render(p);
      const value = variable("foo", "scalar");
      value.bind(shape, shape);
      const result = value.evaluate();
      expect(result).to.equal(7);
    });
  });
});

/**
 * @param {MakeValueCallback} makeValue
 * @callback MakeValueCallback
 * @returns {import("#sticky").Value<keyof import("#sticky").ValueTypes>}
 */
function itShouldBehaveLikeValue(makeValue) {
  describe("bind", function () {
    it("should bind value", function () {
      const reference = new Ellipse();
      const value = makeValue();
      value.bind(reference, reference);
      expect(value.reference).to.equal(reference);
    });
  });
}

describe("ConstValue", function () {
  describe("evaluate", function () {
    it("should determine value", function () {
      const reference = new Ellipse();
      const value = scalar(7);
      value.bind(reference, reference);
      const result = value.evaluate();
      expect(result).to.equal(value.value);
    });
  });
});

describe("PixelLengthValue", function () {
  itShouldBehaveLikeValue(() => px(360));

  describe("evaluate", function () {
    it("should determine value", function () {
      const shape = new Ellipse();
      const value = px(360);
      value.bind(shape, shape);
      const result = value.evaluate();
      expect(result).to.equal(value.value);
    });
  });
});

describe("WidthLengthValue", function () {
  /** @type {p5} */
  let p;
  /** @type {import("#sticky").WidthLengthValue} */
  let value;

  beforeEachSetUpSketch((newP) => {
    p = newP;
  });

  beforeEach(function () {
    value = w(1 / 2);
  });

  itShouldBehaveLikeValue(() => value);

  describe("evaluate", function () {
    it("should determine value", function () {
      const shape = new Ellipse();
      shape.render(p);
      value.bind(shape, shape);
      const result = value.evaluate();
      expect(result).to.equal(p.width / 2);
    });
  });
});

describe("HeightLengthValue", function () {
  /** @type {p5} */
  let p;
  /** @type {import("#sticky").HeightLengthValue} */
  let value;

  beforeEachSetUpSketch((newP) => {
    p = newP;
  });

  beforeEach(function () {
    value = h(1 / 2);
  });

  itShouldBehaveLikeValue(() => value);

  describe("evaluate", function () {
    it("should determine value", function () {
      const shape = new Ellipse();
      shape.render(p);
      value.bind(shape, shape);
      const result = value.evaluate();
      expect(result).to.equal(p.height / 2);
    });
  });
});

describe("TurnAngleValue", function () {
  describe("evaluate", function () {
    it("should determine value", function () {
      const shape = new Ellipse();
      const value = tr(1 / 2);
      value.bind(shape, shape);
      const result = value.evaluate();
      expect(result).to.equal(Math.PI);
    });
  });
});

describe("ColorValue", function () {
  /** @type {p5} */
  let p;

  beforeEachSetUpSketch((newP) => {
    p = newP;
  });

  describe("evaluate", function () {
    it("should determine value", function () {
      const shape = new Ellipse();
      shape.render(p);
      const value = color(tr(1 / 2), 1, 1 / 2, { alpha: 1 / 4 });
      value.bind(shape, shape);
      const result = value.evaluate();
      expect(result.toString()).to.equal("hsl(180 100% 50% / 0.25)");
    });
  });
});

describe("HuedValue", function () {
  /** @type {p5} */
  let p;

  beforeEachSetUpSketch((newP) => {
    p = newP;
  });

  describe("evaluate", function () {
    it("should determine value", function () {
      const shape = new Ellipse();
      shape.render(p);
      const value = hued(color(tr(1 / 4), 1, 1 / 2), tr(-1 / 2));
      value.bind(shape, shape);
      const result = value.evaluate();
      expect(result.toString()).to.equal("hsl(270 100% 50%)");
    });
  });
});

describe("TweenValue", function () {
  /** @type {p5} */
  let p;

  beforeEachSetUpSketch((newP) => {
    p = newP;
  });

  describe("evaluate", function () {
    it("should determine value", function () {
      const shape = new Ellipse();
      shape.render(p);
      p.millis = () => 1000;
      const value = tween(2, 4, 2);
      value.bind(shape, shape);

      const result = value.evaluate();
      expect(result).to.equal(3);
    });
  });
});

/**
 * @param {new (...links: import("#sticky").Shape[]) => import("#sticky").Shape} Shape
 */
function itShouldBehaveLikeShape(Shape) {
  describe("stick", function () {
    it("should link shapes", function () {
      /** @type {[import("#sticky").Shape, import("#sticky").Shape, import("#sticky").Shape]} */
      const links = [new Shape(), new Shape(), new Shape()];
      const base = new Shape(links[0]);
      const otherBase = new Shape(links[1]);

      base.stick(...links.slice(1));
      expect(base.links).to.deep.equal(links);
      expect(links.every(link => link.base === base)).to.be.true;
      expect(otherBase.links).to.deep.equal([]);
    });
  });

  describe("unstick", function () {
    it("should unlink shapes", function () {
      /** @type {[import("#sticky").Shape, import("#sticky").Shape, import("#sticky").Shape]} */
      const links = [new Shape(), new Shape(), new Shape()];
      const base = new Shape(...links);

      base.unstick(...links.slice(1));
      expect(base.links).to.deep.equal([links[0]]);
      expect(links[0].base).to.equal(base);
      expect(links.slice(1).every(link => !link.base)).to.be.true;
    });
  });

  describe("setVariable", function () {
    it("should set variable", function () {
      const shape = new Ellipse();
      shape.setVariable("foo", scalar(42));
      const value = shape.getVariable("foo", "scalar");
      assert(value instanceof ConstValue);
      expect(value.type).to.equal("scalar");
      expect(value.value).to.equal(42);
    });
  });

  describe("getVariable", function () {
    it("should get parent variable", function () {
      const link = new Ellipse();
      const base = new Ellipse(link);
      base.setVariable("foo", scalar(42));
      const value = link.getVariable("foo", "scalar");
      assert(value instanceof ConstValue);
      expect(value.type).to.equal("scalar");
      expect(value.value).to.equal(42);
    });
  });
}

describe("Triangle", function () {
  /** @type {p5} */
  let p;
  /** @type {RecordedCanvas} canvas */
  let canvas;

  beforeEachSetUpSketch((newP, newCanvas) => {
    p = newP;
    canvas = newCanvas;
  });

  itShouldBehaveLikeShape(Triangle);

  describe("render", function () {
    it("should render shape", function () {
      const triangle = new Triangle(px(canvas.width), px(canvas.height));
      triangle.render(p);
      // p5 draws shapes / polygons with Path2D which is not inspectible :(
      expect(canvas.commands[0]?.type).to.equal("fill");
      expect(canvas.commands[1]?.type).to.equal("stroke");
    });
  });
});

describe("Rectangle", function () {
  /** @type {p5} */
  let p;
  /** @type {RecordedCanvas} canvas */
  let canvas;

  beforeEachSetUpSketch((newP, newCanvas) => {
    p = newP;
    canvas = newCanvas;
  });

  describe("render", function () {
    it("should render shape", function () {
      const rectangle = new Rectangle(px(p.width), px(p.height));
      rectangle.render(p);
      // p5 draws shapes / polygons with Path2D which is not inspectible :(
      expect(canvas.commands[0]?.type).to.equal("fill");
      expect(canvas.commands[1]?.type).to.equal("stroke");
    });
  });
});

describe("Ellipse", function () {
  /** @type {p5} */
  let p;
  /** @type {RecordedCanvas} canvas */
  let canvas;

  beforeEachSetUpSketch((newP, newCanvas) => {
    p = newP;
    canvas = newCanvas;
  });

  itShouldBehaveLikeShape(Ellipse);

  // TODO move to shapetest
  describe("constructor", function () {
    it("should do something", function () {
      const attributes = { width: px(3), height: px(4) };
      const links = [new Ellipse()];
      const shape = new Ellipse(px(1), px(2), attributes, ...links);
      expect(shape.width).to.equal(attributes.width);
      expect(shape.height).to.equal(attributes.height);
      expect(shape.links).to.deep.equal(links);
    });

    it("should do more", function () {
      const width = px(1);
      const height = px(2);
      const shape = new Ellipse(width, height);
      expect(shape.width).to.equal(width);
      expect(shape.height).to.equal(height);
      expect(shape.links).to.deep.equal([]);
    });
  });

  // TODO move to shape test
  describe("pick", function () {
    it("should pick shape", function () {
      const link = new Ellipse(w(1 / 2), h(1 / 2));
      const shape = new Ellipse(link);
      shape.render(p);
      const picked = shape.pick(new p5.Vector(p.width / 2, p.height / 2));
      expect(picked).to.equal(link);
    });

    it("should pick shape", function () {
      const link = new Ellipse(w(1 / 2), h(1 / 2));
      const shape = new Ellipse(link);
      shape.render(p);
      const picked = shape.pick(new p5.Vector(p.width * 5 / 16, p.height * 5 / 16));
      expect(picked).to.equal(shape);
    });

    it("should pick shape", function () {
      const link = new Ellipse(w(1 / 2), h(1 / 2));
      const shape = new Ellipse(link);
      shape.render(p);
      const picked = shape.pick(new p5.Vector(p.width / 8, p.height / 8));
      expect(picked).to.be.undefined;
    });
  });

  describe("renderX", function () {
    it("should render shape", function () {
      const shape = new Ellipse(new Ellipse());
      shape.render(p);
      expect(canvas.commands.map(command => command.type)).to.deep.equal(
        ["fill", "stroke", "fill", "stroke"],
      );
    });
  });

  describe("render", function () {
    it("should render shape", function () {
      const ellipse = new Ellipse(
        px(p.width), px(p.height), body(1 / 2, 1 / 2), { start: 1 / 3, end: 2 / 3 },
      );
      ellipse.render(p);
      expect(canvas.commands[0]?.type).to.equal("fill");
      const path = canvas.commands[0]?.path[0];
      if (!path) {
        throw new Error("aaaaaaaaaaaa");
      }
      const radiusX = canvas.width / 2;
      const radiusY = canvas.height / 2;
      expect(path.slice(0, 6)).to.deep.equal(["ellipse", radiusX, radiusY, radiusX, radiusY, 0]);
      // p5 does some fancy ellipse correction of the angle
      expect(path[6]).to.be.greaterThan(0);
      expect(path[7]).to.be.lessThan(2 * Math.PI);
      expect(canvas.commands[1]?.type).to.equal("stroke");
    });
  });
});
