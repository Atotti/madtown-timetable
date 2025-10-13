# MADTOWN GTA 配信タイムテーブル

MADTOWN GTA イベントの配信スケジュールを表示するタイムテーブルサイト

## 技術スタック

- **Next.js 15** (App Router, SSG)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **@tanstack/react-virtual** (仮想スクロール)
- **date-fns** (日時処理)
- **YouTube Data API v3**
- **Twitch Helix API**

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成（`.env.example`を参考）：

```bash
# YouTube Data API v3 キー
YOUTUBE_API_KEY=your_api_key_here

# Twitch API 認証情報
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here

# テストモード（デフォルト: 5チャンネル）
TEST_LIMIT=5
```

**APIキーの取得方法：**

- YouTube: [Google Cloud Console](https://console.developers.google.com/) で API キーを作成
- Twitch: [Twitch Developer Console](https://dev.twitch.tv/console/apps) でアプリを作成し、Client ID と Secret を取得

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス

### データ取得スクリプト

配信データを取得するには、以下のスクリプトを順番に実行します：

まとめwikiを`data/raw.html`にdump（view-source:https://w.atwiki.jp/madtowngta1/pages/12.html）

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

**注意：**

- `fetch:streams` は YouTube API の quota を消費します
- デフォルトではテストモードで最初の5チャンネルのみ処理されます（`.env` の `TEST_LIMIT` で変更可能）

## ビルド

```bash
npm run build
```

## ディレクトリ構造

```
vcr-timetable/
├── data/              # 静的データ（JSON）
│   ├── channels.json  # チャンネル情報
│   ├── streams.json   # 配信データ
│   └── config.json    # イベント設定
├── scripts/           # データ取得スクリプト
├── src/
│   ├── app/          # Next.js App Router
│   ├── components/   # React コンポーネント
│   ├── lib/          # ユーティリティ
│   └── types/        # TypeScript 型定義
├── SPEC.md           # 仕様書
└── DESIGN.md         # 設計書
```

## マスターデータ

### data/channels.json

チャンネル情報のマスターデータ。

```json
{
  "channels": [
    {
      "id": "unique-channel-id",
      "name": "チャンネル名",
      "youtubeChannelId": "UCxxxxx", // YouTube チャンネルID（オプション）
      "youtubeHandle": "@handle", // YouTube ハンドル（オプション）
      "twitchUserId": "12345", // Twitch ユーザーID（オプション）
      "twitchUserName": "username", // Twitch ユーザー名（オプション）
      "avatarUrl": "https://...", // アイコンURL
      "job": "役職・職業", // 役職情報（オプション）
      "totalViews": 1000000 // 総再生回数（オプション）
    }
  ]
}
```

### data/streams.json

配信データのマスターデータ。

```json
{
  "streams": [
    {
      "platform": "youtube", // プラットフォーム: "youtube" | "twitch"
      "videoId": "abc123", // 動画ID
      "channelId": "unique-channel-id", // チャンネルID（channels.jsonのidと紐付け）
      "title": "配信タイトル",
      "scheduledStartTime": "2025-10-01T12:00:00Z", // 配信開始時刻
      "actualStartTime": "2025-10-01T12:05:00Z", // 実際の開始時刻（オプション）
      "actualEndTime": "2025-10-01T15:00:00Z", // 実際の終了時刻（オプション）
      "duration": 10500, // 配信時間（秒）
      "thumbnailUrl": "https://...", // サムネイルURL
      "viewCount": 5000, // 視聴回数（オプション）
      "url": "https://..." // 配信URL
    }
  ]
}
```

### data/config.json

イベント設定とフィルタリング条件。

```json
{
  "event": {
    "name": "MADTOWN GTA", // イベント名
    "startDate": "2025-10-01T00:00:00+09:00", // イベント開始日時
    "endDate": "2025-10-31T23:59:59+09:00" // イベント終了日時
  },
  "filters": {
    "titleKeywords": ["GTA", "MADTOWN", "VCRGTA"] // タイトルフィルタリングキーワード
  }
}
```

## フィルタリング仕様

配信データの取得時に以下のフィルタリングが適用されます：

### 1. 期間フィルタ

- **対象期間**: `config.event.startDate` 〜 `config.event.endDate`
- 配信の開始時刻がこの期間内にある動画のみを取得

### 2. タイトルキーワードフィルタ

- **キーワードリスト**: `config.filters.titleKeywords`
- **マッチング方式**: OR条件（いずれかのキーワードにマッチすれば対象）
- **大文字小文字**: 区別しない（case-insensitive）

### 3. 複合フィルタ

期間フィルタ **AND** タイトルキーワードフィルタの両方を満たす配信のみを取得します。

### 実装の詳細

- **YouTube**: `scripts/lib/youtube-client.ts` の `listVideoIdsFromUploads` 関数
  - uploadsプレイリストから動画を取得
  - 正規表現によるタイトルマッチング

- **Twitch**: `scripts/lib/twitch-client.ts` の `getUserVideos` 関数
  - ページネーションで過去動画を取得
  - 部分文字列マッチング（`includes`）

## ドキュメント

- [SPEC.md](./docs/SPEC.md) - 機能仕様
- [DESIGN.md](./docs/DESIGN.md) - 技術設計
- [CLAUDE.md](./CLAUDE.md) - 開発ガイドライン
