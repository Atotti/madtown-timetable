import {
  parseISO,
  differenceInMinutes,
  differenceInHours,
  format,
  startOfDay,
  addHours,
  addMinutes,
  isWithinInterval
} from 'date-fns';

/**
 * ISO 8601文字列をDateオブジェクトに変換
 */
export function parseTime(isoString: string): Date {
  return parseISO(isoString);
}

/**
 * 2つの時刻の差分を分単位で取得
 */
export function getMinutesDiff(start: string, end: string): number {
  return differenceInMinutes(parseISO(end), parseISO(start));
}

/**
 * 2つの時刻の差分を時間単位で取得
 */
export function getHoursDiff(start: Date, end: Date): number {
  return Math.ceil(differenceInHours(end, start));
}

/**
 * 時刻をフォーマット
 */
export function formatTime(date: Date, formatString: string = 'HH:mm'): string {
  return format(date, formatString);
}

/**
 * 指定時刻の0時を取得
 */
export function getDayStart(date: Date): Date {
  return startOfDay(date);
}

/**
 * 時間配列を生成（タイムラベル用）
 */
export function generateHourLabels(startDate: Date, hours: number): Date[] {
  const labels: Date[] = [];
  for (let i = 0; i < hours; i++) {
    labels.push(addHours(startDate, i));
  }
  return labels;
}

/**
 * 配信が指定期間内にあるかチェック
 */
export function isStreamInPeriod(
  streamStart: string,
  streamEnd: string | undefined,
  periodStart: Date,
  periodEnd: Date
): boolean {
  const start = parseISO(streamStart);
  const end = streamEnd ? parseISO(streamEnd) : new Date();

  return (
    isWithinInterval(start, { start: periodStart, end: periodEnd }) ||
    isWithinInterval(end, { start: periodStart, end: periodEnd }) ||
    (start < periodStart && end > periodEnd)
  );
}

/**
 * スクロール位置から日時を計算
 * @param gridStartTime グリッド開始時刻
 * @param scrollTop 縦スクロール位置（px）
 * @param hourHeight 1時間あたりの高さ（px）
 * @returns 計算された日時
 */
export function getDateFromScrollPosition(
  gridStartTime: Date,
  scrollTop: number,
  hourHeight: number = 60
): Date {
  const minutes = (scrollTop / hourHeight) * 60;
  return addMinutes(gridStartTime, Math.floor(minutes));
}
