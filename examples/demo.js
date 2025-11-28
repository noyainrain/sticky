import p5 from "p5";
import { Ellipse, Triangle, body, h, w } from "#sticky";

new p5((p) => {
  // TODO add rectangle ground (?)
  const model = new Ellipse(
    h(1 / 2), h(1 / 2), body(1 / 2, 1 / 2), { stroke: "pink", fill: "black" },
    // Ear
    new Triangle(w(1 / 4), h(1 / 4), body(1 / 2, 1 / 4), { start: 1, end: 3 }),
    // Eye
    new Ellipse(
      w(1 / 4), h(1 / 4 * 2 / 3), body(1 / 4, 1 / 2), {},
      new Ellipse(w(1 / 2), w(1 / 2), body(1 / 2, 1 / 2), { fill: "pink" }),
    ),
    new Ellipse(
      w(1 / 4), h(1 / 4 * 2 / 3), body(3 / 4, 1 / 2), {},
      new Ellipse(w(1 / 2), w(1 / 2), body(1 / 2, 1 / 2), { fill: "pink" }),
    ),
    // Mouth
    new Ellipse(
      w(1 / 8), h(1 / 8), body(1 / 2, 5 / 6), { fill: "pink" },
      new Ellipse(w(1), h(1), body(0, 0), { fill: "black", end: 1 / 2 }),
      new Ellipse(w(1), h(1), body(1, 0), { fill: "black", end: 1 / 2 }),
    ),
  );

  p.setup = () => {
    p.createCanvas(640, 360);
    p.colorMode(p.HSL);
  };

  p.draw = () => {
    p.colorMode(p.HSL);
    p.background(0);
    p.noFill();
    model.render(p);
  };
});
