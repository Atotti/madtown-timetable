import { readJSON, writeJSON } from './lib/file-utils';
import { searchStreams, getVideoDetails } from './lib/youtube-client';
import type { Channel } from '../src/types/channel';
import type { Stream, StreamsData } from '../src/types/stream';
import type { Config } from '../src/types/config';

async function main() {
  console.log('=== VCRGTA 配信データ取得 ===\n');

  // 設定とチャンネルリストを読み込み
  const config: Config = await readJSON('data/config.json');
  const channelsData = await readJSON<{ channels: Channel[] }>('data/channels.json');
  const allChannels = channelsData.channels;

  // YouTubeチャンネルIDが設定されているチャンネルのみ
  const validChannels = allChannels.filter((ch) => ch.youtubeChannelId);

  // 環境変数でテストモードを指定（デフォルト: 5チャンネル）
  const testLimit = process.env.TEST_LIMIT ? parseInt(process.env.TEST_LIMIT) : 5;
  const channels = validChannels.slice(0, testLimit);

  console.log(`📺 全チャンネル数: ${allChannels.length} (有効: ${validChannels.length})`);
  console.log(`🧪 テストモード: ${channels.length}チャンネルのみ処理`);
  console.log(`📅 期間: ${config.event.startDate} 〜 ${config.event.endDate}`);
  console.log(`🔍 キーワード: ${config.filters.titleKeywords.join(', ')}\n`);

  const allStreams: Stream[] = [];
  let processedCount = 0;

  // チャンネルごとに配信検索
  for (const channel of channels) {
    processedCount++;
    console.log(`[${processedCount}/${channels.length}] ${channel.name} を処理中...`);

    try {
      // 検索
      const searchResults = await searchStreams(
        channel.youtubeChannelId,
        config.filters.titleKeywords,
        config.event.startDate,
        config.event.endDate
      );

      const videoIds = searchResults
        .map((r) => r.id?.videoId)
        .filter((id): id is string => !!id);

      if (videoIds.length === 0) {
        console.log(`  └─ 配信なし`);
        continue;
      }

      // 詳細取得
      const videos = await getVideoDetails(videoIds);

      // liveStreamingDetailsが存在し、actualStartTimeがあるもののみ（ライブ配信）
      const liveVideos = videos.filter(
        (v) => v.liveStreamingDetails?.actualStartTime
      );

      if (liveVideos.length === 0) {
        console.log(`  └─ ライブ配信なし（通常動画: ${videos.length}件）`);
        continue;
      }

      console.log(`  └─ ${liveVideos.length}件のライブ配信を発見`);

      // Streamオブジェクトに変換
      for (const video of liveVideos) {
        const liveDetails = video.liveStreamingDetails!;
        const actualStart = liveDetails.actualStartTime;
        const actualEnd = liveDetails.actualEndTime;

        if (!actualStart) continue; // まだ開始していない

        allStreams.push({
          id: `stream-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          channelId: channel.id,
          videoId: video.id!,
          title: video.snippet?.title || '',
          thumbnailUrl: video.snippet?.thumbnails?.medium?.url || '',
          startTime: actualStart,
          endTime: actualEnd || undefined,
          scheduledStartTime: liveDetails.scheduledStartTime || undefined,
          duration: actualEnd
            ? Math.floor(
                (new Date(actualEnd).getTime() - new Date(actualStart).getTime()) / 1000
              )
            : undefined,
          isLive: !actualEnd, // 終了時刻がなければ配信中
          viewCount: parseInt(video.statistics?.viewCount || '0'),
        });
      }
    } catch (error) {
      console.error(`  └─ エラー:`, error);
    }
  }

  // 開始時刻でソート
  allStreams.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // streams.jsonに保存
  const streamsData: StreamsData = {
    period: {
      start: config.event.startDate,
      end: config.event.endDate,
    },
    streams: allStreams,
  };

  await writeJSON('data/streams.json', streamsData);

  console.log(`\n✅ ${allStreams.length}件の配信データを保存しました`);
  console.log('📁 保存先: data/streams.json\n');
}

main().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
