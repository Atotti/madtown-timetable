export type Channel = {
  id: string;                    // UUID
  name: string;                  // チャンネル名
  youtubeChannelId: string;      // YouTubeチャンネルID
  youtubeHandle?: string;        // @ハンドル
  avatarUrl: string;             // アイコン画像URL
  job?: string;                  // 職業
  totalViews?: number;           // 総再生回数
};

export type ChannelsData = {
  channels: Channel[];
};
