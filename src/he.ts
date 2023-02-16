/**
 * Mahjong.He
 */

import type { Menzi, Pai } from "./data";
import { Shoupai } from "./shoupai";

/**
 * 捨て牌を表現するクラス
 */
export class He {
  /**
   * インスタンスを生成する。
   */
  constructor() {
    this._pai = [];
    this._find = {};
  }

  /**
   * 捨てられた{@link Pai | 牌}を表す配列。
   */
  _pai: Pai[];

  /**
   * 特定の{@link Pai | 牌}が捨て牌にあるか判定するためのキャッシュ。
   */
  _find: Record<Pai, boolean>;

  /**
   * **`p`** を捨て牌に追加する。
   * @param p {@link Pai | 牌}
   * @returns `this`
   */
  dapai(p: Pai): this {
    if (!Shoupai.valid_pai(p)) throw new Error(p);
    this._pai.push(p.replace(/[\+\=\-]$/, ""));
    this._find[p[0] + (+p[1] || 5)] = true;
    return this;
  }

  /**
   * **`m`** で副露された状態にする。
   * @param m {@link Menzi | 面子}
   * @returns `this`
   */
  fulou(m: Menzi): this {
    if (!Shoupai.valid_mianzi(m)) throw new Error(m);
    const p = m[0] + m.match(/\d(?=[\+\=\-])/),
      d = m.match(/[\+\=\-]/);
    if (!d) throw new Error(m);
    if (this._pai[this._pai.length - 1].substr(0, 2) !== p) throw new Error(m);
    this._pai[this._pai.length - 1] += d;
    return this;
  }

  /**
   * **`p`** が捨て牌にあるとき `true` を返す。
   * 手出し/ツモ切り、赤牌か否かは無視し、フリテンとなるか否かの観点で判定する。
   * @param p {@link Pai | 牌}
   * @returns **`p`** が捨て牌にあるとき `true` を返す。
   */
  find(p: Pai): boolean {
    return this._find[p[0] + (+p[1] || 5)];
  }
}
