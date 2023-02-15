/**
 * Mahjong.Player
 */

import { Board } from "board";
import { BoardInfo, BoardShan } from "boardInfo";
import { Menzi, Pai, Paipu } from "data";
import { Game } from "game";
import { He } from "he";
import { DapaiGameMessage, FulouGameMessage, GameMessage, GangGameMessage, GangzimoGameMessage, HuleGameMessage, KaigangGameMessage, KaijuGameMessage, PingjuGameMessage, PlayerMessage, QipaiGameMessage, ZimoGameMessage } from "message";
import { Rule } from "rule";
import { Shan } from "shan";
import { Shoupai } from "shoupai";
import * as Util from "./util";

/**
 * 対応呼び出し関数
 */
export type ReplyCallback = (reply?: PlayerMessage) => void;

/**
 * 対局者を実現する基底クラス
 * 唯一のメソッド {@link Player.action} の非同期呼び出しで受信した {@link GameMessage} に対して行動を決定し、 {@link PlayerMessage} を応答する。
 * 本クラスは抽象クラスであり、{@link Player.action} から各メッセージに対応するメソッドを呼び出すが、そのメソッドは [[卓情報]] を更新するのみの実装である。卓情報から具体的な行動を決定し、応答を返す処理はサブクラスで実装する必要がある。
 */
export abstract class Player {
  /**
   * **`_model`** に空の卓情報をもつインスタンスを生成する。
   */
  constructor(){
    this._model = new Board();
  }

  /**
   * **`msg`** に対応するメソッドを呼び出す。
   * @param msg {@link GameMessage}
   * @param callback 呼び出し関数
   */
  action(msg: GameMessage, callback?: ReplyCallback): void{
    this._callback = callback;
    if      ("kaiju" in msg)    this.kaiju  (msg.kaiju);
    else if ("qipai" in msg)    this.qipai  (msg.qipai);
    else if ("zimo" in msg)     this.zimo   (msg.zimo);
    else if ("dapai" in msg)    this.dapai  (msg.dapai);
    else if ("fulou" in msg)    this.fulou  (msg.fulou);
    else if ("gang" in msg)     this.gang   (msg.gang);
    else if ("gangzimo" in msg) this.zimo   (msg.gangzimo, true)
    else if ("kaigang" in msg)  this.kaigang(msg.kaigang);
    else if ("hule" in msg)     this.hule   (msg.hule);
    else if ("pingju" in msg)   this.pingju (msg.pingju);
    else if ("jieju" in msg)    this.jieju  (msg.jieju);
  }

  /**
   * {@link KaijuGameMessage} で通知された自身の席順(`0`: 仮東、`1`: 仮南、`2`: 仮西、`3`: 仮北)。
   */
  _id: number;

  /**
   * {@link Player["action"]} 呼び出し時に指定された応答送信用関数。
   */
  _callback: ReplyCallback;

  /**
   * {@link KaijuGameMessage} で通知された対局の{@link Rule | ルール}
   */
  _rule: Rule;

  /**
   * {@link Board} で設定する{@link BoardInfo | 卓情報}。
   */
  _model: Board;

  /**
   * 現在の局の自風。(`0`: 東、`1`: 南、`2`: 西、`3`: 北)
   */
  _menfeng: number;

  /**
   * 第一ツモ巡の間は `true`。
   */
  _diyizimo: boolean;

  /**
   * 現在の局で全ての対局者が行ったカンの総数。
   */
  _n_gang: number;

  /**
   * 自身のフリテン状態。ロン和了可能なら `true`。
   */
  _neng_rong: boolean;

  /**
   * {@link JiejuGameMessage}で伝えられた対戦結果の{@link Paipu | 牌譜}
   */
  _paipu: Paipu;

  /**
   * **`kaiju`** から{@link BoardInfo | 卓情報}を初期化し、{@link Player.action_kaiju}を呼び出し応答を返す。
   * @param kaiju {@link KaijuGameMessage}
   * @internal
   */
  kaiju(kaiju: KaijuGameMessage["kaiju"]): void{
    this._id = kaiju.id;
    this._rule = kaiju.rule;
    this._model.kaiju(kaiju);
    if (this._callback) this.action_kaiju(kaiju);
  }

  /**
   * **`qipai`** から{@link BoardInfo | 卓情報}を設定し、{@link Player.action_qipai}を呼び出し応答を返す。
   * @param qipai {@link QipaiGameMessage}
   * @internal
   */
  qipai(qipai: QipaiGameMessage["qipai"]): void{
    this._model.qipai(qipai);
    this._menfeng = this._model.menfeng(this._id);
    this._diyizimo = true;
    this._n_gang = 0;
    this._neng_rong = true;
    if (this._callback) this.action_qipai(qipai);
  }

  /**
   * **`zimo`** から{@link BoardInfo | 卓情報}を設定し、{@link Player.action_zimo}を呼び出し応答を返す。
   * @param zimo {@link ZimoGameMessage} (もしくは {@link GangzimoGameMessage})
   * @param gangzimo 真の場合は槓自摸を表す。
   * @internal
   */
  zimo(zimo: ZimoGameMessage["zimo"], gangzimo?: boolean): void{
    this._model.zimo(zimo);
    if (gangzimo) this._n_gang++;
    if (this._callback) this.action_zimo(zimo, gangzimo);
  }

  /**
   * **`dapai`** から{@link BoardInfo | 卓情報}を設定し、{@link Player.action_dapai}を呼び出し応答を返す。
   * @param dapai {@link DapaiGameMessage}
   * @internal
   */
  dapai(dapai: DapaiGameMessage["dapai"]): void{
    if (dapai.l == this._menfeng) {
      if (!this.shoupai.lizhi) this._neng_rong = true;
    }

    this._model.dapai(dapai);

    if (this._callback) this.action_dapai(dapai);

    if (dapai.l == this._menfeng) {
      this._diyizimo = false;
      if (this.hulepai.find((p) => this.he.find(p))) this._neng_rong = false;
    } else {
      let s = dapai.p[0],
        n = +dapai.p[1] || 5;
      if (this.hulepai.find((p) => p == s + n)) this._neng_rong = false;
    }
  }

  /**
   * **`fulou`** から{@link BoardInfo | 卓情報}を設定し、{@link Player.action_fulou}を呼び出し応答を返す。
   * @param fulou {@link FulouGameMessage}
   * @internal
   */
  fulou(fulou: FulouGameMessage["fulou"]): void{
    this._model.fulou(fulou);

    if (this._callback) this.action_fulou(fulou);

    this._diyizimo = false;
  }

  /**
   * **`gang`** から{@link BoardInfo | 卓情報}を設定し、{@link Player.action_gang}を呼び出し応答を返す。
   * @param gang {@link GangGameMessage}
   * @internal
   */
  gang(gang: GangGameMessage["gang"]): void{
    this._model.gang(gang);

    if (this._callback) this.action_gang(gang);

    this._diyizimo = false;
    if (gang.l != this._menfeng && !gang.m.match(/^[mpsz]\d{4}$/)) {
      let s = gang.m[0],
        n = +gang.m.slice(-1) || 5;
      if (this.hulepai.find((p) => p == s + n)) this._neng_rong = false;
    }
  }

  /**
   * **`kaigang`** から{@link BoardInfo | 卓情報}を設定する。
   * @param kaigang {@link KaigangGameMessage}
   * @internal
   */
  kaigang(kaigang: KaigangGameMessage["kaigang"]): void{
    this._model.kaigang(kaigang);
  }

  /**
   * **`hule`** から{@link BoardInfo | 卓情報}を設定し、{@link Player.action_hule}を呼び出し応答を返す。
   * @param hule {@link HuleGameMessage}
   * @internal
   */
  hule(hule: HuleGameMessage["hule"]): void{
    this._model.hule(hule);
    if (this._callback) this.action_hule(hule);
  }

  /**
   * **`pingju`** から{@link BoardInfo | 卓情報}を設定し、{@link Player.action_pingju}を呼び出し応答を返す。
   * @param pingju {@link PingjuGameMessage}
   * @internal
   */
  pingju(pingju: PingjuGameMessage["pingju"]): void{
    this._model.pingju(pingju);
    if (this._callback) this.action_pingju(pingju);
  }

  /**
   * {@link Player.action_jieju}を呼び出し応答を返す。
   * @param jieju {@link Paipu | 牌譜}
   * @internal
   */
  jieju(paipu: Paipu): void{
    this._model.jieju(paipu);
    this._paipu = paipu;
    if (this._callback) this.action_jieju(paipu);
  }

  /**
   * 自身の手牌を返す。
   * @returns 自身の{@link Shoupai | 手牌}
   * @internal
   */
  get shoupai(): Shoupai{
    return this._model.shoupai[this._menfeng];
  }

  /**
   * 自身の捨て牌を返す。
   * @returns 自身の{@link He | 捨て牌}
   * @internal
   */
  get he(): He{
    return this._model.he[this._menfeng];
  }

  /**
   * 牌山を返す。
   * @returns 互換のオブジェクト{@link Shan | 牌山}
   * @internal
   */
  get shan(): BoardShan{
    return this._model.shan;
  }

  /**
   * 自身の手牌がテンパイしている場合、和了牌の一覧を返す。
   * @returns 和了{@link Pai | 牌}の配列。テンパイしていない場合は空の配列を返す。
   */
  get hulepai(): Pai[]{
    return (
      (Util.xiangting(this.shoupai) == 0 &&
        Util.tingpai(this.shoupai)) ||
      []
    );
  }

  /**
   * {@link Rule | ルール} と {@link BoardInfo | 卓情報} を使用して {@link Game.get_dapai} を呼び出し、
   * **`shoupai`** が打牌可能な牌の一覧を返す。
   * @param shoupai {@link Shoupai}
   * @returns 打牌可能な{@link Pai | 牌}の配列。
   */
  get_dapai(shoupai: Shoupai): Pai[]{
    return Game.get_dapai(this._rule, shoupai);
  }

  /**
   * {@link Rule | ルール} と {@link BoardInfo | 卓情報} を使用して {@link Game.get_chi_mianzi} を呼び出し、
   * **`shoupai`** が **`p`** でチー可能な面子の一覧を返す。
   * @param shoupai {@link Shoupai}
   * @param p {@link Pai | 牌}
   * @returns チー可能な{@link Menzi | 面子}の配列。
   */
  get_chi_mianzi(shoupai: Shoupai, p: Pai): Menzi[]{
    return Game.get_chi_mianzi(
      this._rule,
      shoupai,
      p,
      this.shan.paishu
    );
  }

  /**
   * {@link Rule | ルール} と {@link BoardInfo | 卓情報} を使用して {@link Game.get_peng_mianzi} を呼び出し、
   * **`shoupai`** が **`p`** でポン可能な面子の一覧を返す。
   * @param shoupai {@link Shoupai}
   * @param p {@link Pai | 牌}
   * @returns ポン可能な{@link Menzi | 面子}の配列。
   */
  get_peng_mianzi(shoupai: Shoupai, p: Pai): Menzi[]{
    return Game.get_peng_mianzi(
      this._rule,
      shoupai,
      p,
      this.shan.paishu
    );
  }

  /**
   * {@link Rule | ルール} と {@link BoardInfo | 卓情報} を使用して {@link Game.get_gang_mianzi} を呼び出し、
   * **`shoupai`** がカン可能な面子の一覧を返す。
   * @param shoupai {@link Shoupai}
   * @param p {@link Pai | 牌}。指定された場合は大明槓、`null` の場合は暗槓と加槓が対象になる。
   * @returns カン可能な{@link Menzi | 面子}の配列。
   */
  get_gang_mianzi(shoupai: Shoupai, p?: Pai | null): Menzi[]{
    return Game.get_gang_mianzi(
      this._rule,
      shoupai,
      p,
      this.shan.paishu,
      this._n_gang
    );
  }

  /**
   * {@link Rule | ルール} と {@link BoardInfo | 卓情報} を使用して {@link Game.allow_lizhi} を呼び出し、
   * **`shoupai`** からリーチ可能か判定する。
   * @param shoupai {@link Shoupai}
   * @param p
   * * **`p`** が `null` のときはリーチ可能な打牌一覧を返す。
   * * **`p`** が{@link Pai | 牌}のときは **`p`** を打牌してリーチ可能なら `true` を返す。
   * @returns リーチ可能なら `true` を返す。
   */
  allow_lizhi(shoupai: Shoupai, p?: Pai | null): Pai[] | boolean{
    return Game.allow_lizhi(
      this._rule,
      shoupai,
      p,
      this.shan.paishu,
      this._model.defen[this._id]
    );
  }

  /**
   * {@link Rule | ルール} と {@link BoardInfo | 卓情報} を使用して {@link Game.allow_hule} を呼び出し、
   * **`shoupai`** から和了可能か判定する。
   * @param shoupai {@link Shoupai}
   * @param p
   * * **`p`** が `null` のときはツモ和了可能なら `true` を返す。
   * * **`p`** が{@link Pai | 牌}のときは **`p`** でロン和了可能なら `true` を返す。
   * @param hupai 状況役があるときは `true` を指定する
   * @returns 和了可能なら `true` を返す。
   */
  allow_hule(shoupai: Shoupai, p?: Pai | null, hupai?: boolean): boolean{
    hupai = hupai || shoupai.lizhi || this.shan.paishu == 0;
    return Game.allow_hule(
      this._rule,
      shoupai,
      p,
      this._model.zhuangfeng,
      this._menfeng,
      hupai,
      this._neng_rong
    );
  }

  /**
   * {@link Rule | ルール} と {@link BoardInfo | 卓情報} を使用して {@link Game.allow_pingju} を呼び出し、
   * **`shoupai`** で九種九牌流局可能か判定する。
   * @param shoupai {@link Shoupai}
   * @returns 九種九牌流局可能なら `true` を返す。
   */
  allow_pingju(shoupai: Shoupai): boolean{
    return Game.allow_pingju(this._rule, shoupai, this._diyizimo);
  }

  /**
   * {@link Rule | ルール} と {@link BoardInfo | 卓情報} を使用して {@link Game.allow_no_daopai} を呼び出し、
   * **`shoupai`** で「テンパイ宣言」可能か判定する。
   * @param shoupai {@link Shoupai}
   * @returns 「テンパイ宣言」可能なら `true` を返す。
   */
  allow_no_daopai(shoupai: Shoupai): boolean{
    return Game.allow_no_daopai(this._rule, shoupai, this.shan.paishu);
  }

  /**
   * **`kaiju`** を確認し空応答する処理を実装する。
   * @param kaiju {@link KaijuGameMessage}
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_kaiju(kaiju: KaijuGameMessage["kaiju"]): void;

  /**
   * **`qipai`** を確認し空応答する処理を実装する。
   * @param qipai {@link Qipai} (または {@link QipaiGameMessage})
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_qipai(qipai: QipaiGameMessage["qipai"]): void;

  /**
   * **`zimo`** から適切な応答(打牌・槓・和了・倒牌)を選択し返す処理を実装する。
   * @param zimo {@link ZimoGameMessage} (または {@link GangzimoGameMessage})
   * @param gangzimo 真の場合は槓自摸を表す。
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_zimo(
    zimo: ZimoGameMessage["zimo"] | GangzimoGameMessage["gangzimo"],
    gangzimo?: boolean
  ): void;

  /**
   * **`dapai`** から適切な応答(副露・和了・倒牌)を選択し返す処理を実装する。
   * @param dapai {@link DapaiGameMessage}
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_dapai(dapai: DapaiGameMessage["dapai"]): void;

  /**
   * **`fulou`** から適切な応答(打牌)を選択し返す処理を実装する。
   * @param fulou {@link FulouGameMessage}
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_fulou(fulou: FulouGameMessage["fulou"]): void;

  /**
   * **`gang`** から適切な応答(打牌・槓・和了)を選択し返す処理を実装する。
   * @param gang {@link GangGameMessage}
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_gang(gang: GangGameMessage["gang"]): void;

  /**
   * **`hule`** を確認し空応答する処理を実装する。
   * @param hule {@link HuleGameMessage}
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_hule(hule: HuleGameMessage["hule"]): void;

  /**
   * **`pingju`** を確認し空応答する処理を実装する。
   * @param pingju {@link PingjuGameMessage}
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_pingju(pingju: PingjuGameMessage["pingju"]): void;

  /**
   * **`paipu`** を確認し空応答する処理を実装する。
   * @param paipu {@link Paipu | 牌譜}
   * @vitural サブクラスで実装する必要がある。
   */
  abstract action_jieju(paipu: Paipu): void;
}
