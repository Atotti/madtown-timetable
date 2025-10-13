import { useMemo } from "react";
import { parseISO } from "date-fns";
import type { Stream } from "@/types";
import {
  calculateHourHeights,
  calculateHourPositions,
} from "@/lib/grid-calculator";

type UseGridCalculationsProps = {
  streams: Stream[];
  gridStartTime: Date;
  hourCount: number;
};

/**
 * グリッドの動的な高さと位置を計算するフック
 * 配信数に基づいて各時間帯の高さを決定し、累積位置を計算
 */
export function useGridCalculations({
  streams,
  gridStartTime,
  hourCount,
}: UseGridCalculationsProps) {
  // 時間帯ごとの配信数を計算（1時間刻み）
  const streamCountByHour = useMemo(() => {
    const counts = new Array(hourCount).fill(0);

    streams.forEach((stream) => {
      const startTime = parseISO(stream.startTime);
      const endTime = stream.endTime ? parseISO(stream.endTime) : new Date();

      // この配信が各時間帯に含まれるかチェック
      for (let i = 0; i < hourCount; i++) {
        const hourStart = new Date(gridStartTime);
        hourStart.setHours(hourStart.getHours() + i);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourEnd.getHours() + 1);

        // 配信時間と時間帯が重なっているか
        if (startTime < hourEnd && endTime > hourStart) {
          counts[i]++;
        }
      }
    });

    return counts;
  }, [streams, gridStartTime, hourCount]);

  // 各時間帯の高さを計算（inactive時は半分）
  const hourHeights = useMemo(
    () => calculateHourHeights(streamCountByHour),
    [streamCountByHour],
  );

  // 各時間帯の累積位置を計算
  const hourPositions = useMemo(
    () => calculateHourPositions(hourHeights),
    [hourHeights],
  );

  return {
    streamCountByHour,
    hourHeights,
    hourPositions,
  };
}
