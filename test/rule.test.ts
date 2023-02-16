import * as Mahjong from "../src";

describe("Mahjong.rule(p)", () => {
  test("ruleが生成できること", () => {
    expect(Mahjong.rule()).toBeDefined()
  });
  test("ruleのparamが正常に反映されること", () => {
    expect(Mahjong.rule({originPoint: 30000})).toHaveProperty("originPoint", 30000);
  });
});
