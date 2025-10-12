import { google, youtube_v3 } from 'googleapis';
import { config } from 'dotenv';

// .envファイルを読み込み
config();

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  throw new Error('YOUTUBE_API_KEY environment variable is not set');
}

const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY,
});

/**
 * チャンネル詳細を取得
 */
export async function getChannelDetails(
  channelId: string
): Promise<youtube_v3.Schema$Channel> {
  const response = await youtube.channels.list({
    part: ['snippet', 'statistics'],
    id: [channelId],
  });

  if (!response.data.items || response.data.items.length === 0) {
    throw new Error(`Channel not found: ${channelId}`);
  }

  return response.data.items[0];
}

/**
 * チャンネルの配信を検索
 */
export async function searchStreams(
  channelId: string,
  keywords: string[],
  publishedAfter: string,
  publishedBefore: string
): Promise<youtube_v3.Schema$SearchResult[]> {
  const results: youtube_v3.Schema$SearchResult[] = [];

  for (const keyword of keywords) {
    try {
      const response = await youtube.search.list({
        part: ['id'],
        channelId,
        q: keyword,
        type: ['video'],
        publishedAfter,
        publishedBefore,
        maxResults: 50,
        order: 'date',
      });

      if (response.data.items) {
        results.push(...response.data.items);
      }

      // API Quota節約のため少し待機
      await sleep(100);
    } catch (error) {
      console.error(`Error searching for keyword "${keyword}":`, error);
    }
  }

  // 重複除去
  const uniqueResults = Array.from(
    new Map(results.map((r) => [r.id?.videoId, r])).values()
  );

  return uniqueResults;
}

/**
 * 動画詳細を取得（liveStreamingDetails含む）
 */
export async function getVideoDetails(
  videoIds: string[]
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
        part: ['snippet', 'liveStreamingDetails', 'statistics', 'contentDetails'],
        id: batch,
      });

      if (response.data.items) {
        allVideos.push(...response.data.items);
      }

      // API Quota節約のため少し待機
      await sleep(100);
    } catch (error) {
      console.error('Error fetching video details:', error);
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
