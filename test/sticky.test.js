import { expect } from "chai";
import { argumentStream, px } from "#sticky";

describe("argumentStream", function () {
  describe("call", function () {
    const args = [[], new Date()];
    /** @type {import("#sticky").NextCallback} */
    let next;

    beforeEach(function () {
      next = argumentStream(args);
    });

    it("should match", function () {
      const a = next(Array);
      const b = next(Date);
      expect(a.value).to.equal(args[0]);
      expect(a.done).to.be.false;
      expect(b.value).to.not.equal(undefined);
    });

    it("should not match", function () {
      const a = next(Date);
      const b = next(Array);
      expect(a.value).to.equal(undefined);
      expect(a.done).to.be.false;
      expect(b.value).to.not.equal(undefined);
    });

    it("should end", function () {
      next(Array);
      next(Date);
      const c = next(Date);
      expect(c.value).to.equal(undefined);
      expect(c.done).to.be.true;
    });
  });
});

describe("PixelLengthValue", function () {
  describe("evaluate", function () {
    it("should determine value", function () {
      const value = px(360);
      const result = value.evaluate();
      expect(result).to.equal(value.value);
    });
  });
});
