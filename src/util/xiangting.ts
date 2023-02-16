/**
 * Mahjong.Util.Xiangting
 */

import type { Pai } from "data";
import type { Bingpai, Shoupai } from "shoupai";

function _xiangting(m: number, d: number, g: number, j?: boolean) {
  const n = j ? 4 : 5;
  if (m > 4) {
    d += m - 4;
    m = 4;
  }
  if (m + d > 4) {
    g += m + d - 4;
    d = 4 - m;
  }
  if (m + d + g > n) {
    g = n - m - d;
  }
  if (j) d++;
  return 13 - m * 3 - d * 2 - g;
}

type Dazi = {
  a: number[];
  b: number[];
};

function dazi(bingpai: number[]): Dazi {
  let n_pai = 0,
    n_dazi = 0,
    n_guli = 0;

  for (let n = 1; n <= 9; n++) {
    n_pai += bingpai[n];
    if (n <= 7 && bingpai[n + 1] == 0 && bingpai[n + 2] == 0) {
      n_dazi += n_pai >> 1;
      n_guli += n_pai % 2;
      n_pai = 0;
    }
  }
  n_dazi += n_pai >> 1;
  n_guli += n_pai % 2;

  return { a: [0, n_dazi, n_guli], b: [0, n_dazi, n_guli] };
}

function mianzi(bingpai: number[], n = 1): Dazi {
  if (n > 9) return dazi(bingpai);

  const max = mianzi(bingpai, n + 1);

  if (n <= 7 && bingpai[n] > 0 && bingpai[n + 1] > 0 && bingpai[n + 2] > 0) {
    bingpai[n]--;
    bingpai[n + 1]--;
    bingpai[n + 2]--;
    const r = mianzi(bingpai, n);
    bingpai[n]++;
    bingpai[n + 1]++;
    bingpai[n + 2]++;
    r.a[0]++;
    r.b[0]++;
    if (r.a[2] < max.a[2] || (r.a[2] == max.a[2] && r.a[1] < max.a[1]))
      max.a = r.a;
    if (r.b[0] > max.b[0] || (r.b[0] == max.b[0] && r.b[1] > max.b[1]))
      max.b = r.b;
  }

  if (bingpai[n] >= 3) {
    bingpai[n] -= 3;
    const r = mianzi(bingpai, n);
    bingpai[n] += 3;
    r.a[0]++;
    r.b[0]++;
    if (r.a[2] < max.a[2] || (r.a[2] == max.a[2] && r.a[1] < max.a[1]))
      max.a = r.a;
    if (r.b[0] > max.b[0] || (r.b[0] == max.b[0] && r.b[1] > max.b[1]))
      max.b = r.b;
  }

  return max;
}

function mianzi_all(shoupai: Shoupai, jiangpai?: boolean) {
  const r = {
    m: mianzi(shoupai._bingpai.m),
    p: mianzi(shoupai._bingpai.p),
    s: mianzi(shoupai._bingpai.s),
  };

  const z = [0, 0, 0];
  for (let n = 1; n <= 7; n++) {
    if (shoupai._bingpai.z[n] >= 3) z[0]++;
    else if (shoupai._bingpai.z[n] == 2) z[1]++;
    else if (shoupai._bingpai.z[n] == 1) z[2]++;
  }

  const n_fulou = shoupai._fulou.length;

  let min = 13;

  for (const m of [r.m.a, r.m.b]) {
    for (const p of [r.p.a, r.p.b]) {
      for (const s of [r.s.a, r.s.b]) {
        const x = [n_fulou, 0, 0];
        for (let i = 0; i < 3; i++) {
          x[i] += m[i] + p[i] + s[i] + z[i];
        }
        const n_xiangting = _xiangting(x[0], x[1], x[2], jiangpai);
        if (n_xiangting < min) min = n_xiangting;
      }
    }
  }

  return min;
}

/**
 * シャンテン数計算関数
 */
export type XiangtingFunction = (shoupai: Shoupai) => number;

/**
 * **`shoupai`** のシャンテン数を返す。
 * @param shoupai {@link Shoupai | 手牌}
 * @returns **`shoupai`** のシャンテン数
 */
export function xiangting(shoupai: Shoupai): number {
  return Math.min(
    xiangting_yiban(shoupai),
    xiangting_guoshi(shoupai),
    xiangting_qidui(shoupai)
  );
}

/**
 * **`shoupai`** の一般手(七対子形、国士無双形以外)としてのシャンテン数を返す。
 * @param shoupai {@link Shoupai | 手牌}
 * @returns **`shoupai`** の一般手としてのシャンテン数
 */
export function xiangting_yiban(shoupai: Shoupai): number {
  let min = mianzi_all(shoupai);

  for (const s of ["m", "p", "s", "z"]) {
    const paitstr = s as keyof Bingpai;
    if (paitstr != "_") {
      const bingpai = shoupai._bingpai[paitstr];
      for (let n = 1; n < bingpai.length; n++) {
        if (bingpai[n] >= 2) {
          bingpai[n] -= 2;
          const n_xiangting = mianzi_all(shoupai, true);
          bingpai[n] += 2;
          if (n_xiangting < min) min = n_xiangting;
        }
      }
    }
  }
  if (min == -1 && shoupai._zimo && shoupai._zimo.length > 2) return 0;

  return min;
}

/**
 * **`shoupai`** の七対子形としてのシャンテン数を返す。
 * @param shoupai {@link Shoupai | 手牌}
 * @returns **`shoupai`** の七対子形としてのシャンテン数
 */
export function xiangting_qidui(shoupai: Shoupai): number {
  if (shoupai._fulou.length) return Infinity;

  let n_duizi = 0;
  let n_guli = 0;

  for (const s of ["m", "p", "s", "z"]) {
    const paitstr = s as keyof Bingpai;
    if (paitstr != "_") {
      const bingpai = shoupai._bingpai[paitstr];
      for (let n = 1; n < bingpai.length; n++) {
        if (bingpai[n] >= 2) n_duizi++;
        else if (bingpai[n] == 1) n_guli++;
      }
    }
  }

  if (n_duizi > 7) n_duizi = 7;
  if (n_duizi + n_guli > 7) n_guli = 7 - n_duizi;

  return 13 - n_duizi * 2 - n_guli;
}

/**
 * **`shoupai`** の国士無双形としてのシャンテン数を返す。
 * @param shoupai {@link Shoupai | 手牌}
 * @returns **`shoupai`** の国士無双形としてのシャンテン数
 */
export function xiangting_guoshi(shoupai: Shoupai): number {
  if (shoupai._fulou.length) return Infinity;

  let n_yaojiu = 0;
  let n_duizi = 0;

  for (const s of ["m", "p", "s", "z"]) {
    const paitstr = s as keyof Bingpai;
    if (paitstr != "_") {
      const bingpai = shoupai._bingpai[paitstr];
      const nn = paitstr == "z" ? [1, 2, 3, 4, 5, 6, 7] : [1, 9];
      for (const n of nn) {
        if (bingpai[n] >= 1) n_yaojiu++;
        if (bingpai[n] >= 2) n_duizi++;
      }
    }
  }

  return n_duizi ? 12 - n_yaojiu : 13 - n_yaojiu;
}

/**
 * **`shoupai`** に1枚加えるとシャンテン数の進む{@link Pai | 牌}の配列を返す。
 * **`f_xiangting`** で指定された関数をシャンテン数計算の際に使用する。
 * @param shoupai {@link Shoupai | 手牌}
 * @param f_xiangting 指定されたシャンテン数計算関数。
 * @returns 進む{@link Pai | 牌}の配列。返り値には赤牌は含まない。 **`shoupai`** がツモると多牌になる場合は `null` を返す。
 */
export function tingpai(
  shoupai: Shoupai,
  f_xiangting?: XiangtingFunction
): Pai[] | null {
  if (shoupai._zimo) return null;

  const pai = [];
  const n_xiangting = f_xiangting(shoupai);
  for (const s of ["m", "p", "s", "z"]) {
    const paitstr = s as keyof Bingpai;
    if (paitstr != "_") {
      const bingpai = shoupai._bingpai[paitstr];
      for (let n = 1; n < bingpai.length; n++) {
        if (bingpai[n] >= 4) continue;
        bingpai[n]++;
        if (f_xiangting(shoupai) < n_xiangting) pai.push(s + n);
        bingpai[n]--;
      }
    }
  }
  return pai;
}
