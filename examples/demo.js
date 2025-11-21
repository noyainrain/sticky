import p5 from "p5";
import { Ellipse, body, h, w } from "#sticky";

new p5((p) => {
  const model = new Ellipse(
    h(1 / 2), h(1 / 2), body(1 / 2, 1 / 2),
    // Eye
    new Ellipse(
      w(1 / 4), h(1 / 4 * 2 / 3), body(1 / 4, 1 / 2),
      new Ellipse(w(1 / 2), w(1 / 2), body(1 / 2, 1 / 2)),
    ),
    new Ellipse(
      w(1 / 4), h(1 / 4 * 2 / 3), body(3 / 4, 1 / 2),
      new Ellipse(w(1 / 2), w(1 / 2), body(1 / 2, 1 / 2)),
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
    p.stroke(100);
    model.render(p);
  };
});
