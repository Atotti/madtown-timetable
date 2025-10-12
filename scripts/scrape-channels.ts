import { scrapeChannelsFromWiki } from './lib/wiki-scraper';
import { writeJSON } from './lib/file-utils';

async function main() {
  console.log('=== VCRGTA チャンネルリストスクレイピング ===\n');

  try {
    const channels = await scrapeChannelsFromWiki();

    console.log(`\n✅ ${channels.length}件のチャンネルを取得しました\n`);

    // data/channels.jsonに保存
    const output = {
      channels,
    };

    await writeJSON('data/channels.json', output);

    console.log('📁 保存先: data/channels.json');
    console.log('✓ チャンネル情報の取得が完了しました\n');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
