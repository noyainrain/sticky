import p5 from "p5";
import { Ellipse, Rectangle, Triangle, body, edge, h, px, tween, w } from "#sticky";

new p5((p) => {
  const verbose = "verbose" in p.getURLParams();

  const earW = w(1 / 3 / 2);
  const earH = h(3 / 4 * earW.value);
  const model = new Rectangle(
    w(1), h(1), body(1 / 2, 1 / 2), { fill: "black", stroke: null },

    // Stars
    ...[...Array(128)].map(() => {
      const r = px(p.random(1, 4));
      return new Ellipse(r, r, body(p.random(), p.random()), { fill: "white" });
    }),
    // repeated(
    //   128,
    //   new Ellipse(random(px(1), px(4)), body(random(), random())),
    // ),

    // TODO add rectangle ground (?)
    // Cat
    new Ellipse(
      h(1 / 2), h(1 / 2),
      body(w(1 / 2), tween(h(1 / 2 - 1 / 2 / 16 / 2), h(1 / 2 + 1 / 2 / 16 / 2), 2, { yoyo: true })),
      { stroke: "pink", fill: "black" },
      // Tail
      new Ellipse(
        w(1 / 16), h(1), body(1 / 2, 1 - 1 / 16 / 2),
        { orientation: 12 / 16, stroke: "pink", start: 1 / 2 },
        // new Ellipse(
        //   1 / 3, 1 / 3, body(1 / 2, 1 / 3 / 16),
        //   { orientation: 1 / 16, stroke: "pink", start: 1 / 2 },
        // ),
      ),
      // Cover
      new Ellipse(w(1), h(1)),
      // Face
      new Ellipse(
        w(1 / 2), h(1 / 2), body(1 / 2, 1 / 2 / 2), { stroke: null, fill: null },
        // Eyes
        new Ellipse(
          w(1 / 4), h(1 / 4), body(1 / 4, 1 / 2), { stroke: "pink", fill: "black" },
          new Ellipse(w(1 / 2), h(1 / 2), body(1 / 2, 1 / 2), { fill: "pink" }),
        ),
        new Ellipse(
          w(1 / 4), h(1 / 4), body(3 / 4, 1 / 2), { stroke: "pink", fill: "black" },
          new Ellipse(w(1 / 2), h(1 / 2), body(1 / 2, 1 / 2), { fill: "pink" }),
        ),
        // Sleepy eyes
        new Ellipse(
          w(1 / 4), h(1 / 4), body(1 / 4, 1 / 2), { stroke: "pink", end: 1 / 2 },
        ),
        new Ellipse(
          w(1 / 4), h(1 / 4), body(3 / 4, 1 / 2), { stroke: "pink", end: 1 / 2 },
        ),
        // Mouth
        new Ellipse(
          w(1 / 8), h(1 / 8), body(1 / 2, 5 / 6), {},
          new Ellipse(w(1), h(1), body(0, 0), { stroke: "pink", fill: "black", end: 1 / 2 }),
          new Ellipse(w(1), h(1), body(1, 0), { stroke: "pink", fill: "black", end: 1 / 2 }),
          // new Triangle(
          //   1 / 2, 1 / 2, body(1 / 2, -1 / 2 / 2), { orientation: 1 / 2, fill: "pink" }
          // ),
        ),
      ),
      // Ears
      new Triangle(
        earW, earH, edge(0, 22 / 32, h(earH.value / 2 - earH.value / 8)), { start: 1, end: 3 },
      ),
      new Triangle(
        earW, earH, edge(0, 26 / 32, h(earH.value / 2 - earH.value / 8)), { start: 1, end: 3 },
      ),
      // Paws
      new Ellipse(w(1 / 8), h(1 / 8), body(1 / 2 - 1 / 8 / 2, 1 - 1 / 8 / 4), { end: 1 / 2 }),
      new Ellipse(w(1 / 8), h(1 / 8), body(1 / 2 + 1 / 8 / 2, 1 - 1 / 8 / 4), { end: 1 / 2 }),
    ),
  );

  p.setup = () => {
    p.createCanvas(640, 360);
    p.colorMode(p.HSL);
  };

  p.draw = () => {
    /**
     * @param {number} progress
     */
    function easeIn(progress) {
      return 1 - Math.cos(progress * Math.PI / 2);
    }

    /**
     * @param {number} progress
     */
    // eslint-disable-next-line no-unused-vars
    function easeOn(progress) {
      return 1;
    }

    let duration = 2;
    let pause = 1;
    let offset = duration;
    let t = (p.millis() / 1000 + offset) / (duration + pause) % 1;
    t = t * (duration + pause) / duration;
    if (t >= 1) {
      t = 0;
    } else {
      t *= 2;
      t = t >= 1 ? 2 - t : t;
      t = easeIn(t);
    }
    let from = 12 / 16;
    let to = 13 / 16;
    const orientation = from + (to - from) * t;

    // from = 1 / 16;
    // to = -1 / 16;
    // const orientation2 = from + (to - from) * t;

    duration = 4;
    pause = 12;
    offset = duration;
    t = (p.millis() / 1000 + offset) / (duration + pause) % 1;
    t = t * (duration + pause) / duration;
    if (t >= 1) {
      t = 0;
    } else {
      t = easeOn(t);
    }
    const color = t ? null : "pink";

    // @ts-ignore
    model.links[128].links[0].orientation = orientation;
    // model.links[128].links[0].links[0].orientation = orientation2;
    // @ts-ignore
    model.links[128].links[2].links[0].stroke = color;
    // @ts-ignore
    model.links[128].links[2].links[0].links[0].fill = color;
    // @ts-ignore
    model.links[128].links[2].links[1].stroke = color;
    // @ts-ignore
    model.links[128].links[2].links[1].links[0].fill = color;

    model.render(p);

    if (verbose) {
      p.fill("white");
      p.textSize(16);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(
        `${p.frameRate().toFixed()} fps\n${p.width} x ${p.height} @ ${p.pixelDensity()}`,
        p.width - p.textSize(), p.textSize());
    }
  };
});
