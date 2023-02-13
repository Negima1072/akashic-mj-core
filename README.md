# @tanimodori/mj-core

麻雀基本ライブラリ

このリポジトリは [`@kobalab/majiang-core`](https://github.com/kobalab/majiang-core) のフォークである。現在は TypeScript 型定義ファイルや ESM 支援を提供している。後には TypeScript へ移行予定です。

## インストール

```sh
$ npm i @tanimodori/mj-core
```

## 使用法

`CommonJS`:

```javascript
const Majiang = require('@tanimodori/mj-core');
```

`ESModule`:

```javascript
import Majiang from '@tanimodori/mj-core';
// or
import { Shoupai } from '@tanimodori/mj-core';
```

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

- [API仕様](https://github.com/Tanimodori/mj-core/wiki)

## ライセンス

[MIT](https://github.com/Tanimodori/mj-core/blob/master/LICENSE)

## 作者

- [Satoshi Kobayashi](https://github.com/kobalab)
- [Tanimodori](https://github.com/Tanimodori)
