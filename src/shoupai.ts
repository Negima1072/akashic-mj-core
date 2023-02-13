/**
 * Mahjong.Shoupai
 */

import { Menzi, Pai, Paizi } from "data";

type Bingpai = {
  _: number;
  m: number[];
  p: number[];
  s: number[];
  z: number[];
};

/**
 * 手牌を表現するクラス
 */
export class Shoupai {
  /**
   * **`p`** が{@link Pai | 牌}として正しければそのまま返す。正しくなければ `null` を返す。
   * `_` は正しいと見なさない。
   * @param p {@link Pai | 牌}
   * @returns 正しければ{@link Pai | 牌}そのまま。正しくなければ `null` を返す。
   * @see Pai
   */
  static valid_pai(p: Pai): Pai | null {
    if (p.match(/^(?:[mps]\d|z[1-7])_?\*?[\+\=\-]?$/)) return p;
  }

  /**
   * **`m`** が{@link Menzi | 面子}として正しければ正規化して返す。正しくなければ `null` を返す。
   * @param m {@link Menzi | 面子}
   * @returns 正しければ{@link Menzi | 面子}を正規化して返す。正しくなければ `null` を返す。
   */
  static valid_mianzi(m: Menzi): Menzi | null {
    if (m.match(/^z.*[089]/)) return;
    let h = m.replace(/0/g, "5");
    if (h.match(/^[mpsz](\d)\1\1[\+\=\-]\1?$/)) {
      return m.replace(/([mps])05/, "$1" + "50");
    } else if (h.match(/^[mpsz](\d)\1\1\1[\+\=\-]?$/)) {
      return (
        m[0] +
        m
          .match(/\d(?![\+\=\-])/g)
          .sort()
          .reverse()
          .join("") +
        (m.match(/\d[\+\=\-]$/) || [""])[0]
      );
    } else if (h.match(/^[mps]\d+\-\d*$/)) {
      let hongpai = m.match(/0/);
      let nn = h.match(/\d/g).sort();
      if (nn.length != 3) return;
      if (+nn[0] + 1 != +nn[1] || +nn[1] + 1 != +nn[2]) return;
      h =
        h[0] +
        h
          .match(/\d[\+\=\-]?/g)
          .sort()
          .join("");
      return hongpai ? h.replace(/5/, "0") : h;
    }
  }

  /**
   * **`qipai`** (配牌)からインスタンスを生成する。 **`qipai`** の要素数は13でなくてもよい。
   * @param qipai {@link Pai | 牌}の配列
   */
  constructor(qipai?: Pai[]) {
    this._bingpai = {
      _: 0,
      m: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      p: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      s: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      z: [0, 0, 0, 0, 0, 0, 0, 0],
    };
    this._fulou = [];
    this._zimo = null;
    this._lizhi = false;

    for (let p of qipai) {
      if (p == "_") {
        this._bingpai._++;
        continue;
      }
      if (!(p = Shoupai.valid_pai(p))) throw new Error(p);
      let s = p[0] as keyof Bingpai,
        n = +p[1];
      if (s != "_") {
        if (this._bingpai[s][n] == 4) throw new Error([this, p].toString());
        this._bingpai[s][n]++;
        if (s != "z" && n == 0) this._bingpai[s][5]++;
      }
    }
  }

  /**
   * **`paistr`** からインスタンスを生成する。
   * 手牌が14枚を超える牌姿の場合、超える分が純手牌(副露面子以外の打牌可能な手牌のこと)から取り除かれる。
   * @param paistr {@link Paizi | 牌姿}
   * @returns 生成した{@link Shoupai | 手牌}
   */
  static fromString(paistr?: Paizi): Shoupai {
    let fulou = paistr.split(",");
    let bingpai = fulou.shift();

    let qipai: string[] = bingpai.match(/_/g) || [];
    for (let suitstr of bingpai.match(/[mpsz]\d+/g) || []) {
      let s = suitstr[0];
      for (let n of suitstr.match(/\d/g)) {
        if (s == "z" && (parseInt(n) < 1 || 7 < parseInt(n))) continue;
        qipai.push(s + n);
      }
    }
    qipai = qipai.slice(0, 14 - fulou.filter((x) => x).length * 3);
    let zimo = (qipai.length - 2) % 3 == 0 && qipai.slice(-1)[0];
    const shoupai = new Shoupai(qipai);

    let last;
    for (let m of fulou) {
      if (!m) {
        shoupai._zimo = last;
        break;
      }
      m = Shoupai.valid_mianzi(m);
      if (m) {
        shoupai._fulou.push(m);
        last = m;
      }
    }

    shoupai._zimo = shoupai._zimo || zimo || null;
    shoupai._lizhi = bingpai.substr(-1) == "*";

    return shoupai;
  }

  /**
   * 以下の構成で純手牌の各牌の枚数を示す。添字0は赤牌の枚数。
   * @example
   * ```JavaScript
   * {
   *     _: 0,                       // 伏せられた牌
   *     m: [0,0,0,0,0,0,0,0,0,0],   // 萬子
   *     p: [0,0,0,0,0,0,0,0,0,0],   // 筒子
   *     s: [0,0,0,0,0,0,0,0,0,0],   // 索子
   *     z: [0,0,0,0,0,0,0,0],       // 字牌
   * }
   * ```
   */
  _bingpai: Bingpai;

  /**
   * 副露牌を示す{@link Menzi | 面子}の配列。副露した順に配列する。
   * 暗槓子も含むので `_fulou.length == 0` がメンゼンを示す訳ではないことに注意。
   */
  _fulou: Menzi[];

  /**
   * 手牌が打牌可能な場合、最後にツモしてきた{@link Pai | 牌}あるいは最後に副露した{@link Menzi | 面子}。
   * 打牌可能でない場合は `null`。
   */
  _zimo: Pai | Menzi | null;

  /**
   * リーチ後に `true` になる。
   */
  _lizhi: boolean;

  /**
   * {@link Paizi | 牌姿}に変換する。
   * @returns 変換した{@link Paizi | 牌姿}
   */
  toString(): Paizi {
    let paistr = "_".repeat(this._bingpai._ + (this._zimo == "_" ? -1 : 0));

    for (let s of ["m", "p", "s", "z"]) {
      let suitstr = s as keyof Bingpai;
      if (suitstr != "_") {
        let bingpai = this._bingpai[suitstr];
        let n_hongpai = s == "z" ? 0 : bingpai[0];
        for (let n = 1; n < bingpai.length; n++) {
          let n_pai = bingpai[n];
          if (this._zimo) {
            if (s + n == this._zimo) {
              n_pai--;
            }
            if (n == 5 && s + 0 == this._zimo) {
              n_pai--;
              n_hongpai--;
            }
          }
          for (let i = 0; i < n_pai; i++) {
            if (n == 5 && n_hongpai > 0) {
              suitstr += 0;
              n_hongpai--;
            } else {
              suitstr += n;
            }
          }
        }
      }
      if (suitstr.length > 1) paistr += suitstr;
    }
    if (this._zimo && this._zimo.length <= 2) paistr += this._zimo;
    if (this._lizhi) paistr += "*";

    for (let m of this._fulou) {
      paistr += "," + m;
    }
    if (this._zimo && this._zimo.length > 2) paistr += ",";

    return paistr;
  }

  /**
   * 複製する。
   * @returns 複製した{@link Shoupai | 手牌}
   */
  clone(): Shoupai {
    const shoupai = new Shoupai();

    shoupai._bingpai = {
      _: this._bingpai._,
      m: this._bingpai.m.concat(),
      p: this._bingpai.p.concat(),
      s: this._bingpai.s.concat(),
      z: this._bingpai.z.concat(),
    };
    shoupai._fulou = this._fulou.concat();
    shoupai._zimo = this._zimo;
    shoupai._lizhi = this._lizhi;

    return shoupai;
  }

  /**
   * **`paistr`** で手牌を置き換える。
   * @param paistr {@link Paizi | 牌姿}
   * @returns `this`
   */
  fromString(paistr: Paizi): this {
    const shoupai = Shoupai.fromString(paistr);
    this._bingpai = {
      _: shoupai._bingpai._,
      m: shoupai._bingpai.m.concat(),
      p: shoupai._bingpai.p.concat(),
      s: shoupai._bingpai.s.concat(),
      z: shoupai._bingpai.z.concat(),
    };
    this._fulou = shoupai._fulou.concat();
    this._zimo = shoupai._zimo;
    this._lizhi = shoupai._lizhi;

    return this;
  }

  decrease(s: keyof Bingpai, n: number): void {
    if (s != "_") {
      let bingpai = this._bingpai[s];
      if (bingpai[n] == 0 || (n == 5 && bingpai[0] == bingpai[5])) {
        if (this._bingpai._ == 0) throw new Error([this, s + n].toString());
        this._bingpai._--;
      } else {
        bingpai[n]--;
        if (n == 0) bingpai[5]--;
      }
    }
  }

  /**
   * **`p`** をツモる。
   * @param p {@link Pai | 牌}
   * @param check 真の場合、多牌となるツモは例外を発生する。
   * @returns `this`
   * @throws **`check`** が真の場合、多牌となるツモは例外を発生する。
   */
  zimo(p: Pai, check?: boolean): this {
    if (check && this._zimo) throw new Error([this, p].toString());
    if (p == "_") {
      this._bingpai._++;
      this._zimo = p;
    } else {
      if (!Shoupai.valid_pai(p)) throw new Error(p);
      let s = p[0] as keyof Bingpai,
        n = +p[1];
      if (s != "_") {
        let bingpai = this._bingpai[s];
        if (bingpai[n] == 4) throw new Error([this, p].toString());
        bingpai[n]++;
        if (n == 0) {
          if (bingpai[5] == 4) throw new Error([this, p].toString());
          bingpai[5]++;
        }
      }
      this._zimo = s + n;
    }
    return this;
  }

  /**
   * **`p`** を打牌する。
   * @param p {@link Pai | 牌}
   * @param check 真の場合、少牌となる打牌も例外を発生する。
   * @throws 手牌にない牌あるいは `_` の打牌は例外を発生する。
   * @throws **`check`** が真の場合、少牌となる打牌も例外を発生する。
   *
   * リーチ後の手出しはチェックしない。
   */
  dapai(p: Pai, check?: boolean): this {
    if (check && !this._zimo) throw new Error([this, p].toString());
    if (!Shoupai.valid_pai(p)) throw new Error(p);
    let s = p[0] as keyof Bingpai,
      n = +p[1];
    this.decrease(s, n);
    this._zimo = null;
    if (p.substr(-1) == "*") this._lizhi = true;
    return this;
  }

  /**
   * **`m`** で副露する。
   * @param m {@link Menzi | 面子}
   * @param check 真の場合、多牌となる副露も例外を発生する。
   * @throws **`check`** が真の場合、手牌にない構成での副露は例外を発生する。
   * @throws **`check`** が真の場合、多牌となる副露も例外を発生する。
   *
   * リーチ後の副露はチェックしない。
   */
  fulou(m: Menzi, check?: boolean): this {
    if (check && this._zimo) throw new Error([this, m].toString());
    if (m != Shoupai.valid_mianzi(m)) throw new Error(m);
    if (m.match(/\d{4}$/)) throw new Error([this, m].toString());
    if (m.match(/\d{3}[\+\=\-]\d$/)) throw new Error([this, m].toString());
    let s = m[0] as keyof Bingpai;
    for (let n of m.match(/\d(?![\+\=\-])/g)) {
      this.decrease(s, parseInt(n));
    }
    this._fulou.push(m);
    if (!m.match(/\d{4}/)) this._zimo = m;
    return this;
  }

  /**
   * **`m`** で暗槓もしくは加槓する。
   * @param m {@link Menzi | 面子}
   * @param check 真の場合、多牌となる副露も例外を発生する。
   * @throws 手牌にない構成での槓は例外を発生する。
   * @throws **`check`** が真の場合、多牌となる副露も例外を発生する。
   *
   * リーチ後の槓の正当性はチェックしない。
   */
  gang(m: Menzi, check?: boolean): this {
    if (check && !this._zimo) throw new Error([this, m].toString());
    if (check && this._zimo.length > 2) throw new Error([this, m].toString());
    if (m != Shoupai.valid_mianzi(m)) throw new Error(m);
    let s = m[0] as keyof Bingpai;
    if (m.match(/\d{4}$/)) {
      for (let n of m.match(/\d/g)) {
        this.decrease(s, parseInt(n));
      }
      this._fulou.push(m);
    } else if (m.match(/\d{3}[\+\=\-]\d$/)) {
      let m1 = m.slice(0, 5);
      let i = this._fulou.findIndex((m2) => m1 == m2);
      if (i < 0) throw new Error([this, m].toString());
      this._fulou[i] = m;
      this.decrease(s, parseInt(m.slice(-1)));
    } else throw new Error([this, m].toString());
    this._zimo = null;
    return this;
  }

  /**
   * メンゼンの場合、`true` を返す。
   * @returns メンゼンの場合、`true` を返す。
   */
  get menqian(): boolean {
    return this._fulou.filter((m) => m.match(/[\+\=\-]/)).length == 0;
  }

  /**
   * リーチ後は `true` を返す。
   * @returns リーチ後は `true` を返す。
   */
  get lizhi(): boolean {
    return this._lizhi;
  }

  /**
   * 打牌可能な牌の一覧を返す。赤牌およびツモ切りは別の牌として区別する。
   * @param check 真の場合、喰い替えとなる打牌は含まない。
   * @returns 打牌可能な{@link Pai | 牌}の配列。リーチ後はツモ切りのみ返す。打牌すると少牌となる場合は `null` を返す。
   */
  get_dapai(check?: boolean): Pai[] | null {
    if (!this._zimo) return null;

    let deny: { [key: string]: boolean } = {};
    if (check && this._zimo.length > 2) {
      let m = this._zimo;
      let s = m[0];
      let n = +m.match(/\d(?=[\+\=\-])/) || 5;
      deny[s + n] = true;
      if (!m.replace(/0/, "5").match(/^[mpsz](\d)\1\1/)) {
        if (n < 7 && m.match(/^[mps]\d\-\d\d$/)) deny[s + (n + 3)] = true;
        if (3 < n && m.match(/^[mps]\d\d\d\-$/)) deny[s + (n - 3)] = true;
      }
    }

    let dapai = [];
    if (!this._lizhi) {
      for (let s of ["m", "p", "s", "z"]) {
        let suitstr = s as keyof Bingpai;
        if (suitstr != "_") {
          let bingpai = this._bingpai[suitstr];
          for (let n = 1; n < bingpai.length; n++) {
            if (bingpai[n] == 0) continue;
            if (deny[s + n]) continue;
            if (s + n == this._zimo && bingpai[n] == 1) continue;
            if (s == "z" || n != 5) dapai.push(s + n);
            else {
              if ((bingpai[0] > 0 && s + 0 != this._zimo) || bingpai[0] > 1)
                dapai.push(s + 0);
              if (bingpai[0] < bingpai[5]) dapai.push(s + n);
            }
          }
        }
      }
    }
    if (this._zimo.length == 2) dapai.push(this._zimo + "_");
    return dapai;
  }

  /**
   * **`p`** でチー可能な面子の一覧を返す。赤牌のありなしは別の面子として区別する。
   * @param p {@link Pai | 牌}
   * @param check が真の場合、喰い替えが必ず起きる面子は含まない。
   * @returns チー可能な{@link Menzi | 面子}の配列。リーチ後は空配列を返す。チーすると多牌になる場合は `null` を返す。
   */
  get_chi_mianzi(p: Pai, check?: boolean): Menzi[] | null {
    if (this._zimo) return null;
    if (!Shoupai.valid_pai(p)) throw new Error(p);

    let mianzi: Menzi[] = [];
    let s = p[0] as keyof Bingpai,
      n = +p[1] || 5,
      d = p.match(/[\+\=\-]$/);
    if (!d) throw new Error(p);
    if (s == "z" || d[0] != "-") return mianzi;
    if (this._lizhi) return mianzi;

    if (s != "_") {
      let bingpai = this._bingpai[s];
      if (3 <= n && bingpai[n - 2] > 0 && bingpai[n - 1] > 0) {
        if (
          !check ||
          (3 < n ? bingpai[n - 3] : 0) + bingpai[n] <
            14 - (this._fulou.length + 1) * 3
        ) {
          if (n - 2 == 5 && bingpai[0] > 0) mianzi.push(s + "067-");
          if (n - 1 == 5 && bingpai[0] > 0) mianzi.push(s + "406-");
          if ((n - 2 != 5 && n - 1 != 5) || bingpai[0] < bingpai[5])
            mianzi.push(s + (n - 2) + (n - 1) + (p[1] + d));
        }
      }
      if (2 <= n && n <= 8 && bingpai[n - 1] > 0 && bingpai[n + 1] > 0) {
        if (!check || bingpai[n] < 14 - (this._fulou.length + 1) * 3) {
          if (n - 1 == 5 && bingpai[0] > 0) mianzi.push(s + "06-7");
          if (n + 1 == 5 && bingpai[0] > 0) mianzi.push(s + "34-0");
          if ((n - 1 != 5 && n + 1 != 5) || bingpai[0] < bingpai[5])
            mianzi.push(s + (n - 1) + (p[1] + d) + (n + 1));
        }
      }
      if (n <= 7 && bingpai[n + 1] > 0 && bingpai[n + 2] > 0) {
        if (
          !check ||
          bingpai[n] + (n < 7 ? bingpai[n + 3] : 0) <
            14 - (this._fulou.length + 1) * 3
        ) {
          if (n + 1 == 5 && bingpai[0] > 0) mianzi.push(s + "4-06");
          if (n + 2 == 5 && bingpai[0] > 0) mianzi.push(s + "3-40");
          if ((n + 1 != 5 && n + 2 != 5) || bingpai[0] < bingpai[5])
            mianzi.push(s + (p[1] + d) + (n + 1) + (n + 2));
        }
      }
    }
    return mianzi;
  }

  /**
   * **`p`** でポン可能な面子の一覧を返す。赤牌のありなしは別の面子として区別する。
   * @param p {@link Pai | 牌}
   * @returns ポン可能な{@link Menzi | 面子}の配列。リーチ後は空配列を返す。ポンすると多牌になる場合は `null` を返す。
   */
  get_peng_mianzi(p: Pai): Menzi[] | null {
    if (this._zimo) return null;
    if (!Shoupai.valid_pai(p)) throw new Error(p);

    let mianzi: Menzi[] = [];
    let s = p[0] as keyof Bingpai,
      n = +p[1] || 5,
      d = p.match(/[\+\=\-]$/);
    if (!d) throw new Error(p);
    if (this._lizhi) return mianzi;

    if (s != "_") {
      let bingpai = this._bingpai[s];
      if (bingpai[n] >= 2) {
        if (n == 5 && bingpai[0] >= 2) mianzi.push(s + "00" + p[1] + d);
        if (n == 5 && bingpai[0] >= 1 && bingpai[5] - bingpai[0] >= 1)
          mianzi.push(s + "50" + p[1] + d);
        if (n != 5 || bingpai[5] - bingpai[0] >= 2)
          mianzi.push(s + n + n + p[1] + d);
      }
    }
    return mianzi;
  }

  /**
   * カン可能な面子の一覧を返す。
   * @param p {@link Pai | 牌}
   * * **`p`** が指定された場合、それで大明槓可能な面子の一覧を返す。リーチ後は空配列を返す。
   * * **`p`** が指定されない場合は加槓あるいは暗槓可能な面子の一覧を返す。リーチ後は送り槓は含まない。
   * @returns カン可能な{@link Menzi | 面子}の配列。カンすると少牌あるいは多牌になる場合は `null` を返す。
   */
  get_gang_mianzi(p?: Pai): Menzi[] | null {
    let mianzi: Menzi[] = [];
    if (p) {
      if (this._zimo) return null;
      if (!Shoupai.valid_pai(p)) throw new Error(p);

      let s = p[0] as keyof Bingpai,
        n = +p[1] || 5,
        d = p.match(/[\+\=\-]$/);
      if (!d) throw new Error(p);
      if (this._lizhi) return mianzi;

      if (s != "_") {
        let bingpai = this._bingpai[s];
        if (bingpai[n] == 3) {
          if (n == 5)
            mianzi = [
              s +
                "5".repeat(3 - bingpai[0]) +
                "0".repeat(bingpai[0]) +
                p[1] +
                d,
            ];
          else mianzi = [s + n + n + n + n + d];
        }
      }
    } else {
      if (!this._zimo) return null;
      if (this._zimo.length > 2) return null;
      let p = this._zimo.replace(/0/, "5");

      for (let s of ["m", "p", "s", "z"]) {
        let suitstr = s as keyof Bingpai;
        if (suitstr != "_") {
          let bingpai = this._bingpai[suitstr];
          for (let n = 1; n < bingpai.length; n++) {
            if (bingpai[n] == 0) continue;
            if (bingpai[n] == 4) {
              if (this._lizhi && s + n != p) continue;
              if (n == 5)
                mianzi.push(
                  s + "5".repeat(4 - bingpai[0]) + "0".repeat(bingpai[0])
                );
              else mianzi.push(s + n + n + n + n);
            } else {
              if (this._lizhi) continue;
              for (let m of this._fulou) {
                if (m.replace(/0/g, "5").slice(0, 4) == s + n + n + n) {
                  if (n == 5 && bingpai[0] > 0) mianzi.push(m + 0);
                  else mianzi.push(m + n);
                }
              }
            }
          }
        }
      }
    }
    return mianzi;
  }
}
