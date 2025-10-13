import { useMemo } from "react";
import { isWithinInterval } from "date-fns";
import { timeToPosition } from "@/lib/time-position-converter";

type UseTimeIndicatorsProps = {
  currentTime: Date;
  sharedTime: Date | null;
  shareTime: Date | null;
  isShareMode: boolean;
  gridStartTime: Date;
  hourCount: number;
  hourPositions: number[];
  hourHeights: number[];
};

/**
 * 時刻インジケーター（現在時刻、共有時刻、共有バー）の表示状態と位置を計算するフック
 */
export function useTimeIndicators({
  currentTime,
  sharedTime,
  shareTime,
  isShareMode,
  gridStartTime,
  hourCount,
  hourPositions,
  hourHeights,
}: UseTimeIndicatorsProps) {
  // イベント終了時刻
  const eventEndTime = useMemo(() => {
    const end = new Date(gridStartTime);
    end.setHours(end.getHours() + hourCount);
    return end;
  }, [gridStartTime, hourCount]);

  // 現在時刻の表示判定と位置
  const isCurrentTimeInView = isWithinInterval(currentTime, {
    start: gridStartTime,
    end: eventEndTime,
  });

  const currentTimePosition = useMemo(() => {
    if (!isCurrentTimeInView) return 0;
    return timeToPosition(
      currentTime,
      gridStartTime,
      hourPositions,
      hourHeights,
    );
  }, [
    currentTime,
    gridStartTime,
    isCurrentTimeInView,
    hourPositions,
    hourHeights,
  ]);

  // 共有時刻の表示判定と位置
  const isSharedTimeInView = useMemo(() => {
    if (!sharedTime) return false;
    return isWithinInterval(sharedTime, {
      start: gridStartTime,
      end: eventEndTime,
    });
  }, [sharedTime, gridStartTime, eventEndTime]);

  const sharedTimePosition = useMemo(() => {
    if (!isSharedTimeInView || !sharedTime) return 0;
    return timeToPosition(
      sharedTime,
      gridStartTime,
      hourPositions,
      hourHeights,
    );
  }, [
    sharedTime,
    gridStartTime,
    isSharedTimeInView,
    hourPositions,
    hourHeights,
  ]);

  // 共有時刻バーの位置
  const shareTimePosition = useMemo(() => {
    if (!isShareMode || !shareTime) return 0;
    return timeToPosition(shareTime, gridStartTime, hourPositions, hourHeights);
  }, [isShareMode, shareTime, gridStartTime, hourPositions, hourHeights]);

  return {
    eventEndTime,
    isCurrentTimeInView,
    currentTimePosition,
    isSharedTimeInView,
    sharedTimePosition,
    shareTimePosition,
  };
}
