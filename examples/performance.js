import p5 from "p5";
import { Ellipse, Rectangle, Triangle, body, px } from "#sticky";

const SHAPES = [
  { Shape: Triangle, edges: 3 }, { Shape: Rectangle, edges: 4 }, { Shape: Ellipse, edges: 1 },
];

const PALETTE = {
  black: "#000",
  blue: "#00a",
  green: "#0a0",
  cyan: "#0aa",
  red: "#a00",
  magenta: "#a0a",
  brown: "#a50",
  lightGray: "#aaa",
  darkGray: "#555",
  lightBlue: "#55f",
  lightGreen: "#5f5",
  lightCyan: "#5ff",
  lightRed: "#f55",
  lightMagenta: "#f5f",
  yellow: "#ff5",
  white: "#fff",
};
const palette = Object.values(PALETTE);

new p5((p) => {
  const size = px(360 / 8);
  const model = new Ellipse(px(640), px(360));

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
        const shape = new meta.Shape(
          size, size, body(p.random(), p.random()),
          {
            orientation: p.random(),
            fill: palette[color + 8],
            stroke: palette[color],
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
