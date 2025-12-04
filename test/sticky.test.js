import { expect } from "chai";
import { px } from "#sticky";

describe("PixelLengthValue", function () {
  describe("evaluate", function () {
    it("should determine value", function () {
      const value = px(360);
      const result = value.evaluate();
      expect(result).to.equal(value.value);
    });
  });
});
