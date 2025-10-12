import { promises as fs } from 'fs';

export type WikiChannel = {
  id: string;
  name: string;
  youtubeChannelId: string;
  avatarUrl: string;
  job?: string;
  totalViews: number;
};

type RowData = {
  name: string;
  job: string;
};

/**
 * data/raw.htmlからチャンネルリストをスクレイピング
 * コメントベースのパース方式（<!--N-M--> 形式）
 */
export async function scrapeChannelsFromWiki(): Promise<WikiChannel[]> {
  console.log('data/raw.html からチャンネル情報を読み込み中...');

  const html = await fs.readFile('data/raw.html', 'utf-8');

  const channels: WikiChannel[] = [];
  let idCounter = 1;
  const seenRows = new Set<number>();
  const seenChannelIds = new Set<string>();
  let duplicateCount = 0;
  let noYoutubeLinkCount = 0;

  // テーブル行を抽出 (<!--N-M--> の形式でコメントがある行)
  const lines = html.split('\n');
  const rows = new Map<number, RowData>(); // rowNum -> { name, job }
  const rowYoutubeIds = new Map<number, string>(); // rowNum -> youtubeChannelId

  for (const line of lines) {
    // <!--N-M--> の形式のコメントを探す
    const commentMatch = line.match(/<!--(\d+)-(\d+)-->/);
    if (!commentMatch) continue;

    const rowNum = parseInt(commentMatch[1]);
    const colNum = parseInt(commentMatch[2]);

    // ヘッダー行（行0）はスキップ
    if (rowNum === 0) continue;

    // tdタグの内容を抽出
    const tdMatch = line.match(/<td[^>]*>([\s\S]*?)<\/td>/);
    if (!tdMatch) continue;

    const tdContent = tdMatch[1];

    // 行データを初期化
    if (!rows.has(rowNum)) {
      rows.set(rowNum, { name: '', job: '' });
    }

    const rowData = rows.get(rowNum)!;

    // カラムごとに処理
    if (colNum === 0) {
      // 名前 (font-size:0pxのspanタグ内のテキストを除去)
      let nameContent = tdContent.replace(/<span[^>]*font-size:\s*0px[^>]*>[\s\S]*?<\/span>/gi, '');
      rowData.name = nameContent.replace(/<[^>]*>/g, '').trim();
    } else if (colNum === 1) {
      // 職業
      rowData.job = tdContent.replace(/<[^>]*>/g, '').trim();
    } else if (colNum === 4) {
      // 主な活動場所（YouTubeリンク）
      const youtubeMatch = tdContent.match(/youtube\.com\/(channel\/([^"'\s<>]+)|@([^"'\s<>]+))/);

      if (youtubeMatch) {
        const channelId = youtubeMatch[2] || `@${youtubeMatch[3]}`;
        rowYoutubeIds.set(rowNum, channelId);
      }
    }
  }

  // 全ての行を処理
  let skippedEmptyNames = 0;
  for (const [rowNum, rowData] of rows) {
    const youtubeChannelId = rowYoutubeIds.get(rowNum) || '';

    // 名前が空の行はスキップ
    if (!rowData.name) {
      skippedEmptyNames++;
      continue;
    }

    // 重複チェック（YouTubeチャンネルIDがある場合のみ）
    if (youtubeChannelId && seenChannelIds.has(youtubeChannelId)) {
      duplicateCount++;
      continue;
    }

    if (youtubeChannelId) {
      seenChannelIds.add(youtubeChannelId);
    } else {
      noYoutubeLinkCount++;
    }

    channels.push({
      id: `ch-${String(idCounter).padStart(3, '0')}`,
      name: rowData.name || '',
      youtubeChannelId: youtubeChannelId,
      avatarUrl: '',
      job: rowData.job || '',
      totalViews: 0,
    });

    idCounter++;
  }

  console.log(`\n📊 統計情報:`);
  console.log(`   - 処理された行数: ${rows.size}`);
  console.log(`   - 名前が空でスキップ: ${skippedEmptyNames}`);
  console.log(`   - 取得したチャンネル数: ${channels.length}`);
  console.log(`   - 重複スキップ: ${duplicateCount}`);
  console.log(`   - YouTubeリンクなし: ${noYoutubeLinkCount}`);

  // 名前順でソート
  channels.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

  return channels;
}
