import { readJSON, writeJSON } from "./lib/file-utils";
import { getUserByLogin } from "./lib/twitch-client";
import type { Channel } from "../src/types/channel";

async function main() {
  console.log("=== Twitchユーザー名からユーザーIDへの変換 ===\n");

  // チャンネルリストを読み込み
  const data = await readJSON<{ channels: Channel[] }>("data/channels.json");
  const channels = data.channels;

  // twitchUserNameを持つチャンネルを抽出
  const twitchChannels = channels.filter(
    (ch): ch is Channel & { twitchUserName: string } => !!ch.twitchUserName,
  );

  console.log(
    `🔍 Twitchユーザー名が設定されているチャンネル数: ${twitchChannels.length}\n`,
  );

  if (twitchChannels.length === 0) {
    console.log("✅ 変換が必要なチャンネルはありません\n");
    return;
  }

  let resolvedCount = 0;
  let failedCount = 0;

  // 1件ずつ変換
  for (const channel of twitchChannels) {
    console.log(
      `[${resolvedCount + failedCount + 1}/${twitchChannels.length}] ${channel.name} (${channel.twitchUserName})`,
    );

    const userInfo = await getUserByLogin(channel.twitchUserName);

    if (userInfo) {
      console.log(
        `  ✅ 解決: ID=${userInfo.id}, DisplayName=${userInfo.displayName}`,
      );
      channel.twitchUserId = userInfo.id;
      resolvedCount++;
    } else {
      console.log(`  ❌ 解決失敗`);
      failedCount++;
    }

    // API Quota節約のため少し待機
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // 更新されたデータを保存
  await writeJSON("data/channels.json", data);

  console.log(`\n📊 結果:`);
  console.log(`   - 成功: ${resolvedCount}件`);
  console.log(`   - 失敗: ${failedCount}件`);
  console.log(`\n📁 保存先: data/channels.json\n`);
}

main().catch((error) => {
  console.error("❌ エラーが発生しました:", error);
  process.exit(1);
});
