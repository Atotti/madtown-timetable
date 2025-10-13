export type Stream = {
  id: string; // UUID
  channelId: string; // チャンネルID
  platform: "youtube" | "twitch"; // プラットフォーム
  videoId: string; // 動画ID（YouTube: videoId, Twitch: videoId）
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
