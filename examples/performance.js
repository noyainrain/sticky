import p5 from "p5";
import { Ellipse, Triangle, body, px } from "#sticky";

const SHAPES = [Triangle, Ellipse];

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
        const Shape = SHAPES[Math.trunc(Math.random() * SHAPES.length)];
        if (!Shape) {
          throw new Error("no");
        }
        const shape = new Shape(size, size, body(p.random(), p.random()));
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
