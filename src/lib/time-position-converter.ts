import { differenceInMinutes } from "date-fns";
import { GRID_CONFIG } from "./constants";

/**
 * 時刻からグリッド上のピクセル位置を計算
 * 動的な時間帯の高さ（active: 60px, inactive: 30px）に対応
 */
export function timeToPosition(
  time: Date,
  gridStartTime: Date,
  hourPositions: number[],
  hourHeights: number[],
): number {
  const minutesFromStart = differenceInMinutes(time, gridStartTime);
  const hourIndex = Math.floor(minutesFromStart / 60);
  const minuteInHour = minutesFromStart % 60;
  const hourPosition = hourPositions[hourIndex] || 0;
  const hourHeight = hourHeights[hourIndex] || GRID_CONFIG.HOUR_HEIGHT;
  return hourPosition + (minuteInHour / 60) * hourHeight;
}

/**
 * グリッド上のピクセル位置から時刻を計算
 * 動的な時間帯の高さ（active: 60px, inactive: 30px）に対応
 */
export function positionToTime(
  position: number,
  gridStartTime: Date,
  hourPositions: number[],
  hourHeights: number[],
): Date {
  // 位置が属する時間帯を特定
  let targetHourIndex = 0;
  for (let i = 0; i < hourPositions.length - 1; i++) {
    if (position >= hourPositions[i] && position < hourPositions[i + 1]) {
      targetHourIndex = i;
      break;
    }
  }

  // 時間帯内での位置から分を計算
  const hourPosition = hourPositions[targetHourIndex] || 0;
  const hourHeight = hourHeights[targetHourIndex] || GRID_CONFIG.HOUR_HEIGHT;
  const positionInHour = position - hourPosition;
  const minuteInHour = Math.max(
    0,
    Math.min(59, (positionInHour / hourHeight) * 60),
  );

  // 時刻を生成
  const resultTime = new Date(gridStartTime);
  resultTime.setHours(resultTime.getHours() + targetHourIndex);
  resultTime.setMinutes(minuteInHour);

  return resultTime;
}
