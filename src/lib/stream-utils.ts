import type { Stream } from "@/types";

type TimeRange = {
  start: number;
  end: number;
};

/**
 * 時間範囲の配列をマージして重複を排除
 */
function mergeTimeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length === 0) return [];

  // 開始時刻でソート
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: TimeRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // 重複または隣接している場合はマージ
    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
    } else {
      // 重複していない場合は新しい範囲として追加
      merged.push(current);
    }
  }

  return merged;
}

/**
 * チャンネルの実配信時間を計算（重複を排除）
 * 同時配信（YouTubeとTwitchで同じ時間帯）は1回分としてカウント
 */
export function calculateChannelDuration(
  channelId: string,
  streams: Stream[],
): number {
  // チャンネルの配信を取得
  const channelStreams = streams.filter((s) => s.channelId === channelId);

  // 時間範囲に変換
  const timeRanges: TimeRange[] = channelStreams
    .map((stream) => {
      if (!stream.endTime) return null;
      const start = new Date(stream.startTime).getTime();
      const end = new Date(stream.endTime).getTime();
      return { start, end };
    })
    .filter((range): range is TimeRange => range !== null);

  // 時間範囲をマージして重複を排除
  const merged = mergeTimeRanges(timeRanges);

  // マージ後の時間範囲の合計を秒単位で計算
  const totalDuration = merged.reduce(
    (total, range) => total + (range.end - range.start) / 1000,
    0,
  );

  return totalDuration;
}
