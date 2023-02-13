# @negima1072/akashic-mj-core

麻雀基本ライブラリ

このリポジトリは [`@kobalab/majiang-core`](https://github.com/kobalab/majiang-core) 及び [`@tanimodori/mj-core`](https://github.com/tanimodori/mj-core) のフォークである。
また、 [`@akashic-games/akashic-engine`](https://github.com/akashic-games/akashic-engine) に最適化された麻雀ライブラリである。

## インストール

```sh
$ akashic install @negima1072/akashic-mj-core
```

## 使用法

```javascript
import { Game, Shoupai } from '@tanimodori/mj-core';
```

## 変更点

akashic-engineに適応させるために、Math.randomの置き換えやTypeScriptへの対応などを行った。

## 提供機能

| クラス名            | 機能                                 |
|:--------------------|:-------------------------------------|
| ``Majiang.Shoupai`` | 手牌を表現するクラス                 |
| ``Majiang.Shan``    | 牌山を表現するクラス                 |
| ``Majiang.He``      | 捨て牌を表現するクラス               |
| ``Majiang.Util``    | シャンテン数計算、和了点計算ルーチン |
| ``Majiang.Game``    | 局進行を実現するクラス               |
| ``Majiang.Board``   | 卓情報を更新するクラス       |
| ``Majiang.Player``  | 対局者を実現する基底クラス           |

- [API仕様](https://github.com/Negima1072/mj-core/wiki)

## ライセンス

[MIT](https://github.com/Negima1072/akashic-mj-core/blob/master/LICENSE)

## 作者

- [Satoshi Kobayashi](https://github.com/kobalab)
- [Tanimodori](https://github.com/Tanimodori)
- [Negima1072](https://github.com/Negima1072)
