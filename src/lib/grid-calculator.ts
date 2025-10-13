import { parseISO, differenceInMinutes } from "date-fns";
import { GRID_CONFIG } from "./constants";
import type { Stream } from "@/types";

/**
 * 配信カードの位置とサイズを計算
 */
export function calculateCardPosition(
  stream: Stream,
  gridStartTime: Date,
): {
  top: number;
  height: number;
} {
  const streamStart = parseISO(stream.startTime);
  const streamEnd = stream.endTime ? parseISO(stream.endTime) : new Date();

  // グリッド開始時刻からのオフセット（分）
  const startOffset = differenceInMinutes(streamStart, gridStartTime);

  // 配信時間（分）
  const duration = differenceInMinutes(streamEnd, streamStart);

  // px単位に変換
  const top = (startOffset / 60) * GRID_CONFIG.HOUR_HEIGHT;
  const height = Math.max(
    (duration / 60) * GRID_CONFIG.HOUR_HEIGHT,
    GRID_CONFIG.MIN_CARD_HEIGHT,
  );

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
 * グリッドの全体サイズを計算
 */
export function calculateGridSize(
  channelCount: number,
  hourCount: number,
): {
  width: number;
  height: number;
} {
  return {
    width:
      GRID_CONFIG.TIME_LABEL_WIDTH + channelCount * GRID_CONFIG.CHANNEL_WIDTH,
    height: hourCount * GRID_CONFIG.HOUR_HEIGHT,
  };
}
