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

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成（`.env.example`を参考）：

```bash
# YouTube Data API v3
YOUTUBE_API_KEY=your_api_key_here

# Test limit for fetch-streams script (default: 5)
TEST_LIMIT=50
```

YouTube API キーは [Google Cloud Console](https://console.cloud.google.com/) で取得できます。

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス

### データ取得スクリプト

```bash
# チャンネルリストを取得（Wiki から）
npm run scrape:channels

# YouTube @handle を解決
npm run resolve:handles

# 配信データを取得（YouTube API から）
npm run fetch:streams
```

取得したデータは `data/` ディレクトリに保存されます。

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
