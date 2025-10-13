# VCRGTA 配信タイムテーブル

VCRGTA イベントの配信スケジュールを表示するタイムテーブルサイト

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

## ドキュメント

- [SPEC.md](./SPEC.md) - 機能仕様
- [DESIGN.md](./DESIGN.md) - 技術設計
- [CLAUDE.md](./CLAUDE.md) - 開発ガイドライン
