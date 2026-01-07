import p5 from "p5";
import { World } from "#orbit/world";

new p5((p) => {
  /** @type {World} */
  let world;

  p.setup = () => {
    p.createCanvas(640, 360);
    world = new World(p);

    // Dev console
    // Work around https://github.com/microsoft/TypeScript/issues/15626
    // @ts-ignore
    self.world = world;
  };

  p.draw = () => {
    world.render();
  };
});
