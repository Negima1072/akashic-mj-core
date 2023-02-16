import * as Mahjong from "../src";

describe("Mahjong.BoardShan", () => {
  test("classが存在すること", () => {
    expect(Mahjong.BoardShan).toBeDefined();
  });

  describe("constructor()", () => {
    test("インスタンスが生成できること", () => {
      expect(new Mahjong.BoardShan("m1")).toBeDefined()
    });
    test("インスタンス生成時はドラ表示牌の長さが1であること", () => {
      expect(new Mahjong.BoardShan("m1").baopai.length).toEqual(1);
    });
  });

  describe("zimo(p)", () => {
    const boradShan = new Mahjong.BoardShan("m1");
    test("ツモを切りができること", () => {
      expect(boradShan.zimo("m2")).toEqual("m2");
    });
    test("山の牌数が正常になること", () => {
      expect(boradShan.paishu).toEqual(136 - 13 * 4 - 14 - 1);
    });
    test("裏表示のツモを切りができること", () => {
      expect(boradShan.zimo()).toEqual("_");
    });
  });

  describe("kaigang(p)", () => {
    const boradShan = new Mahjong.BoardShan("m1");
    test("カンができること", () => {
      expect(() => boradShan.kaigang("m5")).not.toThrow();
    });
    test("正常にカンドラが反映されること", () => {
      expect(boradShan.baopai.length).toEqual(2);
    });
  });
});
