/**
 * Mahjong.Util.Hule
 */

import type { Huleyi, Menzi, Pai, Yibanyi, Yiman } from "data";
import type { Rule } from "rule";
import { rule } from "rule";
import { Shan } from "shan";
import type { Bingpai, Shoupai } from "shoupai";
import * as Util from "./";

/**
 * 和了点計算に使用する場況情報
 * @example
 * 以下の構造のオブジェクトである。
 * ```JavaScript
 * {
 *     rule:           Majiang.rule(),
 *     zhuangfeng:     0,
 *     menfeng:        0,
 *     hupai: {
 *         lizhi:      0,
 *         yifa:       false,
 *         qianggang:  false,
 *         lingshang:  false,
 *         haidi:      0,
 *         tianhu:     0
 *     },
 *     baopai:         [ 'm1' ],
 *     fubaopai:       null,
 *     jicun: {
 *         changbang:  0,
 *         lizhibang:  0
 *     }
 * }
 * ```
 */
export interface HuleParam {
  /**
   * 和了点計算時に使用する{@link Rule | ルール}。
   * @defaultValue Majiang.rule()
   */
  rule: Rule;
  /**
   * 場風。(`0`: 東、`1`: 南、`2`: 西、`3`: 北)
   * @defaultValue `0`
   */
  zhuangfeng: number;
  /**
   * 自風。(`0`: 東、`1`: 南、`2`: 西、`3`: 北)
   * @defaultValue `1`
   */
  menfeng: number;
  /** 状況役 */
  hupai: {
    /**
     * `0`: リーチなし、`1`: リーチ、`2`: ダブルリーチ。
     * @defaultValue `0`
     */
    lizhi?: number;
    /**
     * 一発のとき `true`。
     * @defaultValue `false`
     */
    yifa?: boolean;
    /**
     * 槍槓のとき `true`。
     * @defaultValue `false`
     */
    qianggang?: boolean;
    /**
     * 嶺上開花のとき `true`。
     * @defaultValue `false`
     */
    lingshang?: boolean;
    /**
     * `0`: ハイテイなし、`1`: ハイテイツモ、`2`: ハイテイロン。
     * @defaultValue `0`
     */
    haidi?: number;
    /**
     * `0`: 天和/地和なし、`1`: 天和、`2`: 地和。
     * @defaultValue `0`
     */
    tianhu?: number;
  };
  /**
   * ドラ表示{@link Pai | 牌}の配列。
   * @defaultValue `[]`
   */
  baopai: Pai[];
  /**
   * 裏ドラ表示{@link Pai | 牌}の配列。リーチのない場合は `null`。
   * @defaultValue `null`
   */
  fubaopai: Pai[] | null;
  /** 供託 */
  jicun: {
    /**
     * 積み棒の本数。
     * @defaultValue `0`
     */
    changbang: number;
    /**
     * リーチ棒の本数。
     * @defaultValue `0`
     */
    lizhibang: number;
  };
}

/**
 * 和了情報
 * @example
 * 以下の構造のオブジェクトである。
 * ```JavaScript
 * {
 *     hupai:      [ { name: "立直", fanshu: 1 },
 *                   { name: "門前清自模和", fanshu: 1 },
 *                   { name: "裏ドラ", fanshu: 1 } ],
 *     fu:         40,
 *     fanshu:     3,
 *     damanguan:  null,
 *     defen:      5200,
 *     fenpei:     [ -2600, 6200, -1300, -1300 ]
 * }
 * ```
 */
export interface HuleResult {
  /**
   * 和了役の配列。それぞれの要素には役名を示す **`name`** と翻数を示す **`fanshu`** がある。
   * 役満の場合 **`fanshu`** は数字ではなく、和了役それぞれの役満複合数分の `*` となる。
   * また役満のパオがあった場合は **`baojia`** に責任者を設定する。
   *
   * ここには{@link Paipu | 牌譜}や{@link HuleGameMessage}での`number`ではなく、
   * `string`で表示する（`-`: 下家、`=`: 対面、`+`: 上家）。
   */
  hupai: Huleyi<string>[];
  /**
   * 符。役満の場合は `undefined`。
   */
  fu?: number;
  /**
   * 翻数。役満の場合は `undefined`。
   */
  fanshu?: number;
  /**
   * 役満複合数。
   * 複合には四暗刻をダブル役満にする類のものと、大三元と字一色の複合のような役の複合のケースがある。
   * 役満でない場合は `undefined`。
   */
  damanguan?: number | null;
  /**
   * 和了打点。供託収入は含まない。
   */
  defen: number;
  /**
   * 供託を含めたその局の点数の収支。
   * その局の東家から順に並べる。
   * リーチ宣言による1000点減は収支に含めない。
   */
  fenpei: number[];
}

function mianzi(s: string, bingpai: number[], n = 1): Hulexing[] {
  if (n > 9) return [[]];

  if (bingpai[n] == 0) return mianzi(s, bingpai, n + 1);

  let shunzi: Hulexing[] = [];
  if (n <= 7 && bingpai[n] > 0 && bingpai[n + 1] > 0 && bingpai[n + 2] > 0) {
    bingpai[n]--;
    bingpai[n + 1]--;
    bingpai[n + 2]--;
    shunzi = mianzi(s, bingpai, n);
    bingpai[n]++;
    bingpai[n + 1]++;
    bingpai[n + 2]++;
    for (const s_mianzi of shunzi) {
      s_mianzi.unshift(s + n + (n + 1) + (n + 2));
    }
  }

  let kezi: Hulexing[] = [];
  if (bingpai[n] == 3) {
    bingpai[n] -= 3;
    kezi = mianzi(s, bingpai, n + 1);
    bingpai[n] += 3;
    for (const k_mianzi of kezi) {
      k_mianzi.unshift(s + n + n + n);
    }
  }

  return shunzi.concat(kezi);
}

function mianzi_all(shoupai: Shoupai): Hulexing[] {
  let shupai_all: Hulexing[] = [[]];
  for (const s of ["m", "p", "s"]) {
    const paitstr = s as keyof Bingpai;
    if (paitstr != "_") {
      const new_mianzi = [];
      for (const mm of shupai_all) {
        for (const nn of mianzi(paitstr, shoupai._bingpai[paitstr])) {
          new_mianzi.push(mm.concat(nn));
        }
      }
      shupai_all = new_mianzi;
    }
  }

  const zipai: Hulexing = [];
  for (let n = 1; n <= 7; n++) {
    if (shoupai._bingpai.z[n] == 0) continue;
    if (shoupai._bingpai.z[n] != 3) return [];
    zipai.push("z" + n + n + n);
  }

  const fulou = shoupai._fulou.map((m) => m.replace(/0/g, "5"));

  return shupai_all.map((shupai) => shupai.concat(zipai).concat(fulou));
}

function add_hulepai(mianzi: Hulexing, p: Pai): Hulexing[] {
  const [s, n, d] = p;
  const regexp = new RegExp(`^(${s}.*${n})`);
  const replacer = `$1${d}!`;

  const new_mianzi: Hulexing[] = [];

  for (let i = 0; i < mianzi.length; i++) {
    if (mianzi[i].match(/[\+\=\-]|\d{4}/)) continue;
    if (i > 0 && mianzi[i] == mianzi[i - 1]) continue;
    const m = mianzi[i].replace(regexp, replacer);
    if (m == mianzi[i]) continue;
    const tmp_mianzi = mianzi.concat();
    tmp_mianzi[i] = m;
    new_mianzi.push(tmp_mianzi);
  }

  return new_mianzi;
}

function hule_mianzi_yiban(shoupai: Shoupai, hulepai: Pai): Hulexing[] {
  let mianzi: Hulexing[] = [];

  for (const s of ["m", "p", "s", "z"]) {
    const paitstr = s as keyof Bingpai;
    if (paitstr != "_") {
      const bingpai = shoupai._bingpai[paitstr];
      for (let n = 1; n < bingpai.length; n++) {
        if (bingpai[n] < 2) continue;
        bingpai[n] -= 2;
        const jiangpai = s + n + n;
        for (const mm of mianzi_all(shoupai)) {
          mm.unshift(jiangpai);
          if (mm.length != 5) continue;
          mianzi = mianzi.concat(add_hulepai(mm, hulepai));
        }
        bingpai[n] += 2;
      }
    }
  }

  return mianzi;
}

function hule_mianzi_qidui(shoupai: Shoupai, hulepai: Pai): Hulexing[] {
  if (shoupai._fulou.length > 0) return [];

  const mianzi: Hulexing = [];

  for (const s of ["m", "p", "s", "z"]) {
    const paitstr = s as keyof Bingpai;
    if (paitstr != "_") {
      const bingpai = shoupai._bingpai[paitstr];
      for (let n = 1; n < bingpai.length; n++) {
        if (bingpai[n] == 0) continue;
        if (bingpai[n] == 2) {
          const m =
            s + n == hulepai.slice(0, 2)
              ? s + n + n + hulepai[2] + "!"
              : s + n + n;
          mianzi.push(m);
        } else return [];
      }
    }
  }

  return mianzi.length == 7 ? [mianzi] : [];
}

function hule_mianzi_guoshi(shoupai: Shoupai, hulepai: Pai): Hulexing[] {
  if (shoupai._fulou.length > 0) return [];

  const mianzi = [];
  let n_duizi = 0;

  for (const s of ["m", "p", "s", "z"]) {
    const paitstr = s as keyof Bingpai;
    if (paitstr != "_") {
      const bingpai = shoupai._bingpai[paitstr];
      const nn = paitstr == "z" ? [1, 2, 3, 4, 5, 6, 7] : [1, 9];
      for (const n of nn) {
        if (bingpai[n] == 2) {
          const m =
            s + n == hulepai.slice(0, 2)
              ? s + n + n + hulepai[2] + "!"
              : s + n + n;
          mianzi.unshift(m);
          n_duizi++;
        } else if (bingpai[n] == 1) {
          const m =
            s + n == hulepai.slice(0, 2) ? s + n + hulepai[2] + "!" : s + n;
          mianzi.push(m);
        } else return [];
      }
    }
  }

  return n_duizi == 1 ? [mianzi] : [];
}

function hule_mianzi_jiulian(shoupai: Shoupai, hulepai: Pai): Hulexing[] {
  if (shoupai._fulou.length > 0) return [];

  const s = hulepai[0];
  if (s == "z") return [];

  let mianzi = s as keyof Bingpai;
  if (mianzi != "_") {
    const bingpai = shoupai._bingpai[mianzi];
    for (let n = 1; n <= 9; n++) {
      if (bingpai[n] == 0) return [];
      if ((n == 1 || n == 9) && bingpai[n] < 3) return [];
      const n_pai = n == parseInt(hulepai[1]) ? bingpai[n] - 1 : bingpai[n];
      for (let i = 0; i < n_pai; i++) {
        mianzi += n;
      }
    }
  }
  if (mianzi.length != 14) return [];
  mianzi += hulepai.slice(1) + "!";

  return [[mianzi]];
}

type Hudi = {
  fu: number;
  menqian: boolean;
  zimo: boolean;
  shunzi: {
    m: number[];
    p: number[];
    s: number[];
  };
  kezi: {
    m: number[];
    p: number[];
    s: number[];
    z: number[];
  };
  n_shunzi: number;
  n_kezi: number;
  n_ankezi: number;
  n_gangzi: number;
  n_yaojiu: number;
  n_zipai: number;
  danqi: boolean;
  pinghu: boolean;
  zhuangfeng: number;
  menfeng: number;
};

function get_hudi(mianzi: Hulexing, zhuangfeng: number, menfeng: number): Hudi {
  const zhuangfengpai = new RegExp(`^z${zhuangfeng + 1}.*$`);
  const menfengpai = new RegExp(`^z${menfeng + 1}.*$`);
  const sanyuanpai = /^z[567].*$/;

  const yaojiu = /^.*[z19].*$/;
  const zipai = /^z.*$/;

  const kezi = /^[mpsz](\d)\1\1.*$/;
  const ankezi = /^[mpsz](\d)\1\1(?:\1|_\!)?$/;
  const gangzi = /^[mpsz](\d)\1\1.*\1.*$/;

  const danqi = /^[mpsz](\d)\1[\+\=\-\_]\!$/;
  const kanzhang = /^[mps]\d\d[\+\=\-\_]\!\d$/;
  const bianzhang = /^[mps](123[\+\=\-\_]\!|7[\+\=\-\_]\!89)$/;

  const hudi = {
    fu: 20,
    menqian: true,
    zimo: true,
    shunzi: {
      m: [0, 0, 0, 0, 0, 0, 0, 0],
      p: [0, 0, 0, 0, 0, 0, 0, 0],
      s: [0, 0, 0, 0, 0, 0, 0, 0],
    },
    kezi: {
      m: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      s: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      z: [0, 0, 0, 0, 0, 0, 0, 0],
    },
    n_shunzi: 0,
    n_kezi: 0,
    n_ankezi: 0,
    n_gangzi: 0,
    n_yaojiu: 0,
    n_zipai: 0,
    danqi: false,
    pinghu: false,
    zhuangfeng: zhuangfeng,
    menfeng: menfeng,
  };

  for (const m of mianzi) {
    if (m.match(/[\+\=\-](?!\!)/)) hudi.menqian = false;
    if (m.match(/[\+\=\-]\!/)) hudi.zimo = false;

    if (mianzi.length == 1) continue;

    if (m.match(danqi)) hudi.danqi = true;

    if (mianzi.length == 13) continue;

    if (m.match(yaojiu)) hudi.n_yaojiu++;
    if (m.match(zipai)) hudi.n_zipai++;

    if (mianzi.length != 5) continue;

    if (m == mianzi[0]) {
      let fu = 0;
      if (m.match(zhuangfengpai)) fu += 2;
      if (m.match(menfengpai)) fu += 2;
      if (m.match(sanyuanpai)) fu += 2;
      hudi.fu += fu;
      if (hudi.danqi) hudi.fu += 2;
    } else if (m.match(kezi)) {
      hudi.n_kezi++;
      let fu = 2;
      if (m.match(yaojiu)) {
        fu *= 2;
      }
      if (m.match(ankezi)) {
        fu *= 2;
        hudi.n_ankezi++;
      }
      if (m.match(gangzi)) {
        fu *= 4;
        hudi.n_gangzi++;
      }
      hudi.fu += fu;
      const paitstr = m[0] as keyof Bingpai;
      if (paitstr != "_") hudi.kezi[paitstr][parseInt(m[1])]++;
    } else {
      hudi.n_shunzi++;
      if (m.match(kanzhang)) hudi.fu += 2;
      if (m.match(bianzhang)) hudi.fu += 2;
      const paitstr = m[0] as keyof Bingpai;
      if (paitstr != "_" && paitstr != "z")
        hudi.shunzi[paitstr][parseInt(m[1])]++;
    }
  }

  if (mianzi.length == 7) {
    hudi.fu = 25;
  } else if (mianzi.length == 5) {
    hudi.pinghu = hudi.menqian && hudi.fu == 20;
    if (hudi.zimo) {
      if (!hudi.pinghu) hudi.fu += 2;
    } else {
      if (hudi.menqian) hudi.fu += 10;
      else if (hudi.fu == 20) hudi.fu = 30;
    }
    hudi.fu = Math.ceil(hudi.fu / 10) * 10;
  }

  return hudi;
}

function get_pre_hupai(hupai: HuleParam["hupai"]): Huleyi<string>[] {
  let pre_hupai = [];

  if (hupai.lizhi == 1) pre_hupai.push({ name: "立直", fanshu: 1 });
  if (hupai.lizhi == 2) pre_hupai.push({ name: "ダブル立直", fanshu: 2 });
  if (hupai.yifa) pre_hupai.push({ name: "一発", fanshu: 1 });
  if (hupai.haidi == 1) pre_hupai.push({ name: "海底摸月", fanshu: 1 });
  if (hupai.haidi == 2) pre_hupai.push({ name: "河底撈魚", fanshu: 1 });
  if (hupai.lingshang) pre_hupai.push({ name: "嶺上開花", fanshu: 1 });
  if (hupai.qianggang) pre_hupai.push({ name: "槍槓", fanshu: 1 });

  if (hupai.tianhu == 1) pre_hupai = [{ name: "天和", fanshu: "*" }];
  if (hupai.tianhu == 2) pre_hupai = [{ name: "地和", fanshu: "*" }];

  return pre_hupai;
}

function get_hupai(
  mianzi: Hulexing,
  hudi: Hudi,
  pre_hupai: Huleyi<string>[],
  post_hupai: Huleyi<string>[],
  rule: Rule
): Huleyi<string>[] {
  function menqianqing() {
    if (hudi.menqian && hudi.zimo) return [{ name: "門前清自摸和", fanshu: 1 }];
    return [];
  }
  function fanpai() {
    const feng_hanzi = ["東", "南", "西", "北"];
    const fanpai_all = [];
    if (hudi.kezi.z[hudi.zhuangfeng + 1])
      fanpai_all.push({
        name: "場風 " + feng_hanzi[hudi.zhuangfeng],
        fanshu: 1,
      });
    if (hudi.kezi.z[hudi.menfeng + 1])
      fanpai_all.push({ name: "自風 " + feng_hanzi[hudi.menfeng], fanshu: 1 });
    if (hudi.kezi.z[5]) fanpai_all.push({ name: "翻牌 白", fanshu: 1 });
    if (hudi.kezi.z[6]) fanpai_all.push({ name: "翻牌 發", fanshu: 1 });
    if (hudi.kezi.z[7]) fanpai_all.push({ name: "翻牌 中", fanshu: 1 });
    return fanpai_all;
  }
  function pinghu() {
    if (hudi.pinghu) return [{ name: "平和", fanshu: 1 }];
    return [];
  }
  function duanyaojiu() {
    if (hudi.n_yaojiu > 0) return [];
    if (rule.enableKuitan || hudi.menqian)
      return [{ name: "断幺九", fanshu: 1 }];
    return [];
  }
  function yibeikou() {
    if (!hudi.menqian) return [];
    const shunzi = hudi.shunzi;
    const beikou = shunzi.m
      .concat(shunzi.p)
      .concat(shunzi.s)
      .map((x) => x >> 1)
      .reduce((a, b) => a + b);
    if (beikou == 1) return [{ name: "一盃口", fanshu: 1 }];
    return [];
  }
  function sansetongshun() {
    const shunzi = hudi.shunzi;
    for (let n = 1; n <= 7; n++) {
      if (shunzi.m[n] && shunzi.p[n] && shunzi.s[n])
        return [{ name: "三色同順", fanshu: hudi.menqian ? 2 : 1 }];
    }
    return [];
  }
  function yiqitongguan() {
    const shunzi = hudi.shunzi;
    for (const s of ["m", "p", "s"]) {
      const paitstr = s as keyof Bingpai;
      if (paitstr != "_" && paitstr != "z") {
        if (shunzi[paitstr][1] && shunzi[paitstr][4] && shunzi[paitstr][7])
          return [{ name: "一気通貫", fanshu: hudi.menqian ? 2 : 1 }];
      }
    }
    return [];
  }
  function hunquandaiyaojiu() {
    if (hudi.n_yaojiu == 5 && hudi.n_shunzi > 0 && hudi.n_zipai > 0)
      return [{ name: "混全帯幺九", fanshu: hudi.menqian ? 2 : 1 }];
    return [];
  }
  function qiduizi() {
    if (mianzi.length == 7) return [{ name: "七対子", fanshu: 2 }];
    return [];
  }
  function duiduihu() {
    if (hudi.n_kezi == 4) return [{ name: "対々和", fanshu: 2 }];
    return [];
  }
  function sananke() {
    if (hudi.n_ankezi == 3) return [{ name: "三暗刻", fanshu: 2 }];
    return [];
  }
  function sangangzi() {
    if (hudi.n_gangzi == 3) return [{ name: "三槓子", fanshu: 2 }];
    return [];
  }
  function sansetongke() {
    const kezi = hudi.kezi;
    for (let n = 1; n <= 9; n++) {
      if (kezi.m[n] && kezi.p[n] && kezi.s[n])
        return [{ name: "三色同刻", fanshu: 2 }];
    }
    return [];
  }
  function hunlaotou() {
    if (
      hudi.n_yaojiu == mianzi.length &&
      hudi.n_shunzi == 0 &&
      hudi.n_zipai > 0
    )
      return [{ name: "混老頭", fanshu: 2 }];
    return [];
  }
  function xiaosanyuan() {
    const kezi = hudi.kezi;
    if (kezi.z[5] + kezi.z[6] + kezi.z[7] == 2 && mianzi[0].match(/^z[567]/))
      return [{ name: "小三元", fanshu: 2 }];
    return [];
  }
  function hunyise() {
    for (const s of ["m", "p", "s"]) {
      const yise = new RegExp(`^[z${s}]`);
      if (
        mianzi.filter((m) => m.match(yise)).length == mianzi.length &&
        hudi.n_zipai > 0
      )
        return [{ name: "混一色", fanshu: hudi.menqian ? 3 : 2 }];
    }
    return [];
  }
  function chunquandaiyaojiu() {
    if (hudi.n_yaojiu == 5 && hudi.n_shunzi > 0 && hudi.n_zipai == 0)
      return [{ name: "純全帯幺九", fanshu: hudi.menqian ? 3 : 2 }];
    return [];
  }
  function erbeikou() {
    if (!hudi.menqian) return [];
    const shunzi = hudi.shunzi;
    const beikou = shunzi.m
      .concat(shunzi.p)
      .concat(shunzi.s)
      .map((x) => x >> 1)
      .reduce((a, b) => a + b);
    if (beikou == 2) return [{ name: "二盃口", fanshu: 3 }];
    return [];
  }
  function qingyise() {
    for (const s of ["m", "p", "s"]) {
      const yise = new RegExp(`^[${s}]`);
      if (mianzi.filter((m) => m.match(yise)).length == mianzi.length)
        return [{ name: "清一色", fanshu: hudi.menqian ? 6 : 5 }];
    }
    return [];
  }

  function guoshiwushuang() {
    if (mianzi.length != 13) return [];
    if (hudi.danqi) return [{ name: "国士無双十三面", fanshu: "**" }];
    else return [{ name: "国士無双", fanshu: "*" }];
  }
  function sianke() {
    if (hudi.n_ankezi != 4) return [];
    if (hudi.danqi) return [{ name: "四暗刻単騎", fanshu: "**" }];
    else return [{ name: "四暗刻", fanshu: "*" }];
  }
  function dasanyuan() {
    const kezi = hudi.kezi;
    if (kezi.z[5] + kezi.z[6] + kezi.z[7] == 3) {
      const bao_mianzi = mianzi.filter((m) =>
        m.match(/^z([567])\1\1(?:[\+\=\-]|\1)(?!\!)/)
      );
      const baojia = bao_mianzi[2] && bao_mianzi[2].match(/[\+\=\-]/);
      if (baojia) return [{ name: "大三元", fanshu: "*", baojia: baojia[0] }];
      else return [{ name: "大三元", fanshu: "*" }];
    }
    return [];
  }
  function sixihu() {
    const kezi = hudi.kezi;
    if (kezi.z[1] + kezi.z[2] + kezi.z[3] + kezi.z[4] == 4) {
      const bao_mianzi = mianzi.filter((m) =>
        m.match(/^z([1234])\1\1(?:[\+\=\-]|\1)(?!\!)/)
      );
      const baojia = bao_mianzi[3] && bao_mianzi[3].match(/[\+\=\-]/);
      if (baojia) return [{ name: "大四喜", fanshu: "**", baojia: baojia[0] }];
      else return [{ name: "大四喜", fanshu: "**" }];
    }
    if (
      kezi.z[1] + kezi.z[2] + kezi.z[3] + kezi.z[4] == 3 &&
      mianzi[0].match(/^z[1234]/)
    )
      return [{ name: "小四喜", fanshu: "*" }];
    return [];
  }
  function ziyise() {
    if (hudi.n_zipai == mianzi.length) return [{ name: "字一色", fanshu: "*" }];
    return [];
  }
  function lvyise() {
    if (mianzi.filter((m) => m.match(/^[mp]/)).length > 0) return [];
    if (mianzi.filter((m) => m.match(/^z[^6]/)).length > 0) return [];
    if (mianzi.filter((m) => m.match(/^s.*[1579]/)).length > 0) return [];
    return [{ name: "緑一色", fanshu: "*" }];
  }
  function qinglaotou() {
    if (hudi.n_yaojiu == 5 && hudi.n_kezi == 4 && hudi.n_zipai == 0)
      return [{ name: "清老頭", fanshu: "*" }];
    return [];
  }
  function sigangzi() {
    if (hudi.n_gangzi == 4) return [{ name: "四槓子", fanshu: "*" }];
    return [];
  }
  function jiulianbaodeng() {
    if (mianzi.length != 1) return [];
    if (mianzi[0].match(/^[mpsz]1112345678999/))
      return [{ name: "純正九蓮宝燈", fanshu: "**" }];
    else return [{ name: "九蓮宝燈", fanshu: "*" }];
  }

  const pre_hupaiY = pre_hupai as Yiman<string>[];
  let damanguan: Huleyi<string>[] =
    pre_hupai.length > 0 && pre_hupaiY[0].fanshu[0] == "*" ? pre_hupaiY : [];
  damanguan = damanguan
    .concat(guoshiwushuang())
    .concat(sianke())
    .concat(dasanyuan())
    .concat(sixihu())
    .concat(ziyise())
    .concat(lvyise())
    .concat(qinglaotou())
    .concat(sigangzi())
    .concat(jiulianbaodeng());

  for (let hupai of damanguan) {
    if (!rule.enableDoubleYakuman) hupai.fanshu = "*";
    if (!rule.enableYakumanPao) {
      const hupaiY = hupai as Yiman<string>;
      delete hupaiY.baojia;
      hupai = hupaiY;
    }
  }
  if (damanguan.length > 0) return damanguan;

  let hupai = pre_hupai
    .concat(menqianqing())
    .concat(fanpai())
    .concat(pinghu())
    .concat(duanyaojiu())
    .concat(yibeikou())
    .concat(sansetongshun())
    .concat(yiqitongguan())
    .concat(hunquandaiyaojiu())
    .concat(qiduizi())
    .concat(duiduihu())
    .concat(sananke())
    .concat(sangangzi())
    .concat(sansetongke())
    .concat(hunlaotou())
    .concat(xiaosanyuan())
    .concat(hunyise())
    .concat(chunquandaiyaojiu())
    .concat(erbeikou())
    .concat(qingyise());

  if (hupai.length > 0) hupai = hupai.concat(post_hupai);

  return hupai;
}

function get_post_hupai(
  shoupai: Shoupai,
  rongpai: Pai,
  baopai: Pai[],
  fubaopai: Pai[]
): Huleyi<string>[] {
  const new_shoupai = shoupai.clone();
  if (rongpai) new_shoupai.zimo(rongpai);
  const paistr = new_shoupai.toString();

  const post_hupai = [];

  const suitstr = paistr.match(/[mpsz][^mpsz,]*/g);

  let n_baopai = 0;
  for (let p of baopai) {
    p = Shan.zhenbaopai(p);
    const regexp = new RegExp(p[1], "g");
    for (let m of suitstr) {
      if (m[0] != p[0]) continue;
      m = m.replace(/0/, "5");
      const nn = m.match(regexp);
      if (nn) n_baopai += nn.length;
    }
  }
  if (n_baopai) post_hupai.push({ name: "ドラ", fanshu: n_baopai });

  let n_hongpai = 0;
  const nn = paistr.match(/0/g);
  if (nn) n_hongpai = nn.length;
  if (n_hongpai) post_hupai.push({ name: "赤ドラ", fanshu: n_hongpai });

  let n_fubaopai = 0;
  for (let p of fubaopai || []) {
    p = Shan.zhenbaopai(p);
    const regexp = new RegExp(p[1], "g");
    for (let m of suitstr) {
      if (m[0] != p[0]) continue;
      m = m.replace(/0/, "5");
      const nn = m.match(regexp);
      if (nn) n_fubaopai += nn.length;
    }
  }
  if (n_fubaopai) post_hupai.push({ name: "裏ドラ", fanshu: n_fubaopai });

  return post_hupai;
}

function get_defen(
  fu: number,
  hupai: Huleyi<string>[],
  rongpai: string,
  param: HuleParam
): Partial<HuleResult> {
  if (hupai.length == 0) return { defen: 0 };

  const menfeng = param.menfeng;
  let fanshu, damanguan, defen, base, baojia, defen2, base2, baojia2;

  if (typeof hupai[0].fanshu === "string" && hupai[0].fanshu[0] == "*") {
    fu = undefined;
    const hupaiY = hupai as Yiman<string>[];
    damanguan = !param.rule.enableYakumanComposite
      ? 1
      : hupaiY.map((h) => h.fanshu.length).reduce((x, y) => x + y);
    base = 8000 * damanguan;

    const h = hupaiY.find((h) => h.baojia);
    if (h) {
      baojia2 = (menfeng + { "+": 1, "=": 2, "-": 3 }[h.baojia]) % 4;
      base2 = 8000 * Math.min(h.fanshu.length, damanguan);
    }
  } else {
    const hupaiY = hupai as Yibanyi[];
    fanshu = hupaiY.map((h) => h.fanshu).reduce((x, y) => x + y);
    base =
      fanshu >= 13 && param.rule.enableCountYakuman
        ? 8000
        : fanshu >= 11
        ? 6000
        : fanshu >= 8
        ? 4000
        : fanshu >= 6
        ? 3000
        : param.rule.enableRoundUpMangan && fu << (2 + fanshu) == 1920
        ? 2000
        : Math.min(fu << (2 + fanshu), 2000);
  }

  const fenpei = [0, 0, 0, 0];
  const chang = param.jicun.changbang;
  const lizhi = param.jicun.lizhibang;

  if (baojia2 != null) {
    if (rongpai) base2 = base2 / 2;
    base = base - base2;
    defen2 = base2 * (menfeng == 0 ? 6 : 4);
    fenpei[menfeng] += defen2;
    fenpei[baojia2] -= defen2;
  } else defen2 = 0;

  if (rongpai || base == 0) {
    baojia =
      base == 0
        ? baojia2
        : (menfeng + { "+": 1, "=": 2, "-": 3 }[rongpai[2]]) % 4;
    defen = Math.ceil((base * (menfeng == 0 ? 6 : 4)) / 100) * 100;
    fenpei[menfeng] += defen + chang * 300 + lizhi * 1000;
    fenpei[baojia] -= defen + chang * 300;
  } else {
    const zhuangjia = Math.ceil((base * 2) / 100) * 100;
    const sanjia = Math.ceil(base / 100) * 100;
    if (menfeng == 0) {
      defen = zhuangjia * 3;
      for (let l = 0; l < 4; l++) {
        if (l == menfeng) fenpei[l] += defen + chang * 300 + lizhi * 1000;
        else fenpei[l] -= zhuangjia + chang * 100;
      }
    } else {
      defen = zhuangjia + sanjia * 2;
      for (let l = 0; l < 4; l++) {
        if (l == menfeng) fenpei[l] += defen + chang * 300 + lizhi * 1000;
        else if (l == 0) fenpei[l] -= zhuangjia + chang * 100;
        else fenpei[l] -= sanjia + chang * 100;
      }
    }
  }

  return {
    hupai: hupai,
    fu: fu,
    fanshu: fanshu,
    damanguan: damanguan,
    defen: defen + defen2,
    fenpei: fenpei,
  };
}

/**
 * **`shoupai`** の和了点を計算し、和了情報とともに返す。
 * @remarks
 * * ツモ和了の場合は **`shoupai`** はツモ牌を加えた状態で、 **`rongpai`** は `null` とする。
 * * ロン和了の場合は **`shoupai`** はロン牌を加えない状態で、 **`rongpai`** はロンした{@link Pai | 牌}とする。
 *
 * ロン和了の場合、 **`rongpai`** には誰がロンしたかを示す
 * * `+`(下家から和了)
 * * `=`(対面から和了)
 * * `-`(上家から和了) のフラグを付加する。
 * @param shoupai {@link Shoupai | 手牌}
 * @param rongpai {@link Pai | 牌}。指定されていないの場合に手牌の最後の一枚がツモと見なす。
 * @param param 和了点計算に使用する場況情報
 * @returns 和了情報
 */
export function hule(
  shoupai: Shoupai,
  rongpai: Pai | null | undefined,
  param: HuleParam
): HuleResult {
  if (rongpai) {
    if (!rongpai.match(/[\+\=\-]$/)) throw new Error(rongpai);
    rongpai = rongpai.slice(0, 2) + rongpai.slice(-1);
  }

  let max: HuleResult;
  const pre_hupai = get_pre_hupai(param.hupai);
  const post_hupai = get_post_hupai(
    shoupai,
    rongpai,
    param.baopai,
    param.fubaopai
  );

  for (const mianzi of hule_mianzi(shoupai, rongpai)) {
    const hudi = get_hudi(mianzi, param.zhuangfeng, param.menfeng);
    const hupai = get_hupai(mianzi, hudi, pre_hupai, post_hupai, param.rule);
    const rv = get_defen(hudi.fu, hupai, rongpai, param);

    if (
      !max ||
      rv.defen > max.defen ||
      (rv.defen == max.defen &&
        (!rv.fanshu ||
          rv.fanshu > max.fanshu ||
          (rv.fanshu == max.fanshu && rv.fu > max.fu)) &&
        rv.hupai)
    ) {
      max = {
        fu: rv.fu,
        hupai: rv.hupai,
        defen: rv.defen,
        fenpei: rv.fenpei,
        fanshu: rv.fanshu,
        damanguan: rv.damanguan,
      };
    }
  }

  return max;
}

/**
 * 和了の場況情報
 */
export type HuleParamInput = Partial<
  Omit<HuleParam, "hupai" | "jicun"> & HuleParam["hupai"] & HuleParam["jicun"]
>;

/**
 * **`param`** で指定された値を元に {@link Util.hule} の第3パラメータに使用する場況情報を返す。
 * @param param 指定された場況情報
 * @returns 場況情報
 * @see hule
 */
export function hule_param(param?: HuleParamInput): HuleParam {
  const rv = {
    rule: param.rule ?? rule(),
    zhuangfeng: param.zhuangfeng ?? 0,
    menfeng: param.menfeng ?? 1,
    hupai: {
      lizhi: param.lizhi ?? 0,
      yifa: param.yifa ?? false,
      qianggang: param.qianggang ?? false,
      lingshang: param.lingshang ?? false,
      haidi: param.haidi ?? 0,
      tianhu: param.tianhu ?? 0,
    },
    baopai: param.baopai ? [].concat(param.baopai) : [],
    fubaopai: param.fubaopai ? [].concat(param.fubaopai) : null,
    jicun: {
      changbang: param.changbang ?? 0,
      lizhibang: param.lizhibang ?? 0,
    },
  };

  return rv;
}

/**
 * 和了形
 * @example
 * ```javascript
 * // 一般手
 * ['z22_!', 'm123', 'p555', 's789', 'z111']
 * // 七対子形
 * ['m22', 'm55-!', 'p44', 'p66', 's11', 's99', 'z33']
 * ```
 * // 国士無双形
 * ['z77', 'm1_!', 'm9', 'p1', 'p9', 's1', 's9', 'z1', 'z2', 'z3', 'z4', 'z5', 'z6']
 */
export type Hulexing = Menzi[];

/**
 * **`shoupai`** の手牌から **`rongpai`** で和了したときの和了形の一覧を返す。
 * @param shoupai {@link Shoupai | 手牌}
 * @param rongpai {@link Pai | 牌}。指定されていないの場合に手牌の最後の一枚がツモと見なす。
 * @returns 和了形の配列。和了形にならない場合は空配列を返す。
 */
export function hule_mianzi(
  shoupai: Shoupai,
  rongpai?: Pai | null
): Hulexing[] {
  const new_shoupai = shoupai.clone();
  if (rongpai) new_shoupai.zimo(rongpai);

  if (!new_shoupai._zimo || new_shoupai._zimo.length > 2) return [];
  const hulepai = (rongpai || new_shoupai._zimo + "_").replace(/0/, "5");

  return []
    .concat(hule_mianzi_yiban(new_shoupai, hulepai))
    .concat(hule_mianzi_qidui(new_shoupai, hulepai))
    .concat(hule_mianzi_guoshi(new_shoupai, hulepai))
    .concat(hule_mianzi_jiulian(new_shoupai, hulepai));
}
