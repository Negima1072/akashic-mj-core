/**
 * Mahjong.Rule
 */

/**
 * ルール決定パラメータ
 * @remarks
 * ルールの詳細を決めるパラメータをキーとしてもつ連想配列。
 * @example
 * 以下の呼び出しで取得できる。
 * ```javascript
 * const rule = Majiang.rule();
 * ```
 */
export interface Rule {
  /* 点数関連 */
  /**
   * 配給原点
   * @defaultValue `25000`
   */
  originPoint: number;
  /**
   * 順位点
   * @remarks
   * ポイントを四捨五入する場合は `["20","10","-10","-20"]` のように順位点を整数で指定する。
   * @defaultValue `["20.0","10.0","-10.0","-20.0"]`
   */
  rankPoint: string[];

  /* 赤牌有無/クイタンなど */
  /**
   * 赤牌
   * @defaultValue `{ m: 1, p: 1, s: 1 }`
   */
  redPai: { m: number; p: number; s: number };
  /**
   * クイタンあり
   * @defaultValue `true`
   */
  enableKuitan: boolean;
  /**
   * 喰い替え許可レベル
   * @remarks
   * * `0`: 喰い替えなし
   * * `1`: スジ喰い替えあり
   * * `2`: 現物喰い替えもあり
   * @defaultValue `0`
   */
  kuikaeAllowLevel: number;

  /* 局数関連 */
  /**
   * 場数
   * @remarks
   * * `0: 一局戦
   * * `1`: 東風戦
   * * `2`：東南戦
   * * `4`: 一荘戦
   * @defaultValue `2`
   */
  gameCount: number;
  /**
   * 途中流局あり
   * @remarks
   * 採用する途中流局は、`九種九牌`、`四風連打`、`四家立直`、`四開槓` 固定で変更できない。
   * `最大同時和了数` が `2` で3人の和了があった場合は、本項目が `false` でも `三家和` の途中流局となる。
   * @defaultValue `true`
   */
  enableInterruptedGame: boolean;
  /**
   * 流し満貫あり
   * @remarks
   * 流し満貫は和了役ではなく流局時の「祝儀」として扱い、満貫ツモ分の点数を移動する。
   * 2人以上同時に流し満貫が発生した場合はその全てを精算する。
   * 流し満貫があった場合、ノーテン罰符の精算は行わないが連荘規定に変化はない。
   * @defaultValue `true`
   */
  enableNagashi: boolean;
  /**
   * ノーテン宣言あり
   * @remarks
   * `true` の場合、流局時テンパイで「テンパイ/ノーテン」を選択可能とする(UIが必要)。
   * @defaultValue `false`
   */
  enableNoTenDeclared: boolean;
  /**
   * ノーテン罰あり
   * @defaultValue `true`
   */
  enableNoTenPenalty: boolean;
  /**
   * 最大同時和了数
   * @remarks
   * * `1` の場合、和了者は頭ハネで決定する。
   * * `2`以上の場合、積み場と供託リーチ棒は頭ハネで取得とする。
   * @defaultValue `2`
   */
  maxSimultaneousWin: number;
  /**
   * 連荘方式
   * @remarks
   * * `0`: 連荘なし
   * * `1`: 和了連荘
   * * `2`: テンパイ連荘
   * * `3`: ノーテン連荘
   * @defaultValue `2`
   */
  consecutiveMode: number;
  /**
   * トビ終了あり
   * @defaultValue `true`
   */
  enableTobiEnd: boolean;
  /**
   * オーラス止めあり
   * @remarks
   * `true` の場合、オーラスの親が30000点以上のトップ目の場合、連荘はできずゲーム終了となる。
   * @defaultValue `true`
   */
  enableOralasStopped: boolean;
  /**
   * 延長戦方式
   * @remarks
   * `場数` で規定された局数を超えたときに全員が30000点未満の場合が延長戦の判断条件となる。
   * * `1`(サドンデス)の場合は毎局延長戦条件を判定する。
   * * `2`(連荘優先サドンデス)の場合は輪荘のタイミングで延長戦条件を判定する。
   * * `3`(4局固定)の場合は次の場の第四局にオーラスを延長する。
   * @defaultValue `1`
   */
  extensionMode: number;

  /* リーチ/ドラ関連 */
  /**
   * 一発あり
   * @defaultValue `true`
   */
  enableIppatsu: boolean;
  /**
   * 裏ドラあり
   * @defaultValue `true`
   */
  enableUradora: boolean;
  /**
   * カンドラあり
   * @defaultValue `true`
   */
  enableKandora: boolean;
  /**
   * カン裏あり
   * @remarks
   * `裏ドラあり` が `false`、あるいは `カンドラあり` が `false` の場合もカン裏はなしとなる。
   * @defaultValue `true`
   */
  enableKanUra: boolean;
  /**
   * カンドラ後乗せ
   * @remraks
   * `true` の場合、大明槓、加槓でのカンドラ発生のタイミングをリンシャン牌取得の次の動作(打牌/カン宣言)と同時にする。
   * @defaultValue `true`
   */
  enableKandoraAfterRide: boolean;
  /**
   * ツモ番なしリーチあり
   * @defaultValue `false`
   */
  enableRiichiWithoutTurn: boolean;
  /**
   * リーチ後暗槓許可レベル
   * @remarks
   * * `0`: 暗槓はできない
   * * `1`: 牌姿の変わる暗槓はできない
   * * `2`: 待ちの変わる暗槓はできない
   *
   * どのケースでも送り槓はできない。
   * @defaultValue `2`
   */
  ankanAfterReachAllowLevel: number;

  /* 役満関連 */
  /**
   * 役満の複合あり
   * @remarks
   * `false` の場合、**ダブル役満あり** が`true` であっても、和了役に複数の役満があっても単一の役満と同じ得点とする。
   * @defaultValue `true`
   */
  enableYakumanComposite: boolean;
  /**
   * ダブル役満あり
   * @remarks
   * `true` の場合、`国士無双十三面`、`四暗刻単騎`、`大四喜`、`純正九蓮宝燈` の得点を役満の2倍とする。
   * @defaultValue `true`
   */
  enableDoubleYakuman: boolean;
  /**
   * 数え役満あり
   * @remarks
   * `false` の場合、11翻以上は全て三倍満なる。
   * @defaultValue `true`
   */
  enableCountYakuman: boolean;
  /**
   * 役満パオあり
   * @remarks
   * 本項目が `true` で **役満の複合あり** も `true` の場合、パオに関連する役満だけ責任払いが発生する。
   * 本項目が `true` で **役満の複合あり** が `false` の場合、全体に責任払いが発生する。
   * @defaultValue `true`
   */
  enableYakumanPao: boolean;
  /**
   * 切り上げ満貫あり
   * @defaultValue `false`
   */
  enableRoundUpMangan: boolean;
}

/**
 * ルールを生成する。
 * @param params カスタムルール
 * @returns ルール
 */
export function rule(params?: Partial<Rule>): Rule {
  const rule: Rule = {
    originPoint: 25000,
    rankPoint: ["20.0", "10.0", "-10.0", "-20.0"],
    redPai: {
      m: 1,
      p: 1,
      s: 1,
    },
    enableKuitan: true,
    kuikaeAllowLevel: 0,
    gameCount: 2,
    enableInterruptedGame: true,
    enableNagashi: true,
    enableNoTenDeclared: false,
    enableNoTenPenalty: true,
    maxSimultaneousWin: 2,
    consecutiveMode: 2,
    enableTobiEnd: true,
    enableOralasStopped: true,
    extensionMode: 1,
    enableIppatsu: true,
    enableUradora: true,
    enableKandora: true,
    enableKanUra: true,
    enableKandoraAfterRide: true,
    enableRiichiWithoutTurn: false,
    ankanAfterReachAllowLevel: 2,
    enableYakumanComposite: true,
    enableDoubleYakuman: true,
    enableCountYakuman: true,
    enableYakumanPao: true,
    enableRoundUpMangan: false,
  };

  return { ...rule, ...params };
}
