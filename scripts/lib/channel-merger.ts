import type { Channel } from "../../src/types/channel";
import type { WikiChannel } from "./wiki-scraper";

/**
 * チャンネルのユニークキーを生成
 * name + youtubeChannelId の組み合わせでユニーク性を保証
 * youtubeChannelIdがない場合はnameのみ
 */
function getChannelKey(channel: Channel | WikiChannel): string {
  const youtubeId =
    "youtubeChannelId" in channel ? channel.youtubeChannelId : "";
  return youtubeId ? `${channel.name}:${youtubeId}` : channel.name;
}

/**
 * 既存チャンネルと新規チャンネル（Wiki）をマージ
 * - 既存チャンネル: API取得情報（avatarUrl, 解決済みID等）を保持し、Wiki情報（name, job, organization）を更新
 * - 新規チャンネル: Wikiからそのまま追加
 *
 * @param existingChannels 既存のチャンネル配列
 * @param wikiChannels Wikiから取得したチャンネル配列
 * @returns マージ後のチャンネル配列
 */
export function mergeChannels(
  existingChannels: Channel[],
  wikiChannels: WikiChannel[],
): Channel[] {
  // 既存データをMapに変換（高速検索用）
  const channelMap = new Map<string, Channel>();

  // 既存データを登録
  for (const channel of existingChannels) {
    const key = getChannelKey(channel);
    channelMap.set(key, channel);
  }

  // Wikiデータでマージ
  for (const wikiChannel of wikiChannels) {
    const key = getChannelKey(wikiChannel);
    const existing = channelMap.get(key);

    if (existing) {
      // 既存データがある場合は更新
      channelMap.set(key, mergeChannelData(existing, wikiChannel));
    } else {
      // 新規データの場合は追加
      channelMap.set(key, convertWikiChannelToChannel(wikiChannel));
    }
  }

  // Map を配列に変換
  return Array.from(channelMap.values());
}

/**
 * 2つのチャンネルデータをマージ
 * API取得情報を保持しつつ、Wiki情報を更新
 *
 * @param existing 既存のチャンネルデータ
 * @param wikiData Wikiから取得したチャンネルデータ
 * @returns マージ後のチャンネルデータ
 */
function mergeChannelData(existing: Channel, wikiData: WikiChannel): Channel {
  // youtubeChannelIdの処理: UCで始まる解決済みIDは保持、@handleは更新
  const isResolvedYoutubeId =
    existing.youtubeChannelId && existing.youtubeChannelId.startsWith("UC");
  const youtubeChannelId = isResolvedYoutubeId
    ? existing.youtubeChannelId
    : wikiData.youtubeChannelId || undefined;

  // @handleの処理
  const isWikiHandle = wikiData.youtubeChannelId?.startsWith("@");
  const youtubeHandle = isWikiHandle
    ? wikiData.youtubeChannelId
    : existing.youtubeHandle;

  return {
    id: existing.id, // IDは既存のものを保持
    name: wikiData.name, // Wikiから更新
    youtubeChannelId,
    youtubeHandle,
    twitchUserId: existing.twitchUserId, // 既存のtwitchUserIdを保持
    twitchUserName: wikiData.twitchUserName, // Wikiから更新
    avatarUrl: existing.avatarUrl || wikiData.avatarUrl, // 既存のavatarUrlを保持（空の場合はWikiから）
    job: wikiData.job, // Wikiから更新
    organization: wikiData.organization, // Wikiから更新
    totalViews: existing.totalViews, // 既存の値を保持
  };
}

/**
 * WikiChannelをChannelに変換
 *
 * @param wikiChannel Wikiから取得したチャンネルデータ
 * @returns Channelデータ
 */
function convertWikiChannelToChannel(wikiChannel: WikiChannel): Channel {
  const isHandle = wikiChannel.youtubeChannelId?.startsWith("@");

  return {
    id: wikiChannel.id,
    name: wikiChannel.name,
    youtubeChannelId: isHandle ? undefined : wikiChannel.youtubeChannelId,
    youtubeHandle: isHandle ? wikiChannel.youtubeChannelId : undefined,
    twitchUserName: wikiChannel.twitchUserName,
    avatarUrl: wikiChannel.avatarUrl,
    job: wikiChannel.job,
    organization: wikiChannel.organization,
    totalViews: wikiChannel.totalViews || undefined,
  };
}

/**
 * マージ結果の統計情報を取得
 */
export function getMergeStats(
  existingChannels: Channel[],
  wikiChannels: WikiChannel[],
  mergedChannels: Channel[],
): {
  existingCount: number;
  wikiCount: number;
  addedCount: number;
  updatedCount: number;
  totalCount: number;
} {
  const existingKeys = new Set(existingChannels.map(getChannelKey));
  const wikiKeys = new Set(wikiChannels.map(getChannelKey));

  // 追加されたチャンネル数
  const addedCount = wikiChannels.filter(
    (ch) => !existingKeys.has(getChannelKey(ch)),
  ).length;

  // 更新されたチャンネル数
  const updatedCount = wikiChannels.filter((ch) =>
    existingKeys.has(getChannelKey(ch)),
  ).length;

  return {
    existingCount: existingChannels.length,
    wikiCount: wikiChannels.length,
    addedCount,
    updatedCount,
    totalCount: mergedChannels.length,
  };
}
