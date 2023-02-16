global.g = require("@akashic/akashic-engine");
import * as Mahjong from "../src";

describe("Mahjong.Shan", () => {
  test("classが存在すること", () => {
    expect(Mahjong.Shan).toBeDefined();
  });

  describe("static zhenbaopai(p)", () => {
    test("一萬 → 二萬", () => {
      expect(Mahjong.Shan.zhenbaopai("m1")).toEqual("m2");
    });
    test("九萬 → 一萬", () => {
      expect(Mahjong.Shan.zhenbaopai("m9")).toEqual("m1");
    });
    test("赤五萬 → 六萬", () => {
      expect(Mahjong.Shan.zhenbaopai("m0")).toEqual("m6");
    });
    test("一筒 → 二筒", () => {
      expect(Mahjong.Shan.zhenbaopai("p1")).toEqual("p2");
    });
    test("九筒 → 一筒", () => {
      expect(Mahjong.Shan.zhenbaopai("p9")).toEqual("p1");
    });
    test("赤五筒 → 六筒", () => {
      expect(Mahjong.Shan.zhenbaopai("p0")).toEqual("p6");
    });
    test("一索 → 二索", () => {
      expect(Mahjong.Shan.zhenbaopai("s1")).toEqual("s2");
    });
    test("九索 → 一索", () => {
      expect(Mahjong.Shan.zhenbaopai("s9")).toEqual("s1");
    });
    test("赤五索 → 六索", () => {
      expect(Mahjong.Shan.zhenbaopai("s0")).toEqual("s6");
    });
    test("東 → 南", () => {
      expect(Mahjong.Shan.zhenbaopai("z1")).toEqual("z2");
    });
    test("北 → 東", () => {
      expect(Mahjong.Shan.zhenbaopai("z4")).toEqual("z1");
    });
    test("白 → 發", () => {
      expect(Mahjong.Shan.zhenbaopai("z5")).toEqual("z6");
    });
    test("中 → 白", () => {
      expect(Mahjong.Shan.zhenbaopai("z7")).toEqual("z5");
    });
    test("不正な牌 → エラー", () => {
      expect(() => Mahjong.Shan.zhenbaopai("z0")).toThrow();
    });
  });

  describe("constructor()", () => {
    test("インスタンスが生成できること", () => {
      expect(new Mahjong.Shan(Mahjong.rule())).toBeDefined();
    });
    test("赤牌なしでインスタンスが生成できること", () => {
      const pai =
        "m1,m1,m1,m1,m2,m2,m2,m2,m3,m3,m3,m3,m4,m4,m4,m4,m5,m5,m5,m5," +
        "m6,m6,m6,m6,m7,m7,m7,m7,m8,m8,m8,m8,m9,m9,m9,m9," +
        "p1,p1,p1,p1,p2,p2,p2,p2,p3,p3,p3,p3,p4,p4,p4,p4,p5,p5,p5,p5," +
        "p6,p6,p6,p6,p7,p7,p7,p7,p8,p8,p8,p8,p9,p9,p9,p9," +
        "s1,s1,s1,s1,s2,s2,s2,s2,s3,s3,s3,s3,s4,s4,s4,s4,s5,s5,s5,s5," +
        "s6,s6,s6,s6,s7,s7,s7,s7,s8,s8,s8,s8,s9,s9,s9,s9," +
        "z1,z1,z1,z1,z2,z2,z2,z2,z3,z3,z3,z3,z4,z4,z4,z4," +
        "z5,z5,z5,z5,z6,z6,z6,z6,z7,z7,z7,z7";
      expect(
        new Mahjong.Shan(Mahjong.rule({ redPai: { m: 0, p: 0, s: 0 } }))._pai
          .concat()
          .sort()
          .join()
      ).toEqual(pai);
    });
    test("赤牌ありでインスタンスが生成できること", () => {
      const pai =
        "m0,m1,m1,m1,m1,m2,m2,m2,m2,m3,m3,m3,m3,m4,m4,m4,m4,m5,m5,m5," +
        "m6,m6,m6,m6,m7,m7,m7,m7,m8,m8,m8,m8,m9,m9,m9,m9," +
        "p0,p0,p1,p1,p1,p1,p2,p2,p2,p2,p3,p3,p3,p3,p4,p4,p4,p4,p5,p5," +
        "p6,p6,p6,p6,p7,p7,p7,p7,p8,p8,p8,p8,p9,p9,p9,p9," +
        "s0,s0,s0,s1,s1,s1,s1,s2,s2,s2,s2,s3,s3,s3,s3,s4,s4,s4,s4,s5," +
        "s6,s6,s6,s6,s7,s7,s7,s7,s8,s8,s8,s8,s9,s9,s9,s9," +
        "z1,z1,z1,z1,z2,z2,z2,z2,z3,z3,z3,z3,z4,z4,z4,z4," +
        "z5,z5,z5,z5,z6,z6,z6,z6,z7,z7,z7,z7";
      expect(
        new Mahjong.Shan(Mahjong.rule({ redPai: { m: 1, p: 2, s: 3 } }))._pai
          .concat()
          .sort()
          .join()
      ).toEqual(pai);
    });
  });

  describe("get paishu()", () => {
    test("牌山生成直後の残牌数は122", () => {
      expect(new Mahjong.Shan(Mahjong.rule()).paishu).toEqual(122);
    });
  });

  describe("get baopai()", () => {
    test("牌山生成直後のドラは1枚", () => {
      expect(new Mahjong.Shan(Mahjong.rule()).baopai.length).toEqual(1);
    });
  });

  describe("get fubaopai()", () => {
    test("牌山生成直後は null を返す", () => {
      expect(new Mahjong.Shan(Mahjong.rule()).fubaopai).toBeNull();
    });
    test("牌山固定後は裏ドラを返す", () => {
      expect(new Mahjong.Shan(Mahjong.rule()).close().fubaopai?.length).toEqual(1);
    });
    test("裏ドラなしの場合は牌山固定後も null を返す", () => {
      expect(new Mahjong.Shan(Mahjong.rule({enableUradora: false})).close().fubaopai).toBeNull();
    });
  });

  describe("zimo()", () => {
    test("牌山生成直後にツモれること", () => {
      expect(() => new Mahjong.Shan(Mahjong.rule()).zimo()).not.toThrow();
    });
    test("ツモ後に残牌数が減ること", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      expect(shan.zimo() && shan.paishu).toEqual(122 - 1);
    });
    test("王牌はツモれないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      while (shan.paishu) { shan.zimo() }
      expect(() => shan.zimo()).toThrow();
    });
    test("牌山固定後はツモれないこと", () => {
      expect(() => new Mahjong.Shan(Mahjong.rule()).close().zimo()).toThrow();
    });
  });

  describe("gangzimo()", () => {
    test("牌山生成直後に槓ツモできること", () => {
      expect(() => new Mahjong.Shan(Mahjong.rule()).gangzimo()).not.toThrow();
    });
    test("槓ツモ後に残牌数が減ること", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      expect(shan.gangzimo() && shan.paishu).toEqual(122 - 1);
    });
    test("槓ツモ直後はツモれないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      expect(() => shan.gangzimo() && shan.zimo()).toThrow();
    });
    test("槓ツモ直後に続けて槓ツモできないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      expect(() => shan.gangzimo() && shan.gangzimo()).toThrow();
    });
    test("ハイテイで槓ツモできないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      while (shan.paishu) { shan.zimo() }
      expect(() => shan.gangzimo()).toThrow();
    });
    test("牌山固定後は槓ツモできないこと", () => {
      expect(() => new Mahjong.Shan(Mahjong.rule()).close().gangzimo()).toThrow();
    });
    test("5つ目の槓ツモができないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      for (let i = 0; i < 4; i++) {
        shan.gangzimo();
        shan.kaigang();
      }
      expect(() => shan.gangzimo()).toThrow();
    });
    test("5つ目の槓ツモができないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule({enableKandora: false}));
      for (let i = 0; i < 4; i++) {
        shan.gangzimo();
      }
      expect(shan.baopai.length).toEqual(1);
      expect(() => shan.gangzimo()).toThrow();
    });
  });

  describe("kaigang()", () => {
    test("牌山生成直後に開槓できないこと", () => {
      expect(() => new Mahjong.Shan(Mahjong.rule()).kaigang()).toThrow();
    });
    test("槓ツモ後に開槓できること", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      expect(() => shan.gangzimo() && shan.kaigang()).not.toThrow();
    });
    test("開槓によりドラが増えること", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      shan.gangzimo();
      expect(shan.baopai.length + 1).toEqual(shan.kaigang().baopai.length);
    });
    test("開槓により裏ドラが増えること", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      shan.gangzimo();
      expect(shan.kaigang().close().fubaopai?.length).toEqual(2);
    });
    test("開槓後はツモできること", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      shan.gangzimo();
      expect(() => shan.kaigang().zimo()).not.toThrow();
    });
    test("開槓後は槓ツモできること", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      shan.gangzimo();
      expect(() => shan.kaigang().gangzimo()).not.toThrow();
    });
    test("牌山固定後は開槓できないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule());
      shan.gangzimo();
      expect(() => shan.close().kaigang()).toThrow();
    });
    test("カンドラなしの場合は開槓できないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule({enableKandora: false}));
      shan.gangzimo();
      expect(() => shan.kaigang()).toThrow();
    });
    test("カン裏なしの場合は開槓で裏ドラが増えないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule({enableKanUra: false}));
      shan.gangzimo();
      expect(shan.kaigang().close().fubaopai?.length).toEqual(1);
    });
    test("裏ドラなしの場合は開槓で裏ドラ発生しないこと", () => {
      const shan = new Mahjong.Shan(Mahjong.rule({enableUradora: false}));
      shan.gangzimo();
      expect(shan.kaigang().close().fubaopai).toBeNull();
    });
  });
});
