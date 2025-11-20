import p5 from "p5";
import { Ellipse, px } from "#sticky";

new p5((p) => {
  const model = new Ellipse(px(180), px(180));

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
