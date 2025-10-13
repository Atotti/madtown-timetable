import type { Stream } from "../../src/types/stream";

/**
 * ストリームのユニークキーを生成
 * platform + videoId の組み合わせでユニーク性を保証
 */
function getStreamKey(stream: Stream): string {
  return `${stream.platform}:${stream.videoId}`;
}

/**
 * 既存ストリームと新規ストリームをマージ
 * - 重複する場合は新しいデータで更新
 * - 既存データは保持
 * - 新規データを追加
 *
 * @param existingStreams 既存のストリーム配列
 * @param newStreams 新しく取得したストリーム配列
 * @returns マージ後のストリーム配列
 */
export function mergeStreams(
  existingStreams: Stream[],
  newStreams: Stream[],
): Stream[] {
  // 既存データをMapに変換（高速検索用）
  const streamMap = new Map<string, Stream>();

  // 既存データを登録
  for (const stream of existingStreams) {
    const key = getStreamKey(stream);
    streamMap.set(key, stream);
  }

  // 新規データでマージ
  for (const newStream of newStreams) {
    const key = getStreamKey(newStream);
    const existing = streamMap.get(key);

    if (existing) {
      // 既存データがある場合は更新
      streamMap.set(key, mergeStreamData(existing, newStream));
    } else {
      // 新規データの場合は追加
      streamMap.set(key, newStream);
    }
  }

  // Map を配列に変換
  return Array.from(streamMap.values());
}

/**
 * 2つのストリームデータをマージ
 * 新しいデータを優先しつつ、一部フィールドは既存データを保持
 *
 * @param existing 既存のストリームデータ
 * @param newData 新しく取得したストリームデータ
 * @returns マージ後のストリームデータ
 */
function mergeStreamData(existing: Stream, newData: Stream): Stream {
  return {
    ...existing, // 既存データをベースに
    ...newData, // 新しいデータで上書き
    // 特別な処理が必要なフィールド
    id: existing.id, // IDは既存のものを保持
    endTime: newData.endTime || existing.endTime, // 終了時刻は新規データ優先だが、undefined の場合は既存を保持
    viewCount: newData.viewCount, // 視聴回数は常に新しい値
    isLive: newData.isLive, // 配信状態は常に新しい値
  };
}

/**
 * マージ結果の統計情報を取得
 */
export function getMergeStats(
  existingStreams: Stream[],
  newStreams: Stream[],
  mergedStreams: Stream[],
): {
  existingCount: number;
  newCount: number;
  addedCount: number;
  updatedCount: number;
  totalCount: number;
} {
  const existingKeys = new Set(existingStreams.map(getStreamKey));
  const newKeys = new Set(newStreams.map(getStreamKey));

  // 追加されたストリーム数
  const addedCount = newStreams.filter(
    (s) => !existingKeys.has(getStreamKey(s)),
  ).length;

  // 更新されたストリーム数
  const updatedCount = newStreams.filter((s) =>
    existingKeys.has(getStreamKey(s)),
  ).length;

  return {
    existingCount: existingStreams.length,
    newCount: newStreams.length,
    addedCount,
    updatedCount,
    totalCount: mergedStreams.length,
  };
}
