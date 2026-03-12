import p5 from "p5";
import {
  Ellipse, Rectangle, Text, Triangle, body, color, edge, h, multiply, px, repeated, tr, transparent,
  tween, variable, w, wave, linear,
} from "#sticky";

// XXX cant assigne to multiple
const TOP = () => body(1 / 2, 0);
const BOTTOM = () => body(1 / 2, 1);

new p5((p) => {
  const verbose = "verbose" in p.getURLParams();

  const earW = w(1 / 3 / 2);
  const earH = h(3 / 4 * earW.value);
  const model = new Rectangle(
    {
      // water
      // length + tween duration determine time frequency, e.g. now 1/4s
      warp: wave(h(1), tween(h(0), h(1), 4, { easing: linear })),
      // glitch/line
      // warp: wave(px(4), tween(h(0), h(1), 2, { easing: linear })),
      fill: transparent(),
      // fill: variable("black", "color"),
      stroke: transparent(),
    },

    // Stars
    ...[...Array(128)].map(() => {
      const r = px(p.random(1, 4));
      return new Ellipse(r, r, body(p.random(), p.random()), { fill: variable("white", "color") });
    }),
    // repeated(
    //   128,
    //   new Ellipse(random(px(1), px(4)), body(random(), random())),
    // ),

    // TODO add rectangle ground (?)
    // Cat
    new Ellipse(
      h(1 / 2), h(1 / 2),
      body(
        w(1 / 2), tween(h(1 / 2 - 1 / 2 / 16 / 2), h(1 / 2 + 1 / 2 / 16 / 2), 2, { yoyo: true }),
      ),
      { stroke: variable("pink", "color"), fill: variable("black", "color") },
      // Tail
      new Ellipse(
        w(1 / 16), h(1), body(1 / 2, 1 - 1 / 16 / 2),
        { orientation: 12 / 16, stroke: variable("pink", "color"), start: 1 / 2 },
        // new Ellipse(
        //   1 / 3, 1 / 3, body(1 / 2, 1 / 3 / 16),
        //   { orientation: 1 / 16, stroke: "pink", start: 1 / 2 },
        // ),
      ),
      // Cover
      new Ellipse(),
      // Face
      new Ellipse(
        w(1 / 2), h(1 / 2), TOP(), { anchor: TOP(), stroke: transparent(), fill: transparent() },
        // Eyes
        new Ellipse(
          w(1 / 4), h(1 / 4), body(1 / 4, 1 / 2),
          { stroke: variable("pink", "color"), fill: variable("black", "color") },
          new Ellipse(w(1 / 2), h(1 / 2), { fill: variable("pink", "color") }),
        ),
        new Ellipse(
          w(1 / 4), h(1 / 4), body(3 / 4, 1 / 2),
          { stroke: variable("pink", "color"), fill: variable("black", "color") },
          new Ellipse(w(1 / 2), h(1 / 2), { fill: variable("pink", "color") }),
        ),
        // Sleepy eyes
        new Ellipse(
          w(1 / 4), h(1 / 4), body(1 / 4, 1 / 2), { stroke: variable("pink", "color"), end: 1 / 2 },
        ),
        new Ellipse(
          w(1 / 4), h(1 / 4), body(3 / 4, 1 / 2), { stroke: variable("pink", "color"), end: 1 / 2 },
        ),
        // Mouth
        new Ellipse(
          w(1 / 8), h(1 / 8), body(1 / 2, 5 / 6), {},
          new Ellipse(
            w(1), h(1), body(0, 0),
            { stroke: variable("pink", "color"), fill: variable("black", "color"), end: 1 / 2 },
          ),
          new Ellipse(
            w(1), h(1), body(1, 0),
            { stroke: variable("pink", "color"), fill: variable("black", "color"), end: 1 / 2 },
          ),
          // new Triangle(
          //   1 / 2, 1 / 2, body(1 / 2, -1 / 2 / 2), { orientation: 1 / 2, fill: "pink" }
          // ),
        ),
      ),
      // Ears
      // TODO new Triangle(1 / 4, 1 / 4, body(1 / 2, 0), { anchor: body(1 / 2, 1) }),
      new Triangle(
        earW, earH, edge(0, 22 / 32, h(earH.value / 2 - earH.value / 8)), { start: 1, end: 3 },
      ),
      new Triangle(
        earW, earH, edge(0, 26 / 32, h(earH.value / 2 - earH.value / 8)), { start: 1, end: 3 },
      ),
      // Paws
      new Ellipse(
        w(1 / 8), h(1 / 8), BOTTOM(), { anchor: body(1, 3 / 4), end: 1 / 2 },
      ),
      new Ellipse(
        w(1 / 8), h(1 / 8), BOTTOM(), { anchor: body(0, 3 / 4), end: 1 / 2 },
      ),
    ),

    repeated(
      5,
      new Ellipse(
        h(1 / 8), h(1 / 8), body(multiply(h(1 / 8), variable("i", "scalar")), 1 / 2),
        { fill: variable("pink", "color") },
      ),
    ),

    // huh, only shows from 21px on, so proabably line height?
    new Text(
      "Sticky Demo 0.1", w(1), px(24), body(0, 1), // body(px(640 / 2 + 24), px(360 - 24 - 24 / 2)),
      {
        anchor: body(h(-1), 2),
        fill: variable("white", "color"),
        stroke: variable("black", "color"),
      },
    ),
  );

  // TODO variables: {...}
  model.setVariable("black", color(tr(0), 1, 0));
  model.setVariable("white", color(tr(0), 1, 1));
  model.setVariable("pink", color(tr(350 / 360), 100 / 100, 88 / 100));

  p.setup = () => {
    p.createCanvas(640, 360);
    p.colorMode(p.HSL);
  };

  p.draw = () => {
    p.background("black");
    // p.clear();
    p.textFont("sans-serif", 16);
    p.textStyle(p.ITALIC);
    p.textLeading(3 / 2 * 16);
    // p.textSize(16);

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
    const color = t ? transparent() : variable("pink", "color");

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
