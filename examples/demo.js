import p5 from "p5";
import { Ellipse, Triangle, body, h, w } from "#sticky";

new p5((p) => {
  // TODO add rectangle ground (?)
  const model = new Ellipse(
    h(1 / 2), h(1 / 2), body(1 / 2, 1 / 2), { stroke: "pink" },
    // Ear
    new Triangle(w(1 / 4), h(1 / 4), body(1 / 2, 1 / 4)),
    // Eye
    new Ellipse(
      w(1 / 4), h(1 / 4 * 2 / 3), body(1 / 4, 1 / 2), {},
      new Ellipse(w(1 / 2), w(1 / 2), body(1 / 2, 1 / 2), { fill: "pink" }),
    ),
    new Ellipse(
      w(1 / 4), h(1 / 4 * 2 / 3), body(3 / 4, 1 / 2), {},
      new Ellipse(w(1 / 2), w(1 / 2), body(1 / 2, 1 / 2), { fill: "pink" }),
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
