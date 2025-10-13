import { google, youtube_v3 } from "googleapis";
import type { GaxiosResponse } from "gaxios";
import { config } from "dotenv";

// .envファイルを読み込み
config();

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  throw new Error("YOUTUBE_API_KEY environment variable is not set");
}

const youtube = google.youtube({
  version: "v3",
  auth: API_KEY,
});

/**
 * チャンネル詳細を取得
 */
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

/**
 * チャンネルの uploads プレイリストIDを取得（1ユニット）
 */
async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const res = await youtube.channels.list({
    part: ["contentDetails"],
    id: [channelId],
  });
  const uploads =
    res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error(`uploads playlist not found for ${channelId}`);
  return uploads;
}

/**
 * uploads プレイリストから期間＋キーワードで videoId を抽出（1ユニット/ページ）
 */
async function listVideoIdsFromUploads(
  channelId: string,
  keywords: string[],
  publishedAfter: string,
  publishedBefore: string,
  maxPages = 50,
): Promise<string[]> {
  const uploadsId = await getUploadsPlaylistId(channelId);
  const afterTs = new Date(publishedAfter).getTime();
  const beforeTs = new Date(publishedBefore).getTime();

  const vids: string[] = [];
  let pageToken: string | undefined = undefined;
  let pages = 0;

  // 大文字小文字を無視する簡易ORマッチ
  const tests = keywords.map(
    (kw) => new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
  );

  while (pages < maxPages) {
    const resp: any = await youtube.playlistItems.list({
      part: ["contentDetails", "snippet"],
      playlistId: uploadsId,
      maxResults: 50,
      pageToken,
    });
    pages++;

    const items = resp.data.items ?? [];
    if (items.length === 0) break;

    // 古い動画まで到達したら終了（uploadsは新しい順）
    let pageHasOnlyOld = true;

    for (const it of items) {
      const vid = it.contentDetails?.videoId;
      const published =
        it.contentDetails?.videoPublishedAt || it.snippet?.publishedAt;
      if (!vid || !published) continue;

      const ts = new Date(published).getTime();
      if (ts >= afterTs) pageHasOnlyOld = false;

      // 期間外ならスキップ
      if (ts < afterTs || ts > beforeTs) continue;

      // キーワードマッチ
      const title = it.snippet?.title || "";
      const matched =
        tests.length === 0 ? true : tests.some((re) => re.test(title));
      if (matched) vids.push(vid);
    }

    if (!resp.data.nextPageToken || pageHasOnlyOld) break;
    pageToken = resp.data.nextPageToken;
    await sleep(100);
  }

  return Array.from(new Set(vids)); // 重複除去
}

/**
 * チャンネルの配信を検索（uploads プレイリスト方式）
 */
export async function searchStreams(
  channelId: string,
  keywords: string[],
  publishedAfter: string,
  publishedBefore: string,
): Promise<youtube_v3.Schema$SearchResult[]> {
  const videoIds = await listVideoIdsFromUploads(
    channelId,
    keywords,
    publishedAfter,
    publishedBefore,
  );

  // fetch-streams.ts は id.videoId を見るだけなので最低限でOK
  return videoIds.map((id) => ({
    id: { kind: "youtube#video", videoId: id },
  })) as youtube_v3.Schema$SearchResult[];
}

/**
 * 動画詳細を取得（liveStreamingDetails含む）
 */
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
    try {
      const response = await youtube.videos.list({
        part: [
          "snippet",
          "liveStreamingDetails",
          "statistics",
          "contentDetails",
        ],
        id: batch,
      });

      if (response.data.items) {
        allVideos.push(...response.data.items);
      }

      // API Quota節約のため少し待機
      await sleep(100);
    } catch (error) {
      console.error("Error fetching video details:", error);
    }
  }

  return allVideos;
}

/**
 * スリープ
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
