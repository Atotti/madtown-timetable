# VCRGTA 配信タイムテーブル - 設計書

## 1. アーキテクチャ概要

### 1.1 システム全体図

```
┌─────────────────────────────────────────────────────────────┐
│                        GitHub Repository                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   data/      │  │   scripts/   │  │   src/       │      │
│  │  - channels  │  │  - scrape    │  │  - app/      │      │
│  │  - streams   │  │  - fetch     │  │  - components│      │
│  │  - config    │  │              │  │  - lib/      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           │                    │                    │
    ┌──────▼──────┐      ┌─────▼─────┐      ┌──────▼──────┐
    │   Vercel    │      │  GitHub   │      │   YouTube   │
    │   (Deploy)  │      │  Actions  │      │  Data API   │
    │             │      │  (Cron)   │      │             │
    └─────────────┘      └───────────┘      └─────────────┘
           │                    │                    │
           │                    │             ┌──────▼──────┐
           │                    │             │   Twitch    │
           │                    │             │ Helix API   │
           │                    │             │             │
           │                    │             └─────────────┘
           │                    │                    │
           │                    └────────────────────┘
           │                         (定期データ更新)
           ▼
    ┌─────────────┐
    │   User      │
    │  (Browser)  │
    └─────────────┘
```

### 1.2 データフロー

#### データ更新フロー（管理者側）

```
1. GitHub Actions (Cron: 6時間ごと)
   ↓
2. scripts/scrape-channels.ts (週1回)
   ├→ Wiki スクレイピング
   ├→ チャンネルリスト抽出（YouTube、Twitch）
   └→ data/channels.json 生成
   ↓
3. scripts/resolve-handles.ts (初回・必要時)
   ├→ YouTube @handle → Channel ID 変換
   └→ data/channels.json 更新
   ↓
4. scripts/resolve-twitch-ids.ts (初回・必要時)
   ├→ Twitch username → User ID 変換
   └→ data/channels.json 更新
   ↓
5. scripts/fetch-streams.ts (6時間ごと)
   ├→ channels.json 読み込み
   ├→ YouTube API 呼び出し
   │  ├→ channels.list (uploadsプレイリストID取得)
   │  ├→ playlistItems.list (動画リスト取得)
   │  └→ videos.list (詳細取得)
   ├→ Twitch API 呼び出し
   │  ├→ OAuth2 認証
   │  └→ GET /helix/videos (VOD取得)
   ├→ liveStreamingDetails フィルタリング（YouTube）
   ├→ タイトル・期間フィルタ（両プラットフォーム）
   └→ data/streams.json 生成
   ↓
6. Git Commit & Push
   ↓
7. Vercel Auto Deploy
```

#### データ表示フロー（ユーザー側）

```
1. ユーザーがサイトにアクセス
   ↓
2. Next.js (SSG) - ビルド時にJSONを読み込み
   ├→ data/channels.json
   ├→ data/streams.json
   └→ data/config.json
   ↓
3. タイムテーブルコンポーネント
   ├→ チャンネル×時間のグリッド計算
   ├→ 仮想スクロールで表示範囲のみレンダリング
   └→ 配信カード表示
   ↓
4. ユーザーインタラクション
   ├→ スクロール
   ├→ 検索・フィルタ
   └→ 配信カードクリック → YouTube別タブ
```

### 1.3 技術スタック詳細

| カテゴリ       | 技術                    | バージョン | 用途                       |
| -------------- | ----------------------- | ---------- | -------------------------- |
| フレームワーク | Next.js                 | 15.x       | React SSG/SSR              |
| 言語           | TypeScript              | 5.x        | 型安全性                   |
| UI             | React                   | 19.x       | コンポーネント             |
| スタイリング   | Tailwind CSS            | 4.x        | CSSフレームワーク          |
| 仮想スクロール | @tanstack/react-virtual | 3.x        | パフォーマンス最適化       |
| 日時処理       | date-fns                | 3.x        | タイムゾーン・フォーマット |
| スクレイピング | cheerio                 | 1.x        | HTML解析                   |
| HTTP           | axios                   | 1.x        | API呼び出し（主にTwitch）  |
| YouTube API    | googleapis              | 最新       | 公式クライアント           |
| Twitch API     | Twitch Helix API        | -          | OAuth2 + REST API          |
| ホスティング   | Vercel                  | -          | デプロイ                   |
| CI/CD          | GitHub Actions          | -          | 自動化                     |

## 2. ディレクトリ構造

```
vcr-timetable/
├── .github/
│   └── workflows/
│       ├── update-channels.yml      # チャンネルリスト更新（週1回）
│       └── update-streams.yml       # 配信データ更新（6時間ごと）
│
├── data/                            # 静的データ（JSON）
│   ├── channels.json               # チャンネルマスター
│   ├── streams.json                # 配信データ
│   └── config.json                 # 企画設定
│
├── scripts/                         # データ取得スクリプト
│   ├── lib/
│   │   ├── wiki-scraper.ts         # Wikiスクレイピングロジック
│   │   ├── youtube-client.ts       # YouTube API クライアント
│   │   ├── twitch-client.ts        # Twitch API クライアント
│   │   ├── file-utils.ts           # ファイル読み書きユーティリティ
│   │   └── data-validator.ts       # データバリデーション
│   ├── scrape-channels.ts          # チャンネルリスト取得
│   ├── resolve-handles.ts          # YouTube @handle → Channel ID 変換
│   ├── resolve-twitch-ids.ts       # Twitch username → User ID 変換
│   └── fetch-streams.ts            # 配信データ取得（YouTube + Twitch）
│
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx              # ルートレイアウト
│   │   ├── page.tsx                # トップページ（タイムテーブル）
│   │   └── globals.css             # グローバルスタイル
│   │
│   ├── components/                  # Reactコンポーネント
│   │   ├── timetable/
│   │   │   ├── Timetable.tsx       # タイムテーブルコンテナ
│   │   │   ├── TimeGrid.tsx        # 時間グリッド
│   │   │   ├── ChannelColumn.tsx   # チャンネル列
│   │   │   ├── StreamCard.tsx      # 配信カード
│   │   │   └── TimeLabel.tsx       # 時刻ラベル
│   │   ├── header/
│   │   │   ├── Header.tsx          # ヘッダー
│   │   │   ├── SearchBar.tsx       # 検索バー
│   │   │   └── FilterPanel.tsx     # フィルタパネル
│   │   └── ui/
│   │       ├── VirtualScroller.tsx # 仮想スクロールラッパー
│   │       └── DatePicker.tsx      # 日付ピッカー
│   │
│   ├── lib/                         # ユーティリティ
│   │   ├── data-loader.ts          # データ読み込み
│   │   ├── time-utils.ts           # 時間計算
│   │   ├── grid-calculator.ts      # グリッド座標計算
│   │   └── constants.ts            # 定数定義
│   │
│   └── types/                       # TypeScript型定義
│       ├── channel.ts
│       ├── stream.ts
│       └── config.ts
│
├── public/                          # 静的ファイル
│   └── placeholder.png             # サムネイルフォールバック
│
├── .env.example                     # 環境変数テンプレート
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── SPEC.md                          # 仕様書
└── DESIGN.md                        # 設計書（本ファイル）
```

## 3. フロントエンド設計

### 3.1 コンポーネント構成図

```
app/page.tsx (トップページ)
│
└─ Timetable (タイムテーブルコンテナ)
   ├─ Header (ヘッダー)
   │  ├─ SearchBar (検索バー)
   │  └─ FilterPanel (フィルタパネル)
   │
   └─ TimeGrid (時間グリッド)
      ├─ TimeLabel (時刻ラベル - 固定)
      │
      └─ VirtualScroller (横スクロール仮想化)
         └─ ChannelColumn[] (チャンネル列 - 仮想化)
            └─ StreamCard[] (配信カード)
```

### 3.2 コンポーネント詳細

#### 3.2.1 Timetable (タイムテーブルコンテナ)

**責務**:

- データ読み込み
- フィルタリング・検索ロジック
- 状態管理（表示範囲、選択中のフィルタ等）

**State**:

```typescript
type TimetableState = {
  channels: Channel[]; // 全チャンネル
  streams: Stream[]; // 全配信
  filteredChannels: Channel[]; // フィルタ後のチャンネル
  searchQuery: string; // 検索クエリ
  selectedJobs: string[]; // 選択中の職業フィルタ
  timeRange: {
    // 表示時間範囲
    start: Date;
    end: Date;
  };
};
```

**Props**:

```typescript
type TimetableProps = {
  initialData: {
    channels: Channel[];
    streams: Stream[];
    config: Config;
  };
};
```

#### 3.2.2 TimeGrid (時間グリッド)

**責務**:

- グリッドレイアウト計算
- スクロール位置管理
- 時刻ラベルの固定表示

**レイアウト計算**:

```typescript
// グリッドサイズ定数
const GRID_CONFIG = {
  HOUR_HEIGHT: 60, // 1時間の高さ（px）
  CHANNEL_WIDTH: 200, // 1チャンネルの幅（px）
  TIME_LABEL_WIDTH: 60, // 時刻ラベルの幅（px）
  HEADER_HEIGHT: 60, // ヘッダーの高さ（px）
};

// 配信カードの位置計算
function calculateCardPosition(
  stream: Stream,
  startTime: Date,
): {
  top: number;
  height: number;
} {
  const startOffset = differenceInMinutes(
    parseISO(stream.startTime),
    startTime,
  );
  const duration = stream.endTime
    ? differenceInMinutes(parseISO(stream.endTime), parseISO(stream.startTime))
    : 60; // デフォルト1時間

  return {
    top: (startOffset / 60) * GRID_CONFIG.HOUR_HEIGHT,
    height: (duration / 60) * GRID_CONFIG.HOUR_HEIGHT,
  };
}
```

#### 3.2.3 VirtualScroller (仮想スクロール)

**責務**:

- 横スクロールの仮想化
- 表示範囲内のチャンネルのみレンダリング
- パフォーマンス最適化

**実装方針**:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualScroller({ channels }: { channels: Channel[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => GRID_CONFIG.CHANNEL_WIDTH,
    horizontal: true,  // 横スクロール
    overscan: 5,       // 前後5個余分にレンダリング
  });

  const virtualChannels = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="overflow-x-auto">
      <div
        style={{
          width: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualChannels.map((virtualChannel) => (
          <ChannelColumn
            key={virtualChannel.key}
            channel={channels[virtualChannel.index]}
            style={{
              position: 'absolute',
              left: `${virtualChannel.start}px`,
              width: `${virtualChannel.size}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 3.2.4 StreamCard (配信カード)

**責務**:

- 配信情報の表示
- クリックイベント処理（別タブでYouTube開く）
- ライブ配信バッジ表示

**UI設計**:

```typescript
type StreamCardProps = {
  stream: Stream;
  style: CSSProperties; // 位置・サイズ（親から計算）
};

// カードの最小高さ
const MIN_CARD_HEIGHT = 40; // px

// カードの表示内容（高さに応じて調整）
// - 40px以上: タイトルのみ
// - 60px以上: タイトル + 時間
// - 80px以上: サムネイル + タイトル + 時間
```

**クリックイベント**:

```typescript
function handleClick(stream: Stream) {
  const url =
    stream.platform === "youtube"
      ? `https://www.youtube.com/watch?v=${stream.videoId}`
      : `https://www.twitch.tv/videos/${stream.videoId}`;
  window.open(url, "_blank");
}
```

**プラットフォーム別スタイリング**:

```typescript
// プラットフォームに応じた背景色
const bgColor =
  stream.platform === "youtube"
    ? "bg-blue-500 hover:bg-blue-600"
    : "bg-purple-600 hover:bg-purple-700";
```

### 3.3 状態管理設計

**方針**: 小規模なのでReact hooksで十分

**状態の分類**:

| 状態              | 管理場所          | 用途       |
| ----------------- | ----------------- | ---------- |
| channels, streams | `Timetable` state | データ     |
| searchQuery       | `Timetable` state | 検索       |
| selectedJobs      | `Timetable` state | フィルタ   |
| scrollPosition    | `TimeGrid` ref    | スクロール |
| virtualItems      | `useVirtualizer`  | 仮想化     |

**派生状態**:

```typescript
// フィルタリング
const filteredChannels = useMemo(() => {
  return channels.filter((channel) => {
    const matchesSearch = channel.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesJob =
      selectedJobs.length === 0 || selectedJobs.includes(channel.job || "");
    return matchesSearch && matchesJob;
  });
}, [channels, searchQuery, selectedJobs]);

// チャンネルごとの配信リスト
const streamsByChannel = useMemo(() => {
  const map = new Map<string, Stream[]>();
  streams.forEach((stream) => {
    const list = map.get(stream.channelId) || [];
    list.push(stream);
    map.set(stream.channelId, list);
  });
  return map;
}, [streams]);
```

### 3.4 レンダリング戦略

**SSG（Static Site Generation）**:

- ビルド時にJSONデータを読み込み
- 完全な静的HTMLを生成
- CDN配信で高速化

```typescript
// app/page.tsx
export default async function Home() {
  // ビルド時にデータ読み込み
  const channels = await loadChannels();
  const streams = await loadStreams();
  const config = await loadConfig();

  return (
    <Timetable
      initialData={{ channels, streams, config }}
    />
  );
}
```

**クライアント側レンダリング**:

- タイムテーブルコンポーネントは`"use client"`
- インタラクション（スクロール、フィルタ）を処理

## 4. タイムテーブルUI詳細設計

### 4.1 グリッドレイアウト

#### 4.1.1 座標系

```
時刻ラベル固定領域 │ チャンネル表示領域（横スクロール）
(60px固定)        │
──────────────────┼────────────────────────────────────
ヘッダー固定      │  Ch1    Ch2    Ch3    Ch4  ...
(60px固定)        │ (200px)(200px)(200px)(200px)
──────────────────┼────────────────────────────────────
0:00 ─            │  │      │      │      │
                  │  │  ┌───┤      │      │
1:00 ─            │  │  │配信      │      │
                  │  │  │A  │      │  ┌───┤
2:00 ─            │  │  └───┤      │  │配信
                  │  │      │      │  │B  │
3:00 ─            │  │      │      │  └───┤
                  │  │      │      │      │
...               │  ↓      ↓      ↓      ↓
                  │  縦スクロール（全期間）
```

#### 4.1.2 座標計算

**時間軸（Y座標）**:

```typescript
// 時刻ラベルの位置
function getTimeLabelPosition(hour: number): number {
  return hour * GRID_CONFIG.HOUR_HEIGHT;
}

// 配信カードのY座標
function getStreamYPosition(
  streamStartTime: Date,
  gridStartTime: Date,
): number {
  const minutesFromStart = differenceInMinutes(streamStartTime, gridStartTime);
  return (minutesFromStart / 60) * GRID_CONFIG.HOUR_HEIGHT;
}
```

**チャンネル軸（X座標）**:

```typescript
// チャンネル列のX座標
function getChannelXPosition(channelIndex: number): number {
  return (
    GRID_CONFIG.TIME_LABEL_WIDTH + channelIndex * GRID_CONFIG.CHANNEL_WIDTH
  );
}
```

### 4.2 仮想スクロール実装

#### 4.2.1 横スクロール（チャンネル軸）

**@tanstack/react-virtual 使用**:

- 200チャンネルでも、表示範囲（例: 5-10チャンネル）のみレンダリング
- 前後のoverscan（余裕を持ってレンダリング）で滑らかなスクロール

```typescript
const columnVirtualizer = useVirtualizer({
  count: filteredChannels.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => GRID_CONFIG.CHANNEL_WIDTH,
  horizontal: true,
  overscan: 5,
});
```

#### 4.2.2 縦スクロール（時間軸）

**通常のCSSスクロール**:

- 時間軸は連続的なのでネイティブスクロールで十分
- 固定ヘッダー・固定時刻ラベルは`position: sticky`で実現

```css
.time-label {
  position: sticky;
  left: 0;
  z-index: 10;
}

.channel-header {
  position: sticky;
  top: 0;
  z-index: 10;
}
```

### 4.3 スクロール同期

**ヘッダーと本体の横スクロール同期**:

```typescript
function Timetable() {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (source: 'header' | 'body') => {
    if (source === 'body' && headerScrollRef.current && bodyScrollRef.current) {
      headerScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
    if (source === 'header' && headerScrollRef.current && bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    }
  };

  return (
    <div>
      <div
        ref={headerScrollRef}
        onScroll={() => handleScroll('header')}
      >
        {/* チャンネルヘッダー */}
      </div>
      <div
        ref={bodyScrollRef}
        onScroll={() => handleScroll('body')}
      >
        {/* タイムグリッド */}
      </div>
    </div>
  );
}
```

### 4.4 レスポンシブ対応

**デスクトップ（メイン）**:

- 横幅: 無制限（横スクロール）
- チャンネル幅: 200px
- 時間高さ: 60px/hour

**タブレット（オプション）**:

- チャンネル幅: 150px
- 時間高さ: 50px/hour

**モバイル（将来的）**:

- タイムテーブル表示は困難
- リスト表示に切り替え（チャンネル → 配信リスト）

## 5. データ取得スクリプト設計

### 5.1 Wikiスクレイピング（初回補助ツール）

**位置づけ**: 初回データ作成を補助するツール。出力結果は手動修正が必要。

#### 5.1.1 対象ページ

- URL: https://w.atwiki.jp/madtowngta1/pages/12.html
- 内容: 参加者一覧（チャンネル名、URL、職業）

#### 5.1.2 実装

**scripts/lib/wiki-scraper.ts**:

```typescript
import axios from "axios";
import * as cheerio from "cheerio";

type WikiChannel = {
  name: string;
  youtubeUrl: string;
  youtubeChannelId: string;
  job?: string;
};

export async function scrapeChannelsFromWiki(
  url: string,
): Promise<WikiChannel[]> {
  // HTML取得
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const channels: WikiChannel[] = [];

  // テーブルまたはリストからチャンネル情報を抽出
  // （実際のHTML構造に応じて調整）
  $("table tr").each((_, row) => {
    const $row = $(row);
    const name = $row.find("td:nth-child(1)").text().trim();
    const youtubeUrl = $row.find("td:nth-child(2) a").attr("href") || "";
    const job = $row.find("td:nth-child(3)").text().trim();

    if (name && youtubeUrl) {
      const channelId = extractChannelId(youtubeUrl);
      if (channelId) {
        channels.push({ name, youtubeUrl, youtubeChannelId: channelId, job });
      }
    }
  });

  return channels;
}

// YouTubeチャンネルIDを抽出
function extractChannelId(url: string): string | null {
  // https://youtube.com/channel/UCxxxxx
  const channelMatch = url.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
  if (channelMatch) return channelMatch[1];

  // https://youtube.com/@handle → APIで変換が必要
  const handleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
  if (handleMatch) return `@${handleMatch[1]}`; // 後でAPIで解決

  return null;
}
```

**scripts/scrape-channels.ts**:

```typescript
import { scrapeChannelsFromWiki } from "./lib/wiki-scraper";
import { writeJSON } from "./lib/file-utils";

async function main() {
  console.log("Scraping channels from Wiki...");
  const wikiChannels = await scrapeChannelsFromWiki(
    "https://w.atwiki.jp/madtowngta1/pages/12.html",
  );

  console.log(`Found ${wikiChannels.length} channels`);

  // 粗データとして出力（手動修正が必要）
  const rawData = {
    channels: wikiChannels.map((ch) => ({
      id: "", // 手動で設定
      name: ch.name,
      youtubeChannelId: ch.youtubeChannelId,
      avatarUrl: "", // 手動で設定またはYouTube APIで取得
      job: ch.job,
      totalViews: 0, // 手動で設定またはYouTube APIで取得
    })),
  };

  // 粗データとして出力
  await writeJSON("data/channels-raw.json", rawData);
  console.log("Saved raw data to data/channels-raw.json");
  console.log(
    "⚠️  This is raw data. Please manually review and edit before using as channels.json",
  );
}

main().catch(console.error);
```

**使用方法**:

1. スクリプト実行: `npm run scrape:channels`
2. `data/channels-raw.json`が生成される
3. 手動で内容を確認・修正
4. `data/channels.json`として保存

### 5.2 YouTube API連携

#### 5.2.1 APIクライアント

**scripts/lib/youtube-client.ts**:

```typescript
import { google, youtube_v3 } from "@googleapis/youtube";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// チャンネル詳細取得
export async function getChannelDetails(
  channelId: string,
): Promise<youtube_v3.Schema$Channel> {
  const response = await youtube.channels.list({
    part: ["snippet", "statistics"],
    id: [channelId],
  });

  if (!response.data.items || response.data.items.length === 0) {
    throw new Error(`Channel not found: ${channelId}`);
  }

  return response.data.items[0];
}

// チャンネルの配信を検索
export async function searchStreams(
  channelId: string,
  keywords: string[],
  publishedAfter: string,
  publishedBefore: string,
): Promise<youtube_v3.Schema$SearchResult[]> {
  const results: youtube_v3.Schema$SearchResult[] = [];

  for (const keyword of keywords) {
    const response = await youtube.search.list({
      part: ["id"],
      channelId,
      q: keyword,
      type: ["video"],
      publishedAfter,
      publishedBefore,
      maxResults: 50,
      order: "date",
    });

    if (response.data.items) {
      results.push(...response.data.items);
    }
  }

  // 重複除去
  const uniqueResults = Array.from(
    new Map(results.map((r) => [r.id?.videoId, r])).values(),
  );

  return uniqueResults;
}

// 動画詳細取得（liveStreamingDetails含む）
export async function getVideoDetails(
  videoIds: string[],
): Promise<youtube_v3.Schema$Video[]> {
  // 50件ずつバッチ処理
  const batches = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50));
  }

  const allVideos: youtube_v3.Schema$Video[] = [];

  for (const batch of batches) {
    const response = await youtube.videos.list({
      part: ["snippet", "liveStreamingDetails", "statistics", "contentDetails"],
      id: batch,
    });

    if (response.data.items) {
      allVideos.push(...response.data.items);
    }
  }

  return allVideos;
}
```

**scripts/lib/twitch-client.ts**:

```typescript
import axios from "axios";
import { config } from "dotenv";

config();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * アプリアクセストークン取得（Client Credentials Flow）
 */
async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const response = await axios.post("https://id.twitch.tv/oauth2/token", null, {
    params: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000;
  return response.data.access_token;
}

/**
 * ログイン名からユーザー情報を取得
 */
export async function getUserByLogin(login: string): Promise<{
  id: string;
  login: string;
  displayName: string;
} | null> {
  const token = await getAccessToken();
  const response = await axios.get("https://api.twitch.tv/helix/users", {
    headers: {
      "Client-ID": CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
    params: { login },
  });

  const users = response.data.data || [];
  if (users.length === 0) return null;

  return {
    id: users[0].id,
    login: users[0].login,
    displayName: users[0].display_name,
  };
}

/**
 * ユーザーの動画（VOD）を取得
 */
export async function getUserVideos(
  userId: string,
  startDate: string,
  endDate: string,
  keywords: string[],
): Promise<TwitchVideo[]> {
  // Twitch APIからVODを取得し、期間・キーワードでフィルタ
  // 詳細は実装参照
}

/**
 * Twitch durationをパース（例: "1h23m45s" → 5025秒）
 */
export function parseTwitchDuration(duration: string): number {
  const hours = duration.match(/(\d+)h/)?.[1] || "0";
  const minutes = duration.match(/(\d+)m/)?.[1] || "0";
  const seconds = duration.match(/(\d+)s/)?.[1] || "0";
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}
```

#### 5.2.2 配信データ取得

**scripts/fetch-streams.ts**:

```typescript
import { readJSON, writeJSON } from "./lib/file-utils";
import { searchStreams, getVideoDetails } from "./lib/youtube-client";
import type { Channel, Stream, Config } from "../src/types";

async function main() {
  // 設定読み込み
  const config: Config = await readJSON("data/config.json");
  const channels: Channel[] = (await readJSON("data/channels.json")).channels;

  console.log(`Fetching streams for ${channels.length} channels...`);

  const allStreams: Stream[] = [];

  // チャンネルごとに配信検索
  for (const channel of channels) {
    console.log(`Processing ${channel.name}...`);

    try {
      // 検索
      const searchResults = await searchStreams(
        channel.youtubeChannelId,
        config.filters.titleKeywords,
        config.event.startDate,
        config.event.endDate,
      );

      const videoIds = searchResults
        .map((r) => r.id?.videoId)
        .filter((id): id is string => !!id);

      if (videoIds.length === 0) {
        console.log(`  No streams found`);
        continue;
      }

      // 詳細取得
      const videos = await getVideoDetails(videoIds);

      // liveStreamingDetailsが存在するもののみ（ライブ配信）
      const liveVideos = videos.filter(
        (v) => v.liveStreamingDetails?.actualStartTime,
      );

      console.log(`  Found ${liveVideos.length} live streams`);

      // Streamオブジェクトに変換
      for (const video of liveVideos) {
        const liveDetails = video.liveStreamingDetails!;
        const actualStart = liveDetails.actualStartTime;
        const actualEnd = liveDetails.actualEndTime;

        if (!actualStart) continue; // まだ開始していない

        allStreams.push({
          id: crypto.randomUUID(),
          channelId: channel.id,
          videoId: video.id!,
          title: video.snippet?.title || "",
          thumbnailUrl: video.snippet?.thumbnails?.medium?.url || "",
          startTime: actualStart,
          endTime: actualEnd || undefined,
          scheduledStartTime: liveDetails.scheduledStartTime || undefined,
          duration: actualEnd
            ? Math.floor(
                (new Date(actualEnd).getTime() -
                  new Date(actualStart).getTime()) /
                  1000,
              )
            : undefined,
          isLive: !actualEnd, // 終了時刻がなければ配信中
          viewCount: parseInt(video.statistics?.viewCount || "0"),
        });
      }

      // API Quota節約のため、待機
      await sleep(100);
    } catch (error) {
      console.error(`  Error processing ${channel.name}:`, error);
    }
  }

  // 開始時刻でソート
  allStreams.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  // streams.jsonに保存
  await writeJSON("data/streams.json", {
    period: {
      start: config.event.startDate,
      end: config.event.endDate,
    },
    streams: allStreams,
  });

  console.log(`Saved ${allStreams.length} streams to data/streams.json`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch(console.error);
```

### 5.3 Quota管理

#### 5.3.1 YouTube API Quota

| エンドポイント | コスト | 用途           |
| -------------- | ------ | -------------- |
| channels.list  | 1      | チャンネル詳細 |
| search.list    | 100    | 動画検索       |
| videos.list    | 1      | 動画詳細       |

**1チャンネルあたりのコスト**:

- search.list × キーワード数（2個の場合）: 200
- videos.list × 動画数 / 50: ~1-2

**合計**: 約200-202ユニット/チャンネル

**200チャンネル**:

- 合計: 40,000-40,400ユニット
- 1日のquota: 10,000ユニット
- **必要日数: 4-5日**

#### 5.3.2 対策

**1. 差分更新**:

```typescript
// 前回取得済みの配信はスキップ
const existingStreams = await readJSON("data/streams.json");
const existingVideoIds = new Set(existingStreams.streams.map((s) => s.videoId));

// 新規動画のみ詳細取得
const newVideoIds = videoIds.filter((id) => !existingVideoIds.has(id));
```

**2. バッチ処理**:

```typescript
// 1日50チャンネルずつ処理
const BATCH_SIZE = 50;
const startIndex = parseInt(process.env.BATCH_INDEX || "0");
const batch = channels.slice(startIndex, startIndex + BATCH_SIZE);
```

**3. キャッシュ**:

```typescript
// チャンネル情報は1週間キャッシュ
const cacheFile = `cache/channels-${channel.id}.json`;
const cacheAge = Date.now() - fs.statSync(cacheFile).mtimeMs;
if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
  return await readJSON(cacheFile);
}
```

### 5.4 エラーハンドリング

```typescript
// リトライロジック
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Quota超過の場合は即座に失敗
      if (error.code === 403 && error.message.includes("quota")) {
        throw new Error("YouTube API quota exceeded");
      }

      // それ以外のエラーはリトライ
      console.warn(`Retry ${i + 1}/${maxRetries}:`, error.message);
      await sleep(1000 * (i + 1)); // 指数バックオフ
    }
  }
  throw new Error("Should not reach here");
}
```

## 6. データモデル詳細

### 6.1 TypeScript型定義

**src/types/channel.ts**:

```typescript
export type Channel = {
  id: string; // UUID
  name: string; // チャンネル名
  // YouTube（オプショナル）
  youtubeChannelId?: string; // YouTubeチャンネルID
  youtubeHandle?: string; // @ハンドル
  // Twitch（オプショナル）
  twitchUserId?: string; // TwitchユーザーID
  twitchUserName?: string; // Twitchユーザー名
  // 共通
  avatarUrl: string; // アイコン画像URL
  job?: string; // 職業
  totalViews?: number; // 総再生回数
};

export type ChannelsData = {
  channels: Channel[];
};
```

**src/types/stream.ts**:

```typescript
export type Stream = {
  id: string; // UUID
  channelId: string; // チャンネルID
  platform: "youtube" | "twitch"; // プラットフォーム識別子
  videoId: string; // 動画ID（YouTubeまたはTwitch）
  title: string; // タイトル
  thumbnailUrl: string; // サムネイル
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601
  scheduledStartTime?: string; // ISO 8601
  duration?: number; // 秒
  isLive: boolean; // 配信中
  viewCount?: number; // 再生回数
};

export type StreamsData = {
  period: {
    start: string; // ISO 8601
    end: string; // ISO 8601
  };
  streams: Stream[];
};
```

**src/types/config.ts**:

```typescript
export type Config = {
  event: {
    name: string; // 企画名
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
  };
  filters: {
    titleKeywords: string[]; // フィルタキーワード
  };
  display: {
    defaultTimeRange: number; // 時間
    timeGridInterval: number; // 時間
  };
};
```

### 6.2 バリデーション

**scripts/lib/data-validator.ts**:

```typescript
import { z } from "zod";

const ChannelSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  youtubeChannelId: z.string().min(1),
  youtubeHandle: z.string().optional(),
  avatarUrl: z.string().url(),
  job: z.string().optional(),
  totalViews: z.number().optional(),
});

const StreamSchema = z.object({
  id: z.string().uuid(),
  channelId: z.string().uuid(),
  videoId: z.string().min(1),
  title: z.string().min(1),
  thumbnailUrl: z.string().url(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  scheduledStartTime: z.string().datetime().optional(),
  duration: z.number().optional(),
  isLive: z.boolean(),
  viewCount: z.number().optional(),
});

export function validateChannels(data: unknown) {
  return z.object({ channels: z.array(ChannelSchema) }).parse(data);
}

export function validateStreams(data: unknown) {
  return z
    .object({
      period: z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      }),
      streams: z.array(StreamSchema),
    })
    .parse(data);
}
```

## 7. パフォーマンス最適化

### 7.1 仮想スクロール

**効果**:

- 200チャンネル × 500配信 = 100,000 DOM要素
- 仮想化により、表示範囲のみ（例: 10チャンネル × 50配信 = 500 DOM要素）

**実装**:

- `@tanstack/react-virtual`使用
- 横スクロール（チャンネル軸）のみ仮想化
- 縦スクロール（時間軸）は通常のCSSスクロール

### 7.2 画像最適化

**サムネイル遅延読み込み**:

```typescript
<img
  src={stream.thumbnailUrl}
  alt={stream.title}
  loading="lazy"
  decoding="async"
/>
```

**Next.js Image コンポーネント** (オプション):

```typescript
import Image from 'next/image';

<Image
  src={stream.thumbnailUrl}
  alt={stream.title}
  width={120}
  height={90}
  loading="lazy"
/>
```

### 7.3 バンドルサイズ最適化

**Tree shaking**:

- date-fnsは必要な関数のみimport

```typescript
import { format, parseISO } from "date-fns";
```

**Code splitting**:

- フィルタパネル等は動的import

```typescript
const FilterPanel = dynamic(() => import('./FilterPanel'), {
  loading: () => <div>Loading...</div>,
});
```

### 7.4 データ最適化

**JSONサイズ削減**:

- フィールド名を短縮（オプション）
- Gzip圧縮（Vercel自動）

**データ分割** (将来的):

```typescript
// data/streams-2025-02.json (月ごと)
// data/streams-2025-03.json
```

## 8. 実装フェーズ

### Phase 1: 基本機能（MVP）

**目標**: タイムテーブル表示

**タスク**:

1. ✅ プロジェクトセットアップ（Next.js, TypeScript, Tailwind）
2. ✅ 型定義作成
3. ✅ サンプルデータ作成（channels.json, streams.json, config.json）
4. ✅ データローダー実装
5. ✅ Timetableコンポーネント実装
   - TimeGrid
   - ChannelColumn
   - StreamCard
   - TimeLabel
6. ✅ 基本的なCSSスタイリング
7. ✅ 配信カードクリックで別タブ表示

**デプロイ**: Vercel

### Phase 2: データ取得・フィルタ機能

**目標**: 実データ取得、検索・フィルタ、マルチプラットフォーム対応

**タスク**:

1. ✅ Wikiスクレイピングスクリプト（YouTube + Twitch）
2. ✅ YouTube API連携スクリプト
3. ✅ Twitch API連携スクリプト
   - ✅ twitch-client.ts実装（OAuth2認証、VOD取得）
   - ✅ resolve-twitch-ids.ts実装（username → ID変換）
4. ✅ マルチプラットフォーム型定義（Channel、Stream）
5. ✅ プラットフォーム別UIスタイリング（青/紫）
6. ✅ GitHub Actions設定（定期実行）
7. ✅ SearchBar実装
8. ✅ FilterPanel実装（職業グループ絞り込み）
9. ✅ DatePicker実装（日時ジャンプ）
10. ✅ ヘッダー・時刻ラベルの固定

**デプロイ**: 実データでのテスト（YouTube + Twitch）

### Phase 3: パフォーマンス最適化

**目標**: 200チャンネル対応、快適な操作

**タスク**:

1. ✅ 仮想スクロール実装（@tanstack/react-virtual）
2. ✅ 画像遅延読み込み
3. ✅ データ分割（月ごとのJSON）
4. ✅ バンドルサイズ最適化
5. ✅ パフォーマンス計測（Lighthouse等）
6. ✅ レスポンシブ対応（タブレット）
7. ✅ ライブ配信バッジ表示

**デプロイ**: 本番リリース

### Phase 4: 拡張機能（オプション）

**タスク**:

- [ ] モバイル対応（リスト表示）
- [ ] ダークモード
- [ ] お気に入りチャンネル機能
- [ ] URL共有（特定日時・チャンネルへのリンク）
- [ ] 配信統計表示（最多配信者等）
- [x] Twitch対応（完了）

## 9. 開発環境セットアップ

### 9.1 環境変数

**.env.local** (開発用):

```bash
# YouTube Data API v3
YOUTUBE_API_KEY=your_api_key_here

# Twitch API (App Access Token)
TWITCH_CLIENT_ID=your_client_id_here
TWITCH_CLIENT_SECRET=your_client_secret_here
```

**.env.example** (テンプレート):

```bash
# YouTube Data API v3
YOUTUBE_API_KEY=

# Twitch API (App Access Token)
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

**GitHub Secrets** (本番用):

- `YOUTUBE_API_KEY`: YouTube API Key
- `TWITCH_CLIENT_ID`: Twitch Client ID
- `TWITCH_CLIENT_SECRET`: Twitch Client Secret

### 9.2 npm scripts

**package.json**:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "scrape:channels": "tsx scripts/scrape-channels.ts",
    "resolve:handles": "tsx scripts/resolve-handles.ts",
    "resolve:twitch-ids": "tsx scripts/resolve-twitch-ids.ts",
    "fetch:streams": "tsx scripts/fetch-streams.ts",
    "validate:data": "tsx scripts/validate-data.ts"
  }
}
```

### 9.3 開発フロー

```bash
# 1. リポジトリクローン
git clone https://github.com/your-repo/vcr-timetable.git
cd vcr-timetable

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .env.example .env.local
# .env.localにYouTube API KeyとTwitch認証情報を設定

# 4. サンプルデータ生成（初回のみ）
npm run scrape:channels       # チャンネルリスト取得
npm run resolve:handles        # YouTube @handle解決
npm run resolve:twitch-ids     # Twitch username解決
npm run fetch:streams          # 配信データ取得

# 5. 開発サーバー起動
npm run dev
# http://localhost:3000 でアクセス

# 6. ビルド
npm run build

# 7. 本番サーバー起動
npm start
```

## 10. テスト戦略

### 10.1 単体テスト

**対象**:

- ユーティリティ関数（time-utils, grid-calculator）
- データバリデーション

**ツール**: Vitest

### 10.2 統合テスト

**対象**:

- データ取得スクリプト
- APIクライアント

**ツール**: Vitest + MSW（APIモック）

### 10.3 E2Eテスト

**対象**:

- タイムテーブル表示
- 検索・フィルタ機能
- スクロール

**ツール**: Playwright（オプション）

### 10.4 パフォーマンステスト

**ツール**:

- Lighthouse（ページ読み込み速度）
- React DevTools Profiler（レンダリング性能）

## 11. デプロイ

### 11.1 Vercel設定

**vercel.json**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"]
}
```

### 11.2 GitHub Actions

**.github/workflows/update-streams.yml**:

```yaml
name: Update Stream Data

on:
  schedule:
    - cron: "0 */6 * * *" # 6時間ごと
  workflow_dispatch:

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Fetch streams
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
        run: npm run fetch:streams

      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/streams.json
          git diff --quiet && git diff --staged --quiet || git commit -m "Update streams data"

      - name: Push changes
        uses: ad-m/github-push-action@master
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          branch: main
```

**注意**: チャンネルリストは手動管理のため、自動更新ワークフローは不要です。

## 12. 運用

### 12.1 データ更新監視

- GitHub Actions の実行ログを確認
- エラー時はSlack/Email通知（オプション）

### 12.2 API Quota監視

- YouTube API Consoleでquota使用状況を確認
- 上限に近づいたらアラート

### 12.3 バックアップ

- Gitリポジトリでデータをバージョン管理
- 過去のデータも保持

## 13. まとめ

この設計書に基づき、以下の順序で実装を進めます：

1. **Phase 1**: プロジェクトセットアップ + MVP実装
2. **Phase 2**: データ取得スクリプト + 検索・フィルタ
3. **Phase 3**: パフォーマンス最適化
4. **Phase 4**: 拡張機能（オプション）

各フェーズの完了後、動作確認とレビューを行い、次フェーズに進みます。
