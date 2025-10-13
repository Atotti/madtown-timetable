# MADTOWN GTA 配信タイムテーブル

MADTOWN GTA イベントの配信スケジュールを表示するタイムテーブルサイト

## マスターデータ

| データ項目 | ファイル | 説明 |
|-----------|---------|------|
| イベント期間 | `data/config.json` | イベントの開始日時と終了日時 |
| フィルタキーワード | `data/config.json` | 配信タイトルをフィルタリングするキーワードリスト（OR条件） |
| Twitchゲームフィルタ | `data/config.json` | Twitch配信のゲームIDフィルタ（キーワードとOR条件） |
| 参加者情報 | `data/channels.json` | [非公式まとめwiki](https://w.atwiki.jp/madtowngta1/pages/12.html)から抽出 |
| 職業・組織情報 | `src/lib/constants.ts` | 各参加者の職業や所属組織に関する情報 |

## 配信データ取得

配信データの取得時に以下のフィルタリングが適用されます：

1. 期間フィルタ
   - **対象期間**: `config.event.startDate` 〜 `config.event.endDate`
   - 配信の開始時刻がこの期間内にある動画のみを取得
2. タイトルキーワードフィルタ
   - **キーワードリスト**: `config.filters.titleKeywords`
   - **マッチング方式**: OR条件（いずれかのキーワードにマッチすれば対象）
   - **大文字小文字**: 区別しない（case-insensitive）

## データ取得詳細

配信データを取得するには、以下のスクリプトを順番に実行します：

[非公式まとめwiki](view-source:https://w.atwiki.jp/madtowngta1/pages/12.html)を`data/raw.html`にdump

```bash
# 1. チャンネルリストを取得（raw.html から YouTube & Twitch の情報を抽出）
npm run scrape:channels

# 2. YouTube @handle 形式のチャンネルIDを実際のIDに変換
npm run resolve:handles

# 3. Twitch ユーザー名からユーザーIDを取得
npm run resolve:twitch-ids

# 4. チャンネルアイコンを取得（YouTube & Twitch）
npm run fetch:avatars

# 5. 配信データを取得（YouTube & Twitch の両方）
npm run fetch:streams
```

取得したデータは `data/` ディレクトリに保存されます。

---

# 開発

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成（`.env.example`を参考）：

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス

## ビルド

```bash
npm run build
```

MADTOWNまとめwiki編集者に感謝いたします。
