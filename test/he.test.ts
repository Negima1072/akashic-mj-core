import * as Mahjong from "../src";

describe("Mahjong.He", () => {
  test("classが存在すること", () => {
    expect(Mahjong.He).toBeDefined();
  });

  describe("constructor()", () => {
    test("インスタンスが生成できること", () => {
      expect(new Mahjong.He()).toBeDefined()
    });
    test("インスタンス生成時は捨て牌の長さが0であること", () => {
      expect(new Mahjong.He()._pai.length).toEqual(0);
    });
  });

  describe("dapai(p)", () => {
    test("不正な打牌ができないこと", () => {
      expect(() => new Mahjong.He().dapai('z8')).toThrow();
    });
    test("打牌後捨て牌の長さが1増えること", () => {
      const he = new Mahjong.He();
      expect(he.dapai('m1')._pai.length).toEqual(1);
    });
    test("ツモ切りを表現できること", () => {
      expect(new Mahjong.He().dapai("m1_")._pai.pop()).toEqual("m1_");
    });
    test("リーチを表現できること", () => {
      expect(new Mahjong.He().dapai("m1*")._pai.pop()).toEqual("m1*");
    });
    test("ツモ切りリーチを表現できること", () => {
      expect(new Mahjong.He().dapai("m1_*")._pai.pop()).toEqual("m1_*");
    });
  });

  describe("fulou(m)", () => {
    test("不正な面子で鳴けないこと", () => {
      expect(() => new Mahjong.He().dapai("m1").fulou("m1-")).toThrow();
      expect(() => new Mahjong.He().dapai("m1").fulou("m1111")).toThrow();
      expect(() => new Mahjong.He().dapai("m1").fulou("m12-3")).toThrow();
    });
    test("鳴かれても捨て牌の長さが変わらないこと", () => {
      const he = new Mahjong.He().dapai("m1_");
      expect(he.fulou("m111+")._pai.length).toEqual(1);
    });
    test("誰から鳴かれたか表現できること", () => {
      const he = new Mahjong.He().dapai("m2*");
      expect(he.fulou("m12-3")._pai.pop()).toEqual("m2*-");
    });
  });

  describe("find(p)", () => {
    const he = new Mahjong.He();
    test("捨てられた牌を探せること", () => {
      expect(he.dapai("m1").find("m1")).toEqual(true);
    });
    test("ツモ切りの牌を探せること", () => {
      expect(he.dapai("m2_").find("m2")).toEqual(true);
    });
    test("リーチ打牌を探せること", () => {
      expect(he.dapai("m3*").find("m3")).toEqual(true);
    });
    test("赤牌を探せること", () => {
      expect(he.dapai("m0").find("m5")).toEqual(true);
    });
    test("鳴かれた牌を探せること", () => {
      expect(he.dapai("m4_").fulou("m234-").find("m4")).toEqual(true);
    });
    test("入力が正規化されていない場合でも探せること", () => {
      expect(he.find("m0_*")).toEqual(true);
    });
  });
});
