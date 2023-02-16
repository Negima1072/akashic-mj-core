/**
 * Mahjong.Shan
 */

import type { Pai } from "./data";
import type { Rule } from "./rule";
import { Shoupai } from "./shoupai";

/**
 * 牌山を表現するクラス
 */
export class Shan {
  /**
   * ドラ表示牌が **`p`** の場合のドラを返す。
   * @param p ドラ表示{@link Pai | 牌}
   * @returns ドラ{@link Pai | 牌}
   */
  static zhenbaopai(p: Pai): Pai {
    if (!Shoupai.valid_pai(p)) throw new Error(p);
    const s = p[0],
      n = +p[1] || 5;
    return s === "z"
      ? n < 5
        ? s + ((n % 4) + 1)
        : s + (((n - 4) % 3) + 5)
      : s + ((n % 9) + 1);
  }

  /**
   * インスタンスを生成する。赤牌の枚数、カンドラ、裏ドラ、カン裏は **`rule`** にしたがう。
   * @param rule {@link Rule | ルール}
   */
  constructor(rule: Rule) {
    this._rule = rule;
    const hongpai = rule.redPai;

    const pai = [];
    for (const s of ["m", "p", "s", "z"]) {
      const paitstr = s as "m" | "p" | "s" | "z";
      for (let n = 1; n <= (paitstr === "z" ? 7 : 9); n++) {
        for (let i = 0; i < 4; i++) {
          if (paitstr === "z") {
            pai.push(paitstr + n);
          } else {
            if (n === 5 && i < hongpai[paitstr]) pai.push(paitstr + 0);
            else pai.push(paitstr + n);
          }
        }
      }
    }

    this._pai = [];
    while (pai.length) {
      this._pai.push(pai.splice(g.game.random.generate() * pai.length, 1)[0]);
    }

    this._baopai = [this._pai[4]];
    this._fubaopai = rule.enableUradora ? [this._pai[9]] : null;
    this._weikaigang = false;
    this._closed = false;
  }

  /**
   * インスタンス生成時に指定された{@link Rule | ルール}
   */
  _rule: Rule;

  /**
   * 牌山中の牌を表す {@link Pai | 牌} の配列。
   * 初期状態では添字 `0`〜`13` が王牌となり、
   * `0`〜`3` がリンシャン牌、
   * `4`〜`8` がドラ表示牌、
   * `9`〜`13` が裏ドラ表示牌として順に使用される。
   * ツモは常に最後尾から取られる。
   */
  _pai: Pai[];

  /**
   * ドラ表示{@link Pai | 牌}の配列。
   */
  _baopai: Pai[];

  /**
   * 裏ドラ表示{@link Pai | 牌}の配列。
   */
  _fubaopai: Pai[];

  /**
   * 開槓可能なとき `true` になる。
   */
  _weikaigang: boolean;

  /**
   * 牌山固定後に `true` になる。
   */
  _closed: boolean;

  /**
   * 次のツモ牌を返す。
   * @returns ツモ{@link Pai | 牌}
   * @throws 牌山固定後に呼び出された場合は例外を発生する。
   */
  zimo(): Pai {
    if (this._closed) throw new Error(this.toString());
    if (this.paishu === 0) throw new Error(this.toString());
    if (this._weikaigang) throw new Error(this.toString());
    return this._pai.pop();
  }

  /**
   * リンシャン牌からの次のツモ牌を返す。
   * @returns ツモ{@link Pai | 牌}
   * @throws 牌山固定後に呼び出された場合は例外を発生する。
   */
  gangzimo(): Pai {
    if (this._closed) throw new Error(this.toString());
    if (this.paishu === 0) throw new Error(this.toString());
    if (this._weikaigang) throw new Error(this.toString());
    if (this._baopai.length === 5) throw new Error(this.toString());
    this._weikaigang = this._rule.enableKandora;
    if (!this._weikaigang) this._baopai.push("");
    return this._pai.shift();
  }

  /**
   * カンドラを増やす。
   * @returns `this`
   * @throws カンヅモより前に呼び出された場合は例外を発生する。
   */
  kaigang(): this {
    if (this._closed) throw new Error(this.toString());
    if (!this._weikaigang) throw new Error(this.toString());
    this._baopai.push(this._pai[4]);
    if (this._fubaopai && this._rule.enableKanUra)
      this._fubaopai.push(this._pai[9]);
    this._weikaigang = false;
    return this;
  }

  /**
   * 牌山を固定する。
   * @returns `this`
   */
  close(): this {
    this._closed = true;
    return this;
  }

  /**
   * ツモ可能な残り牌数を返す。
   * @returns 残り牌数
   */
  get paishu(): number {
    return this._pai.length - 14;
  }

  /**
   * ドラ表示牌の配列を返す。
   * @returns ドラ表示{@link Pai | 牌}の配列
   */
  get baopai(): Pai[] {
    return this._baopai.filter((x) => x);
  }

  /**
   * 牌山固定前は `null` を返す。
   * 牌山固定後は裏ドラ表示牌の配列を返す。
   * @returns 裏ドラ表示{@link Pai | 牌}の配列
   */
  get fubaopai(): Pai[] | null {
    return !this._closed
      ? null
      : this._fubaopai
      ? this._fubaopai.concat()
      : null;
  }
}
