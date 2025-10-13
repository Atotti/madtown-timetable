import axios from "axios";
import { config } from "dotenv";

config();

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET are required");
}

let accessToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * アプリアクセストークン取得（Client Credentials Flow）
 */
async function getAccessToken(): Promise<string> {
  // キャッシュが有効ならそれを返す
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
  profileImageUrl?: string;
} | null> {
  try {
    const token = await getAccessToken();
    const response = await axios.get("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": CLIENT_ID!,
        Authorization: `Bearer ${token}`,
      },
      params: {
        login,
      },
    });

    const users = response.data.data || [];
    if (users.length === 0) return null;

    const user = users[0];
    return {
      id: user.id,
      login: user.login,
      displayName: user.display_name,
      profileImageUrl: user.profile_image_url,
    };
  } catch (error) {
    console.error(`Error fetching user by login: ${login}`, error);
    return null;
  }
}

/**
 * ユーザーの動画（VOD）を取得
 */
export async function getUserVideos(
  userId: string,
  startDate: string,
  endDate: string,
  keywords: string[],
  gameIds: string[] = [],
): Promise<TwitchVideo[]> {
  const token = await getAccessToken();
  const startTs = new Date(startDate).getTime();
  const endTs = new Date(endDate).getTime();

  const videos: TwitchVideo[] = [];
  let cursor: string | undefined = undefined;

  // ページネーション
  while (true) {
    const params: any = {
      user_id: userId,
      first: 100,
      type: "archive", // VODのみ（highlightは除外）
    };
    if (cursor) params.after = cursor;

    const response = await axios.get("https://api.twitch.tv/helix/videos", {
      headers: {
        "Client-ID": CLIENT_ID!,
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    const items = response.data.data || [];
    if (items.length === 0) break;

    // 期間フィルタ
    for (const item of items) {
      const createdAt = new Date(item.created_at).getTime();

      if (createdAt < startTs) break; // 古すぎる動画に到達したら終了
      if (createdAt > endTs) continue; // 未来の動画はスキップ

      // キーワードフィルタ OR ゲームIDフィルタ
      const hasKeywords = keywords.length > 0;
      const hasGameIds = gameIds.length > 0;

      // フィルタが指定されていない場合は全て取得
      if (!hasKeywords && !hasGameIds) {
        videos.push({
          id: item.id,
          userId: item.user_id,
          title: item.title,
          description: item.description,
          createdAt: item.created_at,
          publishedAt: item.published_at,
          url: item.url,
          thumbnailUrl: item.thumbnail_url,
          viewCount: item.view_count,
          duration: item.duration, // "1h2m30s" 形式
        });
        continue;
      }

      // キーワードまたはゲームIDにマッチするかチェック
      const title = item.title || "";
      const titleMatched =
        hasKeywords &&
        keywords.some((kw) => title.toLowerCase().includes(kw.toLowerCase()));

      const gameMatched = hasGameIds && gameIds.includes(item.game_id);

      if (titleMatched || gameMatched) {
        videos.push({
          id: item.id,
          userId: item.user_id,
          title: item.title,
          description: item.description,
          createdAt: item.created_at,
          publishedAt: item.published_at,
          url: item.url,
          thumbnailUrl: item.thumbnail_url,
          viewCount: item.view_count,
          duration: item.duration, // "1h2m30s" 形式
        });
      }
    }

    cursor = response.data.pagination?.cursor;
    if (!cursor) break;

    await sleep(100); // レート制限対策
  }

  return videos;
}

export type TwitchVideo = {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
  publishedAt: string;
  url: string;
  thumbnailUrl: string;
  viewCount: number;
  duration: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Twitch duration ("1h2m30s") を秒に変換
 */
export function parseTwitchDuration(duration: string): number {
  const hours = duration.match(/(\d+)h/)?.[1] || "0";
  const minutes = duration.match(/(\d+)m/)?.[1] || "0";
  const seconds = duration.match(/(\d+)s/)?.[1] || "0";
  return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
}
