/**
 * Mahjong.Board
 */

import type { BoardInfo} from "boardInfo";
import { BoardShan } from "boardInfo";
import type {
  Dapai,
  Fulou,
  Gang,
  Gangzimo,
  Hule,
  Kaigang,
  Paipu,
  Pingju,
  Qipai,
  Zimo,
} from "data";
import { He } from "he";
import type {
  DapaiGameMessage,
  FulouGameMessage,
  GangGameMessage,
  GangzimoGameMessage,
  HuleGameMessage,
  JiejuGameMessage,
  KaigangGameMessage,
  KaijuGameMessage,
  QipaiGameMessage,
  ZimoGameMessage,
} from "message";
import { Shoupai } from "shoupai";

export interface Board extends BoardInfo {}

/**
 * 開局時の卓情報
 * @see {@link Paipu} (または {@link KaijuGameMessage.kaiju})
 */
export interface BoardKaijuParams {
  title: string;
  player: string[];
  qijia: number;
}

export class Board implements BoardInfo {
  /**
   * **`kaiju`** から開局時の卓情報を生成する。
   * **`kaiju`** が指定されない場合は、空の卓情報を生成する。
   * @param kaiju {@link Paipu} (または {@link KaijuGameMessage.kaiju})
   */
  constructor(kaiju?: Paipu | KaijuGameMessage["kaiju"] | BoardKaijuParams) {
    if (kaiju) this.kaiju(kaiju);
  }

  /**
   * 成立待ちのリーチ宣言があるとき真。
   */
  _lizhi: boolean;

  /**
   * ダブロンの際に先の和了の {@link Hule.hule | `hule.fenpei`} を次の和了に引き継ぐ。
   */
  _fenpei: number[];

  /**
   * **`kaiju`** を卓情報に反映する。
   * @param kaiju {@link Paipu} (または {@link KaijuGameMessage})
   */
  kaiju(kaiju?: Paipu | KaijuGameMessage["kaiju"] | BoardKaijuParams): void {
    this.title = kaiju.title;
    this.player = kaiju.player;
    this.qijia = kaiju.qijia;

    this.zhuangfeng = 0;
    this.jushu = 0;
    this.changbang = 0;
    this.lizhibang = 0;
    this.defen = [];
    this.shan = null;
    this.shoupai = [];
    this.he = [];
    this.player_id = [0, 1, 2, 3];
    this.lunban = -1;
  }

  /**
   * 席順に対する現在の自風を返す。
   * @param id 席順 (`0`: 仮東、`1`: 仮南、`2`: 仮西、`3`: 仮北)
   * @returns 現在の自風 (`0`: 東、`1`: 南、`2`: 西、`3`: 北)
   */
  menfeng(id: number): number {
    return (id + 4 - this.qijia + 4 - this.jushu) % 4;
  }

  /**
   * **`qipai`** を卓情報に反映する。
   * @param qipai {@link Qipai} (または {@link QipaiGameMessage})
   */
  qipai(qipai: Qipai["qipai"] | QipaiGameMessage["qipai"]): void {
    this.zhuangfeng = qipai.zhuangfeng;
    this.jushu = qipai.jushu;
    this.changbang = qipai.changbang;
    this.lizhibang = qipai.lizhibang;
    this.shan = new BoardShan(qipai.baopai);
    for (let l = 0; l < 4; l++) {
      const paistr = qipai.shoupai[l] || "_".repeat(13);
      this.shoupai[l] = Shoupai.fromString(paistr);
      this.he[l] = new He();
      this.player_id[l] = (this.qijia + this.jushu + l) % 4;
      this.defen[this.player_id[l]] = qipai.defen[l];
    }
    this.lunban = -1;

    this._lizhi = false;
    this._fenpei = null;
  }

  /**
   * **`zimo`** を卓情報に反映する。
   * @remarks {@link Gangzimo} ({@link GangzimoGameMessage})の場合も本メソッドを使用する。
   * @param zimo {@link Zimo} (または {@link ZimoGameMessage})
   */
  zimo(
    zimo:
      | Zimo["zimo"]
      | Gangzimo["gangzimo"]
      | ZimoGameMessage["zimo"]
      | GangzimoGameMessage["gangzimo"]
  ): void {
    this.lizhi();
    this.lunban = zimo.l;
    this.shoupai[zimo.l].zimo(this.shan.zimo(zimo.p), false);
  }

  /**
   * **`dapai`** を卓情報に反映する。
   * @param dapai {@link Dapai} (または {@link DapaiGameMessage})
   */
  dapai(dapai: Dapai["dapai"] | DapaiGameMessage["dapai"]): void {
    this.lunban = dapai.l;
    this.shoupai[dapai.l].dapai(dapai.p, false);
    this.he[dapai.l].dapai(dapai.p);
    this._lizhi = dapai.p.slice(-1) === "*";
  }

  /**
   * **`fulou`** を卓情報に反映する。
   * @param fulou {@link Fulou} (または {@link FulouGameMessage})
   */
  fulou(fulou: Fulou["fulou"] | FulouGameMessage["fulou"]): void {
    this.lizhi();
    this.he[this.lunban].fulou(fulou.m);
    this.lunban = fulou.l;
    this.shoupai[fulou.l].fulou(fulou.m, false);
  }

  /**
   * **`gang`** を卓情報に反映する。
   * @param gang {@link Gang} (または {@link GangGameMessage})
   */
  gang(gang: Gang["gang"] | GangGameMessage["gang"]): void {
    this.lunban = gang.l;
    this.shoupai[gang.l].gang(gang.m, false);
  }

  /**
   * **`kaigang`** を卓情報に反映する。
   * @param kaigang {@link Kaigang} (または {@link KaigangGameMessage})
   */
  kaigang(kaigang: Kaigang["kaigang"] | KaigangGameMessage["kaigang"]): void {
    this.shan.kaigang(kaigang.baopai);
  }

  /**
   * **`hule`** を卓情報に反映する。
   * @param hule {@link Hule} (または {@link HuleGameMessage})
   */
  hule(hule: Hule["hule"] | HuleGameMessage["hule"]): void {
    const shoupai = this.shoupai[hule.l];
    shoupai.fromString(hule.shoupai);
    if (hule.baojia != null) shoupai.dapai(shoupai.get_dapai().pop());
    if (this._fenpei) {
      this.changbang = 0;
      this.lizhibang = 0;
      for (let l = 0; l < 4; l++) {
        this.defen[this.player_id[l]] += this._fenpei[l];
      }
    }
    this.shan.fubaopai = hule.fubaopai;
    this._fenpei = hule.fenpei;
  }

  /**
   * **`pingju`** を卓情報に反映する。
   * @param pingju {@link Pingju} (または {@link PingjuGameMessage})
   * @remarks **`defen`** は使われていない。
   */
  pingju(pingju: Pick<Pingju["pingju"], "name" | "shoupai">): void {
    if (!pingju.name.match(/^三家和/)) this.lizhi();
    for (let l = 0; l < 4; l++) {
      if (pingju.shoupai[l]) this.shoupai[l].fromString(pingju.shoupai[l]);
    }
  }

  /**
   * **`paipu`** を卓情報に反映する。
   * @param jieju {@link Paipu} (または {@link JiejuGameMessage})
   */
  jieju(paipu: Paipu | JiejuGameMessage["jieju"]): void {
    for (let id = 0; id < 4; id++) {
      this.defen[id] = paipu.defen[id];
    }
    this.lunban = -1;
  }

  /**
   * 成立待ちのリーチ宣言を成立させる。
   * @internal
   */
  lizhi(): void {
    if (this._lizhi) {
      this.defen[this.player_id[this.lunban]] -= 1000;
      this.lizhibang++;
      this._lizhi = false;
    }
  }
}
