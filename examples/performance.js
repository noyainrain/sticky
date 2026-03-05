import p5 from "p5";
import { Ellipse, Rectangle, Triangle, assert, body, color, px, tr, variable } from "#sticky";

const SHAPES = [
  { Shape: Triangle, edges: 3 }, { Shape: Rectangle, edges: 4 }, { Shape: Ellipse, edges: 1 },
];

// https://en.wikipedia.org/wiki/Color_Graphics_Adapter#Color_palette
const PALETTE = {
  black: color(tr(0), 0, 0),
  blue: color(tr(4 / 6), 1, 1 / 3),
  green: color(tr(2 / 6), 1, 1 / 3),
  cyan: color(tr(3 / 6), 1, 1 / 3),
  red: color(tr(0 / 6), 1, 1 / 3),
  magenta: color(tr(5 / 6), 1, 1 / 3),
  brown: color(tr(1 / 12), 1, 1 / 3),
  lightGray: color(tr(0), 0, 2 / 3),
  darkGray: color(tr(0), 0, 1 / 3),
  lightBlue: color(tr(4 / 6), 1, 2 / 3),
  lightGreen: color(tr(2 / 6), 1, 2 / 3),
  lightCyan: color(tr(3 / 6), 1, 2 / 3),
  lightRed: color(tr(0 / 6), 1, 2 / 3),
  lightMagenta: color(tr(5 / 6), 1, 2 / 3),
  yellow: color(tr(1 / 6), 1, 2 / 3),
  white: color(tr(0), 0, 3 / 3),
};
// const palette = Object.values(PALETTE);
const palette = Object.keys(PALETTE);

new p5((p) => {
  const size = px(360 / 8);
  const model = new Ellipse(px(640), px(360));
  // TODO vars in constr
  for (const [name, color] of Object.entries(PALETTE)) {
    model.setVariable(name, color);
  }

  const target = 1000 / 60;
  const f = 1.01;
  let count = 1000;
  let min = count;
  let max = count;
  let minAge = 0;
  let maxAge = 0;

  p.setup = () => {
    p.createCanvas(640, 360);
  };

  p.draw = () => {
    minAge++;
    maxAge++;

    const hit = p.deltaTime < target * 1.1;
    if (hit) {
      min = count;
      minAge = 0;
    } else {
      max = count;
      maxAge = 0;
    }

    const estMin = Math.trunc(min * Math.pow(f, -minAge));
    const estMax = Math.trunc(max * Math.pow(f, maxAge));
    const delta = estMax - estMin;
    // n = (estMin + estMax) / 2;
    count = Math.trunc(estMin + delta / 2);

    // if (Math.abs(n - estimate) / n >= 0.1) {
    // if (Math.abs(medianTime - target) / target >= 0.1) {
    const diff = count - model.links.length;
    // console.log(diff);
    if (diff < 0) {
      model.unstick(...model.links.slice(diff));
    } else {
      for (let i = 0; i < diff; i++) {
        const meta = p.random(SHAPES);
        const color = Math.trunc(p.random(0, 8));
        const strokeName = palette[color];
        assert(strokeName);
        const fillName = palette[color + 8];
        assert(fillName);
        const shape = new meta.Shape(
          size, size, body(p.random(), p.random()),
          {
            orientation: p.random(),
            fill: variable(fillName, "color"),
            stroke: variable(strokeName, "color"),
            // OQ maybe partial should be something to activate? introduces additional shape points
            // - seems like extra feature?
            end: p.random(meta.edges / 2, meta.edges),
          },
        );
        model.stick(shape);
        // model.links.unshift(shape)
        shape.base = model;
      }
    }

    p.fill("black");
    p.stroke("white");
    model.render(p);

    p.fill("red");
    p.stroke("black");
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(
      [
        `${count.toFixed()} in ${p.deltaTime.toFixed(1)}ms / ${p.frameRate().toFixed()}fps`,
        `${estMin.toFixed()} - ${estMax.toFixed()} (${delta.toFixed()})`,
      ].join("\n"),
      p.width, 0,
    );
    // console.log(performance.now());
  };
});
