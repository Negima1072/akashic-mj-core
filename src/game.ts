/**
 * Mahjong.Game
 */

import { BoardInfo } from "boardInfo";
import { Hule, Huleyi, Menzi, Moda, Pai, Paipu, Paizi } from "data";
import { He } from "he";
import {
  DapaiPlayerMessage,
  EmptyPlayerMessage,
  FulouPlayerMessage,
  GameMessage,
  GangPlayerMessage,
  PlayerMessage,
} from "message";
import { Player } from "player";
import { Rule, rule as makeRule } from "rule";
import { Shan } from "shan";
import { Bingpai, Shoupai } from "shoupai";
import { View } from "view";
import * as Util from "./util";

/** 対局終了時に呼ばれた関数 */
export type JiejuCallback = (paipu: Paipu) => void;

/**
 * 局進行を実現するクラス
 *
 * @remarks
 * インスタンス生成後、{@link Game.kaiju} の呼び出しで対局を開始する。
 * その後は対局者からの応答により非同期に {@link Game.next} が呼ばれることで局が進行する。
 * 対局終了時にはインスタンス生成時に指定したコールバック関数を呼んで処理が終了する。
 *
 * クラスメソッドで進行の妥当性を判断するための関数を提供する。
 * これらのメソッドは {@link Game} 自身が使用するだけでなく、{@link Player} が使用することも想定している。
 */
export class Game {
  /**
   * 指定されたパラメータから対局を生成する。
   * @param players 指定された4名{@link Player | 対局者}の配列
   * @param callback 対局終了時に呼ばれた関数(対局の{@link Paipu | 牌譜}が引数で渡される)。
   * @param rule 指定された{@link Rule | ルール}。省略した場合は、`Majiang.rule()` の呼び出しで得られるルールの初期値が採用される。
   * @param title 牌譜に残すタイトル
   */
  constructor(
    players: Player[],
    callback?: JiejuCallback | null,
    rule?: Rule,
    title?: string
  ) {
    this._players = players;
    this._callback = callback || (() => {});
    this._rule = rule || makeRule();

    this._model = {
      title: title || "Mahjong_" + new Date().toLocaleString(),
      player: ["私", "下家", "対面", "上家"],
      qijia: 0,
      zhuangfeng: 0,
      jushu: 0,
      changbang: 0,
      lizhibang: 0,
      defen: [0, 0, 0, 0].map((x) => this._rule["originPoint"]),
      shan: null,
      shoupai: [],
      he: [],
      player_id: [0, 1, 2, 3],
      lunban: 0,
    };

    this._reply = [];
    this._sync = false;
    this._stop = null;
    this._speed = 3;
    this._wait = 0;
  }

  /**
   * {@link Shoupai.get_dapai} を呼び出し、 **`rule`** にしたがって **`shoupai`** から打牌可能な牌の一覧を返す。
   * @param rule {@link Rule | ルール}
   * @param shoupai {@link Shoupai | 手牌}
   * @returns 打牌可能な{@link Pai | 牌}の配列
   */
  static get_dapai(rule: Rule, shoupai: Shoupai): Pai[] | null {
    if (rule["kuikaeAllowLevel"] == 0) return shoupai.get_dapai(true);
    if (
      rule["kuikaeAllowLevel"] == 1 &&
      shoupai._zimo &&
      shoupai._zimo.length > 2
    ) {
      let deny =
        shoupai._zimo[0] + (+shoupai._zimo.match(/\d(?=[\+\=\-])/) || 5);
      return shoupai
        .get_dapai(false)
        .filter((p) => p.replace(/0/, "5") != deny);
    }
    return shoupai.get_dapai(false);
  }

  /**
   * {@link Shoupai.get_chi_mianzi} を呼び出し、 **`rule`** にしたがって **`shoupai`** から **`p`** でチー可能な面子の一覧を返す。
   * @param rule {@link Rule | ルール}
   * @param shoupai {@link Shoupai | 手牌}
   * @param p {@link Pai | 牌}
   * @param paishu 現在の残り牌数
   * @returns チー可能な{@link Menzi | 面子}の配列
   */
  static get_chi_mianzi(
    rule: Rule,
    shoupai: Shoupai,
    p: Pai,
    paishu: number
  ): Menzi[] {
    let mianzi = shoupai.get_chi_mianzi(p, rule["kuikaeAllowLevel"] == 0);
    let paitstr = p[0] as keyof Bingpai;
    if (!mianzi) return mianzi;
    if (
      rule["kuikaeAllowLevel"] == 1 &&
      shoupai._fulou.length == 3 &&
      paitstr != "_" &&
      shoupai._bingpai[paitstr][parseInt(p[1])] == 2
    )
      mianzi = [];
    return paishu == 0 ? [] : mianzi;
  }

  /**
   * {@link Shoupai.get_peng_mianzi} を呼び出し、 **`rule`** にしたがって **`shoupai`** から **`p`** でポン可能な面子の一覧を返す。
   * @param rule {@link Rule | ルール}
   * @param shoupai {@link Shoupai | 手牌}
   * @param p {@link Pai | 牌}
   * @param paishu 現在の残り牌数
   * @returns ポン可能な{@link Menzi | 面子}の配列
   */
  static get_peng_mianzi(
    rule: Rule,
    shoupai: Shoupai,
    p: Pai,
    paishu: number
  ): Menzi[] {
    let mianzi = shoupai.get_peng_mianzi(p);
    if (!mianzi) return mianzi;
    return paishu == 0 ? [] : mianzi;
  }

  /**
   * {@link Shoupai.get_gang_mianzi} を呼び出し、 **`rule`** にしたがって **`shoupai`** から **`p`** でカン可能な面子の一覧を返す。
   * @param rule {@link Rule | ルール}
   * @param shoupai {@link Shoupai | 手牌}
   * @param p {@link Pai | 牌}。指定された場合は大明槓、`null` の場合は暗槓と加槓が対象になる。
   * @param paishu 現在の残り牌数
   * @param n_gang その局に行われた槓の数
   * @returns カン可能な{@link Menzi | 面子}の配列
   */
  static get_gang_mianzi(
    rule: Rule,
    shoupai: Shoupai,
    p: Pai | null | undefined,
    paishu: number,
    n_gang?: number
  ): Menzi[] {
    let mianzi = shoupai.get_gang_mianzi(p);
    if (!mianzi || mianzi.length == 0) return mianzi;

    if (shoupai.lizhi) {
      if (rule["ankanAfterReachAllowLevel"] == 0) return [];
      else if (rule["ankanAfterReachAllowLevel"] == 1) {
        let new_shoupai,
          n_hule1 = 0,
          n_hule2 = 0;
        new_shoupai = shoupai.clone().dapai(shoupai._zimo);
        for (let p of Util.tingpai(new_shoupai)) {
          n_hule1 += Util.hule_mianzi(new_shoupai, p).length;
        }
        new_shoupai = shoupai.clone().gang(mianzi[0]);
        for (let p of Util.tingpai(new_shoupai)) {
          n_hule2 += Util.hule_mianzi(new_shoupai, p).length;
        }
        if (n_hule1 > n_hule2) return [];
      } else {
        let new_shoupai;
        new_shoupai = shoupai.clone().dapai(shoupai._zimo);
        let n_tingpai1 = Util.tingpai(new_shoupai).length;
        new_shoupai = shoupai.clone().gang(mianzi[0]);
        if (Util.xiangting(new_shoupai) > 0) return [];
        let n_tingpai2 = Util.tingpai(new_shoupai).length;
        if (n_tingpai1 > n_tingpai2) return [];
      }
    }
    return paishu == 0 || n_gang == 4 ? [] : mianzi;
  }

  /**
   * **`rule`** にしたがって **`shoupai`** からリーチ可能か判定する。
   * @param rule {@link Rule | ルール}
   * @param shoupai {@link Shoupai | 手牌}
   * @param p `null` のときはリーチ可能な打牌一覧を返す。{@link Pai | 牌}のときは **`p`** を打牌してリーチ可能なら `true` を返す。
   * @param paishu 現在の残り牌数
   * @param defen 現在の持ち点
   * @returns **`p`** が `null` のときはリーチ可能な打牌の配列。 **`p`** が {@link Pai | 牌} のときは **`p`** を打牌してリーチ可能なら `true` を返す
   */
  static allow_lizhi(
    rule: Rule,
    shoupai: Shoupai,
    p: Pai | null | undefined,
    paishu: number,
    defen: number
  ): Pai[] | boolean {
    if (!shoupai._zimo) return false;
    if (shoupai.lizhi) return false;
    if (!shoupai.menqian) return false;

    if (!rule["enableRiichiWithoutTurn"] && paishu < 4) return false;
    if (rule["enableTobiEnd"] && defen < 1000) return false;

    if (Util.xiangting(shoupai) > 0) return false;

    if (p) {
      let new_shoupai = shoupai.clone().dapai(p);
      return (
        Util.xiangting(new_shoupai) == 0 && Util.tingpai(new_shoupai).length > 0
      );
    } else {
      let dapai = [];
      for (let p of Game.get_dapai(rule, shoupai)) {
        let new_shoupai = shoupai.clone().dapai(p);
        if (
          Util.xiangting(new_shoupai) == 0 &&
          Util.tingpai(new_shoupai).length > 0
        ) {
          dapai.push(p);
        }
      }
      return dapai.length ? dapai : false;
    }
  }

  /**
   * **`rule`** にしたがって **`shoupai`** で和了可能か判定する。
   * @param rule {@link Rule | ルール}
   * @param shoupai {@link Shoupai | 手牌}
   * @param p `null` のときはツモ和了可能なら `true` を返す。{@link Pai | 牌}のときは **`p`** でロン和了可能なら `true` を返す。
   * @param zhuangfeng 場風(`0`: 東、`1`: 南、`2`: 西、`3`: 北)
   * @param menfeng 自風
   * @param hupai 状況役があるときは `true` を指定する
   * @param neng_rong フリテンのときは `false` を指定する
   * @returns ロン和了可能なら `true` を返す。
   */
  static allow_hule(
    rule: Rule,
    shoupai: Shoupai,
    p: Pai | null | undefined,
    zhuangfeng: number,
    menfeng: number,
    hupai: boolean,
    neng_rong: boolean
  ): boolean {
    if (p && !neng_rong) return false;

    let new_shoupai = shoupai.clone();
    if (p) new_shoupai.zimo(p);
    if (Util.xiangting(new_shoupai) != -1) return false;

    if (hupai) return true;

    let param: Util.HuleParam = {
      rule: rule,
      zhuangfeng: zhuangfeng,
      menfeng: menfeng,
      hupai: {},
      baopai: [],
      jicun: { changbang: 0, lizhibang: 0 },
      fubaopai: [],
    };
    let hule = Util.hule(shoupai, p, param);

    return hule.hupai != null;
  }

  /**
   * **`rule`** にしたがって **`shoupai`** で九種九牌流局可能か判定する。
   * @param rule {@link Rule | ルール}
   * @param shoupai {@link Shoupai | 手牌}
   * @param diyizimo 第一ツモ順の場合は `true` を指定する
   */
  static allow_pingju(
    rule: Rule,
    shoupai: Shoupai,
    diyizimo: boolean
  ): boolean {
    if (!(diyizimo && shoupai._zimo)) return false;
    if (!rule["enableInterruptedGame"]) return false;

    let n_yaojiu = 0;
    for (let s of ["m", "p", "s", "z"]) {
      let paitstr = s as keyof Bingpai;
      if (paitstr != "_") {
        let bingpai = shoupai._bingpai[paitstr];
        let nn = s == "z" ? [1, 2, 3, 4, 5, 6, 7] : [1, 9];
        for (let n of nn) {
          if (bingpai[n] > 0) n_yaojiu++;
        }
      }
    }
    return n_yaojiu >= 9;
  }

  /**
   * **`rule`** にしたがって **`shoupai`** が「ノーテン宣言」可能か判定する。
   * @param rule {@link Rule | ルール}
   * @param shoupai {@link Shoupai | 手牌}
   * @param paishu 現在の残り牌数
   */
  static allow_no_daopai(
    rule: Rule,
    shoupai: Shoupai,
    paishu: number
  ): boolean {
    if (paishu > 0 || shoupai._zimo) return false;
    if (!rule["enableNoTenDeclared"]) return false;
    if (shoupai.lizhi) return false;

    return Util.xiangting(shoupai) == 0 && Util.tingpai(shoupai).length > 0;
  }

  /**
   * インスタンス生成時に指定された {@link Player | 対局者} の配列。
   */
  _players: Player[];

  /**
   * インスタンス生成時に指定された対局終了時に呼び出す関数。
   * @see {@link Paipu | 牌譜}
   */
  _callback: JiejuCallback;

  /**
   * インスタンス生成時に指定された{@link Rule | ルール}
   */
  _rule: Rule;

  /**
   * {@link BoardInfo<Shan> | 卓情報}
   */
  _model: BoardInfo<Shan>;

  /**
   * {@link BoardInfo | 卓情報}を描画するクラス。
   * @remarks
   * {@link Game} からは適切なタイミングでメソッドを呼び出して描画のきっかけを与える。
   */
  _view?: View;

  /**
   * {@link Paipu | 牌譜}
   */
  _paipu: Paipu;

  /**
   * {@link Game.call_players} を呼び出した際の **`type`** を保存する。
   */
  _status: string;

  /**
   * 対局者からの応答を格納する配列。
   * {@link Game.call_players} 呼び出し時に配列を生成する。
   */
  _reply: PlayerMessage[];

  /**
   * 最終局(オーラス)の局数。
   * 東風戦の場合、初期値は `3`。東南戦なら `7`。
   * 延長戦により最終局が移動する場合はこの値を変更する。
   */
  _max_jushu: number;

  /**
   * 第一ツモ巡の間は `true`。
   */
  _diyizimo: boolean;

  /**
   * 四風連打の可能性がある間は `true`。
   */
  _fengpai: boolean;

  /**
   * 最後に打牌した{@link Pai | 牌}。次の打牌で上書きする。
   */
  _dapai: Pai | null;

  /**
   * 現在処理中のカンの{@link Menzi | 面子}。
   * 開槓すると `null` に戻す。
   */
  _gang: Menzi | null;

  /**
   * 各対局者(その局の東家からの順)のリーチ状態を示す配列。
   * `0`: リーチなし、`1`: 通常のリーチ、`2`: ダブルリーチ。
   */
  _lizhi: number[];

  /**
   * 本場
   */
  _changbang: number;

  /**
   * 各対局者が一発可能かを示す配列。
   * 添え字は手番(`0`: 東、`1`: 南、`2`: 西、`3`: 北)。
   */
  _yifa: boolean[];

  /**
   * 各対局者が行ったカンの数。
   * 添え字は手番(`0`: 東、`1`: 南、`2`: 西、`3`: 北)。
   */
  _n_gang: number[];

  /**
   * 各対局者のフリテン状態。
   * 添え字は手番(`0`: 東、`1`: 南、`2`: 西、`3`: 北)。
   * ロン和了可能なら `true`。
   */
  _neng_rong: boolean[];

  /**
   * 和了応答した対局者の手番(`0`: 東、`1`: 南、`2`: 西、`3`: 北)の配列。
   * 南家、西家のダブロンの時は `[ 1, 2 ]` となる。
   */
  _hule: number[];

  /**
   * 処理中の和了が槍槓のとき `"qiangang"`、嶺上開花のとき `"lingshang"`、それ以外なら `null`。
   */
  _hule_option: string | null;

  /**
   * 途中流局の処理中のとき `true`。
   */
  _no_game: boolean;

  /**
   * 連荘の処理中のとき `true`。
   */
  _lianzhuang: boolean;

  /**
   * 現在処理中の和了、あるいは流局で移動する点数の配列。
   * 添え字は手番(`0`: 東、`1`: 南、`2`: 西、`3`: 北)。
   */
  _fenpei: number[];

  /**
   * `true` の場合、同期モードとなり、`setTimeout()` による非同期呼び出しは行わない。
   */
  _sync: boolean;

  /**
   * 関数が設定されている場合、{@link Game.next} 呼び出しの際にその関数を呼び出して処理を停止する。
   */
  _stop: (() => void) | null;

  /**
   * 局の進行速度。0～5 で指定する。初期値は 3。
   * 指定された速度 × 200(ms) で {@link Game.next} を呼び出すことで局の進行速度を調整する。
   * @defaultValue `3`
   */
  _speed: number;

  /**
   * ダイアログへの応答速度(ms)。初期値は 0。
   * 指定された時間後に {@link Game.next} を呼び出す。
   * @defaultValue `0`
   */
  _wait: number;

  /**
   * 非同期で {@link Game.next} を呼び出すタイマーのID。
   * 値が設定されていれば非同期呼出し待ちであり、`clearTimeout()` を呼び出せば非同期呼出しをキャンセルできる。
   */
  _timeout_id?: NodeJS.Timeout;

  /**
   * {@link Game.jieju} から呼ぶ出される関数。 Majiang.Game#set-handler で設定する。
   */
  _handler?: () => void;

  /**
   * 非同期モードで対局を開始する。
   * @param qijia 起家を指定すること(`0`〜`3`)。指定しない場合はランダムに起家を決定する。
   */
  kaiju(qijia?: number): void {
    this._model.qijia = qijia ?? Math.floor(g.game.random.generate() * 4);

    this._max_jushu =
      this._rule["gameCount"] == 0 ? 0 : this._rule["gameCount"] * 4 - 1;

    this._paipu = {
      title: this._model.title,
      player: this._model.player,
      qijia: this._model.qijia,
      log: [],
      defen: this._model.defen.concat(),
      point: [],
      rank: [],
    };

    let msg = [];
    for (let id = 0; id < 4; id++) {
      msg[id] = JSON.parse(
        JSON.stringify({
          kaiju: {
            id: id,
            rule: this._rule,
            title: this._paipu.title,
            player: this._paipu.player,
            qijia: this._paipu.qijia,
          },
        })
      );
    }
    this.call_players("kaiju", msg, 0);

    if (this._view) this._view.kaiju();
  }

  /**
   * 対局者が応答の際に呼び出す。
   * @param id  対局者の席順(`0`〜`3`)
   * @param reply {@link PlayerMessage | メッセージ}。応答内容。
   */
  reply(id: number, reply: PlayerMessage): void {
    this._reply[id] = reply || {};
    if (this._sync) return;
    if (this._reply.filter((x) => x).length < 4) return;
    if (!this._timeout_id) this._timeout_id = setTimeout(() => this.next(), 0);
  }

  /**
   * 非同期モードの対局を停止する。
   * @param callback 停止の際に呼び出す関数。
   */
  stop(callback?: () => void): void {
    this._stop = callback;
  }

  /**
   * 非同期モードの対局を再開する。
   */
  start(): void {
    if (this._timeout_id) return;
    this._stop = null;
    this._timeout_id = setTimeout(() => this.next(), 0);
  }

  /**
   * デバッグ用。同期モードで対局を開始する。
   * 対局終了まで一切の非同期呼び出しは行わず、無停止で対局を完了する。
   */
  do_sync(): this {
    this._sync = true;

    this.kaiju();

    for (;;) {
      if (this._status == "kaiju") this.reply_kaiju();
      else if (this._status == "qipai") this.reply_qipai();
      else if (this._status == "zimo") this.reply_zimo();
      else if (this._status == "dapai") this.reply_dapai();
      else if (this._status == "fulou") this.reply_fulou();
      else if (this._status == "gang") this.reply_gang();
      else if (this._status == "gangzimo") this.reply_zimo();
      else if (this._status == "hule") this.reply_hule();
      else if (this._status == "pingju") this.reply_pingju();
      else break;
    }

    this._callback(this._paipu);

    return this;
  }

  /**
   * インスタンス変数 **`_model`** を返す。
   */
  get model(): BoardInfo {
    return this._model;
  }

  /**
   * インスタンス変数 **`_view`** に **`view`** を設定する。
   */
  set view(view: View) {
    this._view = view;
  }

  /**
   * インスタンス変数 **`_speed`** を返す。
   */
  get speed(): number {
    return this._speed;
  }

  /**
   * インスタンス変数 **`_speed`** に **`speed`** を設定する。
   */
  set speed(speed: number) {
    this._speed = speed;
  }

  /**
   * インスタンス変数 **`_wait`** に **`wait`** を設定する。
   */
  set wait(wait: number) {
    this._wait = wait;
  }

  /**
   * インスタンス変数 **`_handler`** に **`handler`** を設定する。
   */
  set handler(callback: () => void) {
    this._handler = callback;
  }

  /**
   * 対局者からの応答を読み出し、対局の次のステップに進む。
   * @internal
   */
  next(): void {
    clearTimeout(this._timeout_id);
    this._timeout_id = undefined;
    if (this._reply.filter((x) => x).length < 4) return;
    if (this._stop) return this._stop();

    if (this._status == "kaiju") this.reply_kaiju();
    else if (this._status == "qipai") this.reply_qipai();
    else if (this._status == "zimo") this.reply_zimo();
    else if (this._status == "dapai") this.reply_dapai();
    else if (this._status == "fulou") this.reply_fulou();
    else if (this._status == "gang") this.reply_gang();
    else if (this._status == "gangzimo") this.reply_zimo();
    else if (this._status == "hule") this.reply_hule();
    else if (this._status == "pingju") this.reply_pingju();
    else this._callback(this._paipu);
  }

  /**
   * 対局者に **`msg`** を通知する。対局者からの応答はない。
   * @param type {@link GameMessage | メッセージ} の種別を示す。
   * @param msg {@link GameMessage | メッセージ}
   * @internal
   */
  notify_players(type: string, msg: GameMessage[]): void {
    for (let l = 0; l < 4; l++) {
      let id = this._model.player_id[l];
      if (this._sync) this._players[id].action(msg[l]);
      else
        setTimeout(() => {
          this._players[id].action(msg[l]);
        }, 0);
    }
  }

  /**
   * 対局者に **`msg`** を通知する。
   * 対局者からの応答を待って、{@link Game.next} が非同期に呼び出される。
   * @param type {@link GameMessage | メッセージ} の種別を示す。
   * @param msg {@link GameMessage | メッセージ}
   * @param timeout
   * **`timeout`** で {@link Game.next} 呼び出しまでの待ち時間(ms)を指定し、局の進行速度を調整することもできる。
   * **`timeout`** の指定がない場合は、インスタンス変数 **`_speed`** に応じて待ち時間を決定する。
   * @internal
   */
  call_players(type: string, msg: GameMessage[], timeout?: number): void {
    timeout =
      this._speed == 0 ? 0 : timeout == null ? this._speed * 200 : timeout;
    this._status = type;
    this._reply = [];
    for (let l = 0; l < 4; l++) {
      let id = this._model.player_id[l];
      if (this._sync)
        this._players[id].action(msg[l], (reply) => this.reply(id, reply));
      else
        setTimeout(() => {
          this._players[id].action(msg[l], (reply) => this.reply(id, reply));
        }, 0);
    }
    if (!this._sync) this._timeout_id = setTimeout(() => this.next(), timeout);
  }

  /**
   * 配牌の局進行を行う。
   * @param shan {@link Shan}。指定されていないの場合ランダムに生成する。
   * @internal
   */
  qipai(shan?: Shan): void {
    let model = this._model;

    model.shan = shan || new Shan(this._rule);
    for (let l = 0; l < 4; l++) {
      let qipai = [];
      for (let i = 0; i < 13; i++) {
        qipai.push(model.shan.zimo());
      }
      model.shoupai[l] = new Shoupai(qipai);
      model.he[l] = new He();
      model.player_id[l] = (model.qijia + model.jushu + l) % 4;
    }
    model.lunban = -1;

    this._diyizimo = true;
    this._fengpai = this._rule["enableInterruptedGame"];

    this._dapai = null;
    this._gang = null;

    this._lizhi = [0, 0, 0, 0];
    this._yifa = [false, false, false, false];
    this._n_gang = [0, 0, 0, 0];
    this._neng_rong = [true, true, true, true];

    this._hule = [];
    this._hule_option = null;
    this._no_game = false;
    this._lianzhuang = false;
    this._changbang = model.changbang;
    this._fenpei = null;

    this._paipu.defen = model.defen.concat();
    this._paipu.log.push([]);
    let paipu = {
      qipai: {
        zhuangfeng: model.zhuangfeng,
        jushu: model.jushu,
        changbang: model.changbang,
        lizhibang: model.lizhibang,
        defen: model.player_id.map((id) => model.defen[id]),
        baopai: model.shan.baopai[0],
        shoupai: model.shoupai.map((shoupai) => shoupai.toString()),
      },
    };
    this.add_paipu(paipu);

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
      for (let i = 0; i < 4; i++) {
        if (i != l) msg[l].qipai.shoupai[i] = "";
      }
    }
    this.call_players("qipai", msg, 0);

    if (this._view) this._view.redraw();
  }

  /**
   * ツモの局進行を行う。
   * @internal
   */
  zimo(): void {
    let model = this._model;

    model.lunban = (model.lunban + 1) % 4;

    let zimo = model.shan.zimo();
    model.shoupai[model.lunban].zimo(zimo);

    let paipu = { zimo: { l: model.lunban, p: zimo } };
    this.add_paipu(paipu);

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
      if (l != model.lunban) msg[l].zimo.p = "";
    }
    this.call_players("zimo", msg);

    if (this._view) this._view.update(paipu);
  }

  /**
   * **`dapai`** で指定された牌を打牌する局進行を行う。
   * @param dapai {@link Pai | 牌}
   * @internal
   */
  dapai(dapai: Pai): void {
    let model = this._model;

    this._yifa[model.lunban] = false;

    if (!model.shoupai[model.lunban].lizhi)
      this._neng_rong[model.lunban] = true;

    model.shoupai[model.lunban].dapai(dapai);
    model.he[model.lunban].dapai(dapai);

    if (this._diyizimo) {
      if (!dapai.match(/^z[1234]/)) this._fengpai = false;
      if (this._dapai && this._dapai.slice(0, 2) != dapai.substr(0, 2))
        this._fengpai = false;
    } else this._fengpai = false;

    if (dapai.slice(-1) == "*") {
      this._lizhi[model.lunban] = this._diyizimo ? 2 : 1;
      this._yifa[model.lunban] = this._rule["enableIppatsu"];
    }

    if (
      Util.xiangting(model.shoupai[model.lunban]) == 0 &&
      Util.tingpai(model.shoupai[model.lunban]).find((p) =>
        model.he[model.lunban].find(p)
      )
    ) {
      this._neng_rong[model.lunban] = false;
    }

    this._dapai = dapai;

    let paipu = { dapai: { l: model.lunban, p: dapai } };
    this.add_paipu(paipu);

    if (this._gang) this.kaigang();

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
    }
    this.call_players("dapai", msg);

    if (this._view) this._view.update(paipu);
  }

  /**
   * **`fulou`** で指定された面子を副露する局進行を行う。
   * @param fulou {@link Menzi | 面子}
   * @internal
   */
  fulou(fulou: Menzi): void {
    let model = this._model;

    this._diyizimo = false;
    this._yifa = [false, false, false, false];

    model.he[model.lunban].fulou(fulou);

    let d = fulou.match(/[\+\=\-]/);
    model.lunban = (model.lunban + "_-=+".indexOf(d[0])) % 4;

    model.shoupai[model.lunban].fulou(fulou);

    if (fulou.match(/^[mpsz]\d{4}/)) {
      this._gang = fulou;
      this._n_gang[model.lunban]++;
    }

    let paipu = { fulou: { l: model.lunban, m: fulou } };
    this.add_paipu(paipu);

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
    }
    this.call_players("fulou", msg);

    if (this._view) this._view.update(paipu);
  }

  /**
   * **`gang`** で指定された面子で加槓あるいは暗槓する局進行を行う。
   * @param gang {@link Menzi | 面子}
   * @internal
   */
  gang(gang: Menzi): void {
    let model = this._model;

    model.shoupai[model.lunban].gang(gang);

    let paipu = { gang: { l: model.lunban, m: gang } };
    this.add_paipu(paipu);

    if (this._gang) this.kaigang();

    this._gang = gang;
    this._n_gang[model.lunban]++;

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
    }
    this.call_players("gang", msg);

    if (this._view) this._view.update(paipu);
  }

  /**
   * リンシャン牌ツモの局進行を行う。
   * @internal
   */
  gangzimo(): void {
    let model = this._model;

    this._diyizimo = false;
    this._yifa = [false, false, false, false];

    let zimo = model.shan.gangzimo();
    model.shoupai[model.lunban].zimo(zimo);

    let paipu = { gangzimo: { l: model.lunban, p: zimo } };
    this.add_paipu(paipu);

    if (
      !this._rule["enableKandoraAfterRide"] ||
      this._gang.match(/^[mpsz]\d{4}$/)
    )
      this.kaigang();

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
      if (l != model.lunban) msg[l].gangzimo.p = "";
    }
    this.call_players("gangzimo", msg);

    if (this._view) this._view.update(paipu);
  }

  /**
   * 開槓の局進行を行う。
   * @internal
   */
  kaigang(): void {
    this._gang = null;

    if (!this._rule["enableKandora"]) return;

    let model = this._model;

    model.shan.kaigang();
    let baopai = model.shan.baopai.pop();

    let paipu = { kaigang: { baopai: baopai } };
    this.add_paipu(paipu);

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
    }
    this.notify_players("kaigang", msg);

    if (this._view) this._view.update(paipu);
  }

  /**
   * 和了の局進行を行う。
   * @internal
   */
  hule(): void {
    let model = this._model;

    if (this._status != "hule") {
      model.shan.close();
      this._hule_option =
        this._status == "gang"
          ? "qianggang"
          : this._status == "gangzimo"
          ? "lingshang"
          : null;
    }

    let menfeng = this._hule.length ? this._hule.shift() : model.lunban;
    let rongpai =
      menfeng == model.lunban
        ? null
        : (this._hule_option == "qianggang"
            ? this._gang[0] + this._gang.slice(-1)
            : this._dapai.slice(0, 2)) +
          "_+=-"[(4 + model.lunban - menfeng) % 4];
    let shoupai = model.shoupai[menfeng].clone();
    let fubaopai = shoupai.lizhi ? model.shan.fubaopai : null;

    let param = {
      rule: this._rule,
      zhuangfeng: model.zhuangfeng,
      menfeng: menfeng,
      hupai: {
        lizhi: this._lizhi[menfeng],
        yifa: this._yifa[menfeng],
        qianggang: this._hule_option == "qianggang",
        lingshang: this._hule_option == "lingshang",
        haidi:
          model.shan.paishu > 0 || this._hule_option == "lingshang"
            ? 0
            : !rongpai
            ? 1
            : 2,
        tianhu: !(this._diyizimo && !rongpai) ? 0 : menfeng == 0 ? 1 : 2,
      },
      baopai: model.shan.baopai,
      fubaopai: fubaopai,
      jicun: { changbang: model.changbang, lizhibang: model.lizhibang },
    };
    let hule = Util.hule(shoupai, rongpai, param);

    if (this._rule["consecutiveMode"] > 0 && menfeng == 0)
      this._lianzhuang = true;
    if (this._rule["gameCount"] == 0) this._lianzhuang = false;
    this._fenpei = hule.fenpei;

    function parseBaojiaStr2Int(baojia: string): number {
      if (baojia === "=") return (menfeng + 2) % 4;
      if (baojia === "-") return (menfeng + 1) % 4;
      if (baojia === "+") return (menfeng + 3) % 4;
    }

    let paipu: Hule = {
      hule: {
        l: menfeng,
        shoupai: rongpai
          ? shoupai.zimo(rongpai).toString()
          : shoupai.toString(),
        baojia: rongpai ? model.lunban : null,
        fubaopai: fubaopai,
        fu: hule.fu,
        fanshu: hule.fanshu,
        damanguan: hule.damanguan,
        defen: hule.defen,
        hupai: hule.hupai.map((h): Huleyi<number> => {
          if ("baojia" in h) {
            return {
              name: h.name,
              fanshu: h.fanshu,
              baojia: parseBaojiaStr2Int(h.baojia),
            };
          } else {
            if (typeof h.fanshu === "string") {
              return {
                name: h.name,
                fanshu: h.fanshu,
              };
            } else {
              return {
                name: h.name,
                fanshu: h.fanshu,
              };
            }
          }
        }),
        fenpei: hule.fenpei,
      },
    };
    for (let key of ["fu", "fanshu", "damanguan"]) {
      let keyT = key as "fu" | "fanshu" | "damanguan";
      if (!paipu.hule[keyT]) delete paipu.hule[keyT];
    }
    this.add_paipu(paipu);

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
    }
    this.call_players("hule", msg, this._wait);

    if (this._view) this._view.update(paipu);
  }

  /**
   * 流局の局進行を行う。
   * @param name 指定された場合は途中流局とする。
   * @param shoupai 流局時に公開した {@link Paizi | 牌姿} を指定する。指定されていないの場合は全員ノーテンの扱る。
   * @internal
   */
  pingju(name: string, shoupai?: Paizi[]): void {
    let model = this._model;

    let fenpei = [0, 0, 0, 0];

    if (!name) {
      let n_tingpai = 0;
      for (let l = 0; l < 4; l++) {
        if (
          this._rule["enableNoTenDeclared"] &&
          !shoupai[l] &&
          !model.shoupai[l].lizhi
        )
          continue;
        if (
          !this._rule["enableNoTenPenalty"] &&
          (this._rule["consecutiveMode"] != 2 || l != 0) &&
          !model.shoupai[l].lizhi
        ) {
          shoupai[l] = "";
        } else if (
          Util.xiangting(model.shoupai[l]) == 0 &&
          Util.tingpai(model.shoupai[l]).length > 0
        ) {
          n_tingpai++;
          shoupai[l] = model.shoupai[l].toString();
          if (this._rule["consecutiveMode"] == 2 && l == 0)
            this._lianzhuang = true;
        } else {
          shoupai[l] = "";
        }
      }
      if (this._rule["enableNagashi"]) {
        for (let l = 0; l < 4; l++) {
          let all_yaojiu = true;
          for (let p of model.he[l]._pai) {
            if (p.match(/[\+\=\-]$/)) {
              all_yaojiu = false;
              break;
            }
            if (p.match(/^z/)) continue;
            if (p.match(/^[mps][19]/)) continue;
            all_yaojiu = false;
            break;
          }
          if (all_yaojiu) {
            name = "流し満貫";
            for (let i = 0; i < 4; i++) {
              fenpei[i] +=
                l == 0 && i == l
                  ? 12000
                  : l == 0
                  ? -4000
                  : l != 0 && i == l
                  ? 8000
                  : l != 0 && i == 0
                  ? -4000
                  : -2000;
            }
          }
        }
      }
      if (!name) {
        name = "荒牌平局";
        if (
          this._rule["enableNoTenPenalty"] &&
          0 < n_tingpai &&
          n_tingpai < 4
        ) {
          for (let l = 0; l < 4; l++) {
            fenpei[l] = shoupai[l] ? 3000 / n_tingpai : -3000 / (4 - n_tingpai);
          }
        }
      }
      if (this._rule["consecutiveMode"] == 3) this._lianzhuang = true;
    } else {
      this._no_game = true;
      this._lianzhuang = true;
    }

    if (this._rule["gameCount"] == 0) this._lianzhuang = true;

    this._fenpei = fenpei;

    let paipu = {
      pingju: { name: name, shoupai: shoupai, fenpei: fenpei },
    };
    this.add_paipu(paipu);

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
    }
    this.call_players("pingju", msg, this._wait);

    if (this._view) this._view.update(paipu);
  }

  /**
   * 対局終了の判断を行う。
   * @internal
   */
  last(): void {
    let model = this._model;

    model.lunban = -1;
    if (this._view) this._view.update();

    if (!this._lianzhuang) {
      model.jushu++;
      model.zhuangfeng += (model.jushu / 4) | 0;
      model.jushu = model.jushu % 4;
    }

    let jieju = false;
    let guanjun = -1;
    const defen = model.defen;
    for (let i = 0; i < 4; i++) {
      let id = (model.qijia + i) % 4;
      if (defen[id] < 0 && this._rule["enableTobiEnd"]) jieju = true;
      if (defen[id] >= 30000 && (guanjun < 0 || defen[id] > defen[guanjun]))
        guanjun = id;
    }

    let sum_jushu = model.zhuangfeng * 4 + model.jushu;

    if (15 < sum_jushu) jieju = true;
    else if ((this._rule["gameCount"] + 1) * 4 - 1 < sum_jushu) jieju = true;
    else if (this._max_jushu < sum_jushu) {
      if (this._rule["extensionMode"] == 0) jieju = true;
      else if (this._rule["gameCount"] == 0) jieju = true;
      else if (guanjun >= 0) jieju = true;
      else {
        this._max_jushu +=
          this._rule["extensionMode"] == 3
            ? 4
            : this._rule["extensionMode"] == 2
            ? 1
            : 0;
      }
    } else if (this._max_jushu == sum_jushu) {
      if (
        this._rule["enableOralasStopped"] &&
        guanjun == model.player_id[0] &&
        this._lianzhuang &&
        !this._no_game
      )
        jieju = true;
    }

    if (jieju) this.delay(() => this.jieju(), 0);
    else this.delay(() => this.qipai(), 0);
  }

  /**
   * 対局終了の処理を行う。
   * @internal
   */
  jieju(): void {
    let model = this._model;

    let paiming: number[] = [];
    const defen = model.defen;
    for (let i = 0; i < 4; i++) {
      let id = (model.qijia + i) % 4;
      for (let j = 0; j < 4; j++) {
        if (j == paiming.length || defen[id] > defen[paiming[j]]) {
          paiming.splice(j, 0, id);
          break;
        }
      }
    }
    defen[paiming[0]] += model.lizhibang * 1000;
    this._paipu.defen = defen;

    let rank = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      rank[paiming[i]] = i + 1;
    }
    this._paipu.rank = rank;

    const round = !this._rule["rankPoint"].find((p) => p.match(/\.\d$/));
    let point = [0, 0, 0, 0];
    for (let i = 1; i < 4; i++) {
      let id = paiming[i];
      point[id] = (defen[id] - 30000) / 1000 + +this._rule["rankPoint"][i];
      if (round) point[id] = Math.round(point[id]);
      point[paiming[0]] -= point[id];
    }
    this._paipu.point = point.map((p) => p.toFixed(round ? 0 : 1));

    let paipu = { jieju: this._paipu };

    let msg = [];
    for (let l = 0; l < 4; l++) {
      msg[l] = JSON.parse(JSON.stringify(paipu));
    }
    this.call_players("jieju", msg, this._wait);

    if (this._view) this._view.summary(this._paipu);

    if (this._handler) this._handler();
  }

  /**
   * 配牌の局進行メソッドを呼び出す。
   * @internal
   */
  reply_kaiju(): void {
    this.delay(() => this.qipai(), 0);
  }

  /**
   * ツモの局進行メソッドを呼び出す。
   * @internal
   */
  reply_qipai(): void {
    this.delay(() => this.zimo(), 0);
  }

  /**
   * ツモ応答の妥当性を確認し、次の局進行メソッドを呼び出す。
   * @internal
   */
  reply_zimo(): void {
    let model = this._model;

    let reply = this.get_reply(model.lunban);
    if ("daopai" in reply) {
      if (this.allow_pingju()) {
        let shoupai = ["", "", "", ""];
        shoupai[model.lunban] = model.shoupai[model.lunban].toString();
        return this.delay(() => this.pingju("九種九牌", shoupai), 0);
      }
    } else if ("hule" in reply) {
      if (this.allow_hule()) {
        if (this._view) this._view.say("zimo", model.lunban);
        return this.delay(() => this.hule());
      }
    } else if ("gang" in reply) {
      let replyT = reply as GangPlayerMessage | EmptyPlayerMessage;
      if (this.get_gang_mianzi().find((m) => m == replyT.gang)) {
        if (this._view) this._view.say("gang", model.lunban);
        return this.delay(() => this.gang(replyT.gang));
      }
    } else if ("dapai" in reply) {
      let replyT = reply as DapaiPlayerMessage | EmptyPlayerMessage;
      let dapai = replyT.dapai.replace(/\*$/, "");
      if (this.get_dapai().find((p) => p == dapai)) {
        if (replyT.dapai.slice(-1) == "*" && this.allow_lizhi(dapai)) {
          if (this._view) this._view.say("lizhi", model.lunban);
          return this.delay(() => this.dapai(replyT.dapai));
        }
        return this.delay(() => this.dapai(dapai), 0);
      }
    }

    let p = this.get_dapai().pop();
    this.delay(() => this.dapai(p), 0);
  }

  /**
   * 打牌応答の妥当性を確認し、次の局進行メソッドを呼び出す。
   * @internal
   */
  reply_dapai(): void {
    let model = this._model;

    for (let i = 1; i < 4; i++) {
      let l = (model.lunban + i) % 4;
      let reply = this.get_reply(l);
      if ("hule" in reply && this.allow_hule(l)) {
        if (this._rule["maxSimultaneousWin"] == 1 && this._hule.length)
          continue;
        if (this._view) this._view.say("rong", l);
        this._hule.push(l);
      } else {
        let shoupai = model.shoupai[l].clone().zimo(this._dapai);
        if (Util.xiangting(shoupai) == -1) this._neng_rong[l] = false;
      }
    }
    if (this._hule.length == 3 && this._rule["maxSimultaneousWin"] == 2) {
      let shoupai = ["", "", "", ""];
      for (let l of this._hule) {
        shoupai[l] = model.shoupai[l].toString();
      }
      return this.delay(() => this.pingju("三家和", shoupai));
    } else if (this._hule.length) {
      return this.delay(() => this.hule());
    }

    if (this._dapai.substr(-1) == "*") {
      model.defen[model.player_id[model.lunban]] -= 1000;
      model.lizhibang++;

      if (
        this._lizhi.filter((x) => x).length == 4 &&
        this._rule["enableInterruptedGame"]
      ) {
        let shoupai = model.shoupai.map((s) => s.toString());
        return this.delay(() => this.pingju("四家立直", shoupai));
      }
    }

    if (this._diyizimo && model.lunban == 3) {
      this._diyizimo = false;
      if (this._fengpai) {
        return this.delay(() => this.pingju("四風連打"), 0);
      }
    }

    if (this._n_gang.reduce((x, y) => x + y) == 4) {
      if (
        Math.max(...this._n_gang) < 4 &&
        this._rule["enableInterruptedGame"]
      ) {
        return this.delay(() => this.pingju("四開槓"), 0);
      }
    }

    if (!model.shan.paishu) {
      let shoupai = ["", "", "", ""];
      for (let l = 0; l < 4; l++) {
        let reply = this.get_reply(l);
        if ("daopai" in reply) shoupai[l] = reply.daopai;
      }
      return this.delay(() => this.pingju("", shoupai), 0);
    }

    for (let i = 1; i < 4; i++) {
      let l = (model.lunban + i) % 4;
      let reply = this.get_reply(l);
      if ("fulou" in reply) {
        let replyT = reply as FulouPlayerMessage | EmptyPlayerMessage;
        let m = replyT.fulou.replace(/0/g, "5");
        if (m.match(/^[mpsz](\d)\1\1\1/)) {
          if (this.get_gang_mianzi(l).find((m) => m == replyT.fulou)) {
            if (this._view) this._view.say("gang", l);
            return this.delay(() => this.fulou(replyT.fulou));
          }
        } else if (m.match(/^[mpsz](\d)\1\1/)) {
          if (this.get_peng_mianzi(l).find((m) => m == replyT.fulou)) {
            if (this._view) this._view.say("peng", l);
            return this.delay(() => this.fulou(replyT.fulou));
          }
        }
      }
    }
    let l = (model.lunban + 1) % 4;
    let reply = this.get_reply(l);
    if ("fulou" in reply) {
      let replyT = reply as FulouPlayerMessage | EmptyPlayerMessage;
      if (this.get_chi_mianzi(l).find((m) => m == replyT.fulou)) {
        if (this._view) this._view.say("chi", l);
        return this.delay(() => this.fulou(replyT.fulou));
      }
    }

    this.delay(() => this.zimo(), 0);
  }

  /**
   * 副露応答の妥当性を確認し、次の局進行メソッドを呼び出す。
   * @internal
   */
  reply_fulou(): void {
    let model = this._model;

    if (this._gang) {
      return this.delay(() => this.gangzimo(), 0);
    }

    let reply = this.get_reply(model.lunban);
    if ("dapai" in reply) {
      let replyT = reply as DapaiPlayerMessage | EmptyPlayerMessage;
      if (this.get_dapai().find((p) => p == replyT.dapai)) {
        return this.delay(() => this.dapai(replyT.dapai), 0);
      }
    }

    let p = this.get_dapai().pop();
    this.delay(() => this.dapai(p), 0);
  }

  /**
   * 槓応答の妥当性を確認し、次の局進行メソッドを呼び出す。
   * @internal
   */
  reply_gang(): void {
    let model = this._model;

    if (this._gang.match(/^[mpsz]\d{4}$/)) {
      return this.delay(() => this.gangzimo(), 0);
    }

    for (let i = 1; i < 4; i++) {
      let l = (model.lunban + i) % 4;
      let reply = this.get_reply(l);
      if ("hule" in reply && this.allow_hule(l)) {
        if (this._rule["maxSimultaneousWin"] == 1 && this._hule.length)
          continue;
        if (this._view) this._view.say("rong", l);
        this._hule.push(l);
      } else {
        let p = this._gang[0] + this._gang.slice(-1);
        let shoupai = model.shoupai[l].clone().zimo(p);
        if (Util.xiangting(shoupai) == -1) this._neng_rong[l] = false;
      }
    }
    if (this._hule.length) {
      return this.delay(() => this.hule());
    }

    this.delay(() => this.gangzimo(), 0);
  }

  /**
   * 和了応答の妥当性を確認し、次の局進行メソッドを呼び出す。
   * @internal
   */
  reply_hule(): void {
    let model = this._model;

    for (let l = 0; l < 4; l++) {
      model.defen[model.player_id[l]] += this._fenpei[l];
    }
    model.changbang = 0;
    model.lizhibang = 0;

    if (this._hule.length) {
      return this.delay(() => this.hule());
    } else {
      if (this._lianzhuang) model.changbang = this._changbang + 1;
      return this.delay(() => this.last(), 0);
    }
  }

  /**
   * 流局応答の妥当性を確認し、次の局進行メソッドを呼び出す。
   * @internal
   */
  reply_pingju(): void {
    let model = this._model;

    for (let l = 0; l < 4; l++) {
      model.defen[model.player_id[l]] += this._fenpei[l];
    }
    model.changbang++;

    this.delay(() => this.last(), 0);
  }

  /**
   * {@link Game.get_dapai} を呼び出し、インスタンス変数 **`_rule`** にしたがって現在の手番の手牌から打牌可能な牌の一覧を返す。
   * @returns 打牌可能な{@link Pai | 牌}の配列
   * @internal
   */
  get_dapai(): Pai[] {
    let model = this._model;
    return Game.get_dapai(this._rule, model.shoupai[model.lunban]);
  }

  /**
   * {@link Game.get_chi_mianzi} を呼び出し、インスタンス変数 **`_rule`** にしたがって手番 **`l`** が現在の打牌でチー可能な面子の一覧を返す。
   * @param l 手番
   * @returns チー可能な{@link Menzi | 面子}の配列
   * @internal
   */
  get_chi_mianzi(l: number): Menzi[] {
    let model = this._model;
    let d = "_+=-"[(4 + model.lunban - l) % 4];
    return Game.get_chi_mianzi(
      this._rule,
      model.shoupai[l],
      this._dapai + d,
      model.shan.paishu
    );
  }

  /**
   * {@link Game.get_peng_mianzi} を呼び出し、インスタンス変数 **`_rule`** にしたがって手番 **`l`** が現在の打牌でポン可能な面子の一覧を返す。
   * @param l 手番
   * @returns ポン可能な{@link Menzi | 面子}の配列
   * @internal
   */
  get_peng_mianzi(l: number): Menzi[] {
    let model = this._model;
    let d = "_+=-"[(4 + model.lunban - l) % 4];
    return Game.get_peng_mianzi(
      this._rule,
      model.shoupai[l],
      this._dapai + d,
      model.shan.paishu
    );
  }

  /**
   * {@link Game.get_gang_mianzi} を呼び出し、インスタンス変数 **`_rule`** にしたがってカン可能な面子の一覧を返す。
   * @param l 指定された場合は大明槓、`null` の場合は暗槓と加槓が対象になる。
   * @returns カン可能な{@link Menzi | 面子}の配列
   * @internal
   */
  get_gang_mianzi(l?: number | null): Menzi[] {
    let model = this._model;
    if (l == null) {
      return Game.get_gang_mianzi(
        this._rule,
        model.shoupai[model.lunban],
        null,
        model.shan.paishu,
        this._n_gang.reduce((x, y) => x + y)
      );
    } else {
      let d = "_+=-"[(4 + model.lunban - l) % 4];
      return Game.get_gang_mianzi(
        this._rule,
        model.shoupai[l],
        this._dapai + d,
        model.shan.paishu,
        this._n_gang.reduce((x, y) => x + y)
      );
    }
  }

  /**
   * {@link Game.allow_lizhi} を呼び出し、インスタンス変数 **`_rule`** にしたがってリーチ可能か判定する。
   * @param p `null` のときはリーチ可能な打牌一覧を返す。{@link Pai | 牌}のときは **`p`** を打牌してリーチ可能なら `true` を返す。
   * @returns **`p`** が `null` のときはリーチ可能な打牌の配列。 **`p`** が {@link Pai | 牌} のときは **`p`** を打牌してリーチ可能なら `true` を返す
   * @internal
   */
  allow_lizhi(p?: Pai | null): Pai[] | boolean {
    let model = this._model;
    return Game.allow_lizhi(
      this._rule,
      model.shoupai[model.lunban],
      p,
      model.shan.paishu,
      model.defen[model.player_id[model.lunban]]
    );
  }

  /**
   * {@link Game.allow_hule} を呼び出し、インスタンス変数 **`_rule`** にしたがって和了可能か判定する。
   * @param l
   * **`l`** が `null` のときは現在の手番がツモ和了可能なら `true` を返す。
   * **`l`** が指定された場合は手番 **`l`** がロン和了可能なら `true` を返す。
   * @returns ロン和了可能なら `true` を返す。
   * @internal
   */
  allow_hule(l?: number | null): boolean {
    let model = this._model;
    if (l == null) {
      let hupai =
        model.shoupai[model.lunban].lizhi ||
        this._status == "gangzimo" ||
        model.shan.paishu == 0;
      return Game.allow_hule(
        this._rule,
        model.shoupai[model.lunban],
        null,
        model.zhuangfeng,
        model.lunban,
        hupai,
        this._neng_rong[model.lunban]
      );
    } else {
      let p =
        (this._status == "gang"
          ? this._gang[0] + this._gang.substr(-1)
          : this._dapai) + "_+=-"[(4 + model.lunban - l) % 4];
      let hupai =
        model.shoupai[l].lizhi ||
        this._status == "gang" ||
        model.shan.paishu == 0;
      return Game.allow_hule(
        this._rule,
        model.shoupai[l],
        p,
        model.zhuangfeng,
        l,
        hupai,
        this._neng_rong[l]
      );
    }
  }

  /**
   * {@link Game.allow_pingju} を呼び出し、インスタンス変数 **`_rule`** にしたがって現在の手番が九種九牌流局可能か判定する。
   * @returns 九種九牌流局可能なら `true` を返す。
   * @internal
   */
  allow_pingju(): boolean {
    let model = this._model;
    return Game.allow_pingju(
      this._rule,
      model.shoupai[model.lunban],
      this._diyizimo
    );
  }

  /**
   * **`timeout`** で指定した時間(ms)休止した後に **`callback`** を呼び出す。
   * ゲームに「タメ」を作るためにチー/ポンなどの発声のタイミングで呼び出される。
   * **`timeout`** の指定がない場合は、インスタンス変数 **`_speed`** に応じて待ち時間を決定するが、最低でも 500ms は待ち合わせる。
   * @param callback 待ち時間の後で呼び出す関数
   * @param timeout 待ち時間
   * @internal
   */
  delay(callback: () => void, timeout?: number): void {
    if (this._sync) return callback();

    timeout =
      this._speed == 0
        ? 0
        : timeout == null
        ? Math.max(500, this._speed * 200)
        : timeout;
    setTimeout(callback, timeout);
  }

  /**
   * インスタンス変数 **`_paipu`** の適切な位置に摸打情報を追加する。
   * @param paipu 追加の{@link Paipu | 牌譜}の{@link Moda | 模打}情報
   * @internal
   */
  add_paipu(paipu: Moda): void {
    this._paipu.log[this._paipu.log.length - 1].push(paipu);
  }

  /**
   * 手番 **`l`** からの応答を取得する。
   * @param l 手番
   * @returns 応答{@link PlayerMessage | メッセージ}
   * @internal
   */
  get_reply(l: number): PlayerMessage {
    let model = this._model;
    return this._reply[model.player_id[l]];
  }
}

//TODO: paipuのエラー(Yiman<string>とYiman<number>の互換)３件、shan(ShanとBoardShanの互換)のエラー5件
