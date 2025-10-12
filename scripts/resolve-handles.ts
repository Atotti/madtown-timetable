import { readJSON, writeJSON } from './lib/file-utils';
import { google } from 'googleapis';
import type { Channel } from '../src/types/channel';

const API_KEY = process.env.YOUTUBE_API_KEY;

if (!API_KEY) {
  throw new Error('YOUTUBE_API_KEY environment variable is not set');
}

const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY,
});

/**
 * @handleからチャンネルIDを解決
 */
async function resolveHandle(handle: string): Promise<string | null> {
  try {
    // @を除去
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;

    const response = await youtube.channels.list({
      part: ['id'],
      forHandle: cleanHandle,
    });

    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id || null;
    }

    return null;
  } catch (error) {
    console.error(`  ❌ エラー: ${handle}`, error);
    return null;
  }
}

async function main() {
  console.log('=== @handleからチャンネルIDへの変換 ===\n');

  // チャンネルリストを読み込み
  const data = await readJSON<{ channels: Channel[] }>('data/channels.json');
  const channels = data.channels;

  // @handleを持つチャンネルを抽出
  const handleChannels = channels.filter((ch) =>
    ch.youtubeChannelId.startsWith('@')
  );

  console.log(`🔍 @handle形式のチャンネル数: ${handleChannels.length}\n`);

  if (handleChannels.length === 0) {
    console.log('✅ 変換が必要なチャンネルはありません\n');
    return;
  }

  let resolvedCount = 0;
  let failedCount = 0;

  // 1件ずつ変換
  for (const channel of handleChannels) {
    console.log(`[${resolvedCount + failedCount + 1}/${handleChannels.length}] ${channel.name} (${channel.youtubeChannelId})`);

    const channelId = await resolveHandle(channel.youtubeChannelId);

    if (channelId) {
      console.log(`  ✅ 解決: ${channelId}`);
      channel.youtubeChannelId = channelId;
      resolvedCount++;
    } else {
      console.log(`  ❌ 解決失敗`);
      failedCount++;
    }

    // API Quota節約のため少し待機
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // 更新されたデータを保存
  await writeJSON('data/channels.json', data);

  console.log(`\n📊 結果:`);
  console.log(`   - 成功: ${resolvedCount}件`);
  console.log(`   - 失敗: ${failedCount}件`);
  console.log(`\n📁 保存先: data/channels.json\n`);
}

main().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
