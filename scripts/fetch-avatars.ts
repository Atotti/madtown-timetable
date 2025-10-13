import { readJSON, writeJSON } from "./lib/file-utils";
import { getChannelDetails } from "./lib/youtube-client";
import { getUserByLogin } from "./lib/twitch-client";
import type { Channel } from "../src/types/channel";

async function main() {
  console.log("=== チャンネルアイコン取得 ===\n");

  // チャンネルリストを読み込み
  const data = await readJSON<{ channels: Channel[] }>("data/channels.json");
  const channels = data.channels;

  console.log(`📺 ${channels.length}件のチャンネルを処理します\n`);

  let youtubeCount = 0;
  let twitchCount = 0;
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < channels.length; i++) {
    const channel = channels[i];
    console.log(`[${i + 1}/${channels.length}] ${channel.name}`);

    let avatarUrl = "";

    // Twitch アイコン取得（優先）
    if (channel.twitchUserName) {
      try {
        console.log(`  Twitch: アイコン取得中...`);
        const userInfo = await getUserByLogin(channel.twitchUserName);

        if (userInfo && userInfo.profileImageUrl) {
          avatarUrl = userInfo.profileImageUrl;
          console.log(`  ✅ Twitch: アイコン取得成功`);
          twitchCount++;
        } else {
          console.log(`  ⚠️  Twitch: アイコンURLが見つかりません`);
        }

        // API Quota節約のため待機
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`  ❌ Twitch エラー:`, error);
      }
    }

    // YouTube アイコン取得（Twitchで取得できなかった場合のフォールバック）
    if (
      !avatarUrl &&
      channel.youtubeChannelId &&
      !channel.youtubeChannelId.startsWith("@")
    ) {
      try {
        console.log(`  YouTube: アイコン取得中（フォールバック）...`);
        const channelDetails = await getChannelDetails(
          channel.youtubeChannelId,
        );
        avatarUrl =
          channelDetails.snippet?.thumbnails?.default?.url ||
          channelDetails.snippet?.thumbnails?.medium?.url ||
          "";

        if (avatarUrl) {
          console.log(`  ✅ YouTube: アイコン取得成功`);
          youtubeCount++;
        } else {
          console.log(`  ⚠️  YouTube: アイコンURLが見つかりません`);
        }

        // API Quota節約のため待機
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`  ❌ YouTube エラー:`, error);
      }
    }

    // アバターURLを更新
    if (avatarUrl) {
      channel.avatarUrl = avatarUrl;
      successCount++;
      console.log(`  └─ 保存: ${avatarUrl.substring(0, 60)}...`);
    } else {
      failedCount++;
      console.log(`  └─ アイコン取得失敗`);
    }

    console.log("");
  }

  // 更新されたデータを保存
  await writeJSON("data/channels.json", data);

  console.log("\n📊 結果:");
  console.log(`   - YouTube: ${youtubeCount}件`);
  console.log(`   - Twitch: ${twitchCount}件`);
  console.log(`   - 成功: ${successCount}件`);
  console.log(`   - 失敗: ${failedCount}件`);
  console.log(`\n📁 保存先: data/channels.json\n`);
}

main().catch((error) => {
  console.error("❌ エラーが発生しました:", error);
  process.exit(1);
});
