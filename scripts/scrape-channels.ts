import { scrapeChannelsFromWiki } from "./lib/wiki-scraper";
import { readJSON, writeJSON } from "./lib/file-utils";
import { mergeChannels, getMergeStats } from "./lib/channel-merger";
import type { Channel, ChannelsData } from "../src/types/channel";
import { existsSync } from "fs";

async function main() {
  console.log("=== VCRGTA チャンネルリストスクレイピング ===\n");

  try {
    // 既存データを読み込み
    let existingChannels: Channel[] = [];
    const channelsPath = "data/channels.json";
    if (existsSync(channelsPath)) {
      try {
        const existingData = await readJSON<ChannelsData>(channelsPath);
        existingChannels = existingData.channels || [];
        console.log(
          `📂 既存データ: ${existingChannels.length}件のチャンネルを読み込みました\n`,
        );
      } catch (error) {
        console.warn("⚠️  既存データの読み込みに失敗しました。新規作成します。\n");
      }
    } else {
      console.log("📂 既存データなし。新規作成します。\n");
    }

    // 既存データから最大ID番号を取得
    let maxIdNumber = 0;
    for (const channel of existingChannels) {
      const idMatch = channel.id.match(/^ch-(\d+)$/);
      if (idMatch) {
        const idNum = parseInt(idMatch[1]);
        if (idNum > maxIdNumber) {
          maxIdNumber = idNum;
        }
      }
    }
    console.log(`📊 既存データの最大ID: ch-${String(maxIdNumber).padStart(3, "0")}\n`);

    // Wikiからチャンネル情報を取得（既存最大ID+1から開始）
    const wikiChannels = await scrapeChannelsFromWiki(maxIdNumber + 1);

    console.log(`\n✅ ${wikiChannels.length}件のチャンネルを取得しました\n`);

    // 既存データと新規データをマージ
    console.log("=== データマージ処理 ===");
    const mergedChannels = mergeChannels(existingChannels, wikiChannels);

    // マージ統計を表示
    const stats = getMergeStats(existingChannels, wikiChannels, mergedChannels);
    console.log(`📊 マージ統計:`);
    console.log(`  - 既存データ: ${stats.existingCount}件`);
    console.log(`  - Wiki取得: ${stats.wikiCount}件`);
    console.log(`  - 追加: ${stats.addedCount}件`);
    console.log(`  - 更新: ${stats.updatedCount}件`);
    console.log(`  - 合計: ${stats.totalCount}件\n`);

    // data/channels.jsonに保存
    const output: ChannelsData = {
      channels: mergedChannels,
    };

    await writeJSON("data/channels.json", output);

    console.log("📁 保存先: data/channels.json");
    console.log("✓ チャンネル情報の取得が完了しました\n");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
