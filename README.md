# MADTOWN GTA 配信タイムテーブル

MADTOWN GTA イベントの配信スケジュールを表示するタイムテーブルサイト

<img width="1917" height="908" alt="image" src="https://github.com/user-attachments/assets/cb2c59d1-ec39-4fee-950c-7e622b94b7a8" />

## マスターデータ

| データ項目           | ファイル               | 説明                                                                      |
| -------------------- | ---------------------- | ------------------------------------------------------------------------- |
| イベント期間         | `data/config.json`     | イベントの開始日時と終了日時                                              |
| フィルタキーワード   | `data/config.json`     | 配信タイトルをフィルタリングするキーワードリスト（OR条件）                |
| Twitchゲームフィルタ | `data/config.json`     | Twitch配信のゲームIDフィルタ（キーワードとOR条件）                        |
| 参加者情報           | `data/channels.json`   | [非公式まとめwiki](https://w.atwiki.jp/madtowngta1/pages/12.html)から抽出 |
| 職業・組織情報       | `src/lib/constants.ts` | 各参加者の職業や所属組織に関する情報                                      |

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

GitHub Actionsを使用してデータを自動更新できます：

- **チャンネル情報**: 毎日AM 4時（JST）に更新
- **配信情報**: 1時間ごとに更新

### GitHub Secretsの設定

リポジトリの Settings → Secrets and variables → Actions で以下を設定：

| Secret名               | 説明                         |
| ---------------------- | ---------------------------- |
| `YOUTUBE_API_KEY`      | YouTube Data API v3のAPIキー |
| `TWITCH_CLIENT_ID`     | Twitch APIのClient ID        |
| `TWITCH_CLIENT_SECRET` | Twitch APIのClient Secret    |

### ワークフロー

| ワークフロー          | スケジュール      | 更新対象             |
| --------------------- | ----------------- | -------------------- |
| `update-channels.yml` | 毎日AM 4時（JST） | `data/channels.json` |
| `update-streams.yml`  | 1時間ごと         | `data/streams.json`  |

手動実行も可能（Actions → ワークフロー選択 → Run workflow）

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

---

<div align="center">
   <p>MADTOWNまとめwiki, MADTOWN企画・運営, 配信者, 全てのコンテンツ制作者に感謝いたします。</p>
   <p>MIT License © 2025 Atotti</p>
</div>
