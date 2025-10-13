import { promises as fs } from "fs";

export type WikiChannel = {
  id: string;
  name: string;
  youtubeChannelId: string;
  twitchUserName?: string;
  avatarUrl: string;
  job?: string;
  organization?: string;
  totalViews: number;
};

type RowData = {
  name: string;
  job: string;
  organization: string;
};

/**
 * data/raw.htmlからチャンネルリストをスクレイピング
 * コメントベースのパース方式（<!--N-M--> 形式）
 *
 * @param startIdCounter 開始ID番号（デフォルト: 1）
 */
export async function scrapeChannelsFromWiki(
  startIdCounter: number = 1,
): Promise<WikiChannel[]> {
  console.log("data/raw.html からチャンネル情報を読み込み中...");

  const html = await fs.readFile("data/raw.html", "utf-8");

  const channels: WikiChannel[] = [];
  let idCounter = startIdCounter;
  const seenRows = new Set<number>();
  const seenChannelIds = new Set<string>();
  let duplicateCount = 0;
  let noYoutubeLinkCount = 0;

  // テーブル行を抽出 (<!--N-M--> の形式でコメントとその後のtdタグ)
  const rows = new Map<number, RowData>(); // rowNum -> { name, job, organization }
  const rowYoutubeIds = new Map<number, string>(); // rowNum -> youtubeChannelId
  const rowTwitchUsernames = new Map<number, string>(); // rowNum -> twitchUserName

  // <!--N-M--> とその後のtdタグをペアで抽出（複数行にまたがる可能性あり）
  const cellPattern = /<!--(\d+)-(\d+)-->\s*<td[^>]*>([\s\S]*?)<\/td>/g;
  let match;

  while ((match = cellPattern.exec(html)) !== null) {
    const rowNum = parseInt(match[1]);
    const colNum = parseInt(match[2]);
    const tdContent = match[3];

    // ヘッダー行（行0）はスキップ
    if (rowNum === 0) continue;

    // 行データを初期化
    if (!rows.has(rowNum)) {
      rows.set(rowNum, { name: "", job: "", organization: "" });
    }

    const rowData = rows.get(rowNum)!;

    // カラムごとに処理
    if (colNum === 0) {
      // 名前 (font-size:0pxのspanタグ内のテキストを除去)
      let nameContent = tdContent.replace(
        /<span[^>]*font-size:\s*0px[^>]*>[\s\S]*?<\/span\s*>/gi,
        "",
      );
      rowData.name = nameContent.replace(/<[^>]*>/g, "").trim();
    } else if (colNum === 1) {
      // 職業
      rowData.job = tdContent
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    } else if (colNum === 2) {
      // 組織名
      rowData.organization = tdContent
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
    } else if (colNum === 4) {
      // 主な活動場所（YouTubeリンク、Twitchリンク）
      const youtubeMatch = tdContent.match(
        /youtube\.com\/(channel\/([^"'\s<>]+)|@([^"'\s<>]+))/,
      );
      if (youtubeMatch) {
        const channelId = youtubeMatch[2] || `@${youtubeMatch[3]}`;
        rowYoutubeIds.set(rowNum, channelId);
      }

      const twitchMatch = tdContent.match(/twitch\.tv\/([^"'\s<>]+)/);
      if (twitchMatch) {
        rowTwitchUsernames.set(rowNum, twitchMatch[1]);
      }
    }
  }

  // 全ての行を処理
  let skippedEmptyNames = 0;
  for (const [rowNum, rowData] of rows) {
    const youtubeChannelId = rowYoutubeIds.get(rowNum) || "";
    const twitchUserName = rowTwitchUsernames.get(rowNum);

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
      id: `ch-${String(idCounter).padStart(3, "0")}`,
      name: rowData.name || "",
      youtubeChannelId: youtubeChannelId,
      twitchUserName: twitchUserName,
      avatarUrl: "",
      job: rowData.job || "",
      organization: rowData.organization || "",
      totalViews: 0,
    });

    idCounter++;
  }

  const twitchCount = channels.filter((ch) => ch.twitchUserName).length;

  console.log(`\n📊 統計情報:`);
  console.log(`   - 処理された行数: ${rows.size}`);
  console.log(`   - 名前が空でスキップ: ${skippedEmptyNames}`);
  console.log(`   - 取得したチャンネル数: ${channels.length}`);
  console.log(`   - 重複スキップ: ${duplicateCount}`);
  console.log(`   - YouTubeリンクなし: ${noYoutubeLinkCount}`);
  console.log(`   - Twitchリンクあり: ${twitchCount}`);

  // 名前順でソート
  channels.sort((a, b) => a.name.localeCompare(b.name, "ja"));

  return channels;
}
