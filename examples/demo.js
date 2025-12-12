import p5 from "p5";
import { Ellipse, Rectangle, Triangle, body, edge, h, px, w } from "#sticky";

new p5((p) => {
  const earW = w(1 / 3);
  const earH = h(3 / 4 * earW.value);
  const model = new Rectangle(
    w(1), h(1), body(1 / 2, 1 / 2), { fill: "black", stroke: null },

    // Stars
    ...[...Array(128)].map(() => {
      const r = px(p.random(1, 4));
      return new Ellipse(r, r, body(p.random(), p.random()), { fill: "white" });
    }),

    // Stars
    // repeated(
    //   100,
    //   new Ellipse(random(px(1), px(4)), body(random(), random())),
    // ),

    // TODO add rectangle ground (?)
    new Ellipse(
      h(1 / 2), h(1 / 2), body(1 / 2, 1 / 2), { stroke: "pink", fill: "black" },
      // Ear
      new Triangle(
        earW, earH, edge(0, 10 / 16, h(earH.value / 2 - earH.value / 8)), { start: 1, end: 3 },
      ),
      new Triangle(
        earW, earH, edge(0, 14 / 16, h(earH.value / 2 - earH.value / 8)), { start: 1, end: 3 },
      ),
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
        w(1 / 8), w(1 / 8), body(1 / 2, 5 / 6), { fill: "pink" },
        new Ellipse(w(1), h(1), body(0, 0), { fill: "black", end: 1 / 2 }),
        new Ellipse(w(1), h(1), body(1, 0), { fill: "black", end: 1 / 2 }),
      ),
    ),
  );

  p.setup = () => {
    p.createCanvas(640, 360);
    p.colorMode(p.HSL);
  };

  p.draw = () => {
    // const t = (p.millis() / 1000) / 4 % 1;
    // model.links[128].links[0].at = edge(0, t, h(1 / 4 / 2));
    model.render(p);
  };
});
