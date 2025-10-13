import { parseISO, differenceInMinutes } from "date-fns";
import { GRID_CONFIG } from "./constants";
import type { Stream } from "@/types";

/**
 * 各時間帯の高さを計算
 */
export function calculateHourHeights(streamCountByHour: number[]): number[] {
  return streamCountByHour.map((count) =>
    count <= GRID_CONFIG.INACTIVE_HOUR_THRESHOLD
      ? GRID_CONFIG.INACTIVE_HOUR_HEIGHT
      : GRID_CONFIG.HOUR_HEIGHT,
  );
}

/**
 * 各時間帯の累積位置を計算
 */
export function calculateHourPositions(hourHeights: number[]): number[] {
  const positions: number[] = [0];
  for (let i = 0; i < hourHeights.length; i++) {
    positions.push(positions[i] + hourHeights[i]);
  }
  return positions;
}

/**
 * 配信カードの位置とサイズを計算（動的な時間帯の高さに対応）
 */
export function calculateCardPosition(
  stream: Stream,
  gridStartTime: Date,
  hourHeights: number[],
  hourPositions: number[],
): {
  top: number;
  height: number;
} {
  const streamStart = parseISO(stream.startTime);
  const streamEnd = stream.endTime ? parseISO(stream.endTime) : new Date();

  // グリッド開始時刻からのオフセット（分）
  const startOffsetMinutes = differenceInMinutes(streamStart, gridStartTime);
  const endOffsetMinutes = differenceInMinutes(streamEnd, gridStartTime);

  // 配信開始・終了時刻が属する時間帯を特定
  const startHourIndex = Math.floor(startOffsetMinutes / 60);
  const endHourIndex = Math.floor(endOffsetMinutes / 60);

  // 開始位置を計算
  const startHourPosition = hourPositions[startHourIndex] || 0;
  const startMinuteInHour = startOffsetMinutes % 60;
  const startHourHeight =
    hourHeights[startHourIndex] || GRID_CONFIG.HOUR_HEIGHT;
  const top = startHourPosition + (startMinuteInHour / 60) * startHourHeight;

  // 終了位置を計算
  const endHourPosition = hourPositions[endHourIndex] || 0;
  const endMinuteInHour = endOffsetMinutes % 60;
  const endHourHeight = hourHeights[endHourIndex] || GRID_CONFIG.HOUR_HEIGHT;
  const bottom = endHourPosition + (endMinuteInHour / 60) * endHourHeight;

  const height = Math.max(bottom - top, GRID_CONFIG.MIN_CARD_HEIGHT);

  return { top, height };
}

/**
 * 時刻ラベルのY座標を計算
 */
export function calculateTimeLabelPosition(hour: number): number {
  return hour * GRID_CONFIG.HOUR_HEIGHT;
}

/**
 * チャンネル列のX座標を計算
 */
export function calculateChannelPosition(channelIndex: number): number {
  return (
    GRID_CONFIG.TIME_LABEL_WIDTH + channelIndex * GRID_CONFIG.CHANNEL_WIDTH
  );
}

/**
 * グリッドの全体サイズを計算（動的な時間帯の高さに対応）
 */
export function calculateGridSize(
  channelCount: number,
  hourHeights: number[],
): {
  width: number;
  height: number;
} {
  const totalHeight = hourHeights.reduce((sum, height) => sum + height, 0);
  return {
    width:
      GRID_CONFIG.TIME_LABEL_WIDTH + channelCount * GRID_CONFIG.CHANNEL_WIDTH,
    height: totalHeight,
  };
}
