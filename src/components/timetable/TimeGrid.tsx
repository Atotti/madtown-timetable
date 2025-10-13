"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { differenceInMinutes, isWithinInterval } from "date-fns";
import type { Channel, Stream } from "@/types";
import { ChannelColumn } from "./ChannelColumn";
import { TimeLabel } from "./TimeLabel";
import { generateHourLabels } from "@/lib/time-utils";
import { calculateGridSize } from "@/lib/grid-calculator";
import { GRID_CONFIG } from "@/lib/constants";

type TimeGridProps = {
  channels: Channel[];
  streams: Stream[];
  gridStartTime: Date;
  hourCount: number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (scrollLeft: number, scrollTop: number) => void;
  timeGridScrollRef?: React.RefObject<HTMLDivElement | null>;
  timeLabelScrollRef?: React.RefObject<HTMLDivElement | null>;
  sharedTime?: Date | null;
  streamCountByHour: number[];
  hourHeights: number[];
  hourPositions: number[];
  isShareMode: boolean;
  shareTime: Date | null;
  onShareTimeChange: (time: Date) => void;
};

export function TimeGrid({
  channels,
  streams,
  gridStartTime,
  hourCount,
  scrollRef,
  onScroll,
  timeGridScrollRef,
  timeLabelScrollRef,
  sharedTime,
  streamCountByHour,
  hourHeights,
  hourPositions,
  isShareMode,
  shareTime,
  onShareTimeChange,
}: TimeGridProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const actualScrollRef = timeGridScrollRef || scrollRef || internalScrollRef;

  // 現在時刻の管理
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // 1分ごとに現在時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60秒ごと

    return () => clearInterval(timer);
  }, []);

  // 時刻ラベル生成
  const timeLabels = useMemo(
    () => generateHourLabels(gridStartTime, hourCount),
    [gridStartTime, hourCount],
  );

  // チャンネルごとの配信リストを作成
  const streamsByChannel = useMemo(() => {
    const map = new Map<string, Stream[]>();
    channels.forEach((channel) => {
      map.set(channel.id, []);
    });
    streams.forEach((stream) => {
      const list = map.get(stream.channelId);
      if (list) {
        list.push(stream);
      }
    });
    return map;
  }, [channels, streams]);

  // 仮想スクロール設定（横軸）
  const columnVirtualizer = useVirtualizer({
    count: channels.length,
    getScrollElement: () => actualScrollRef.current,
    estimateSize: () => GRID_CONFIG.CHANNEL_WIDTH,
    horizontal: true,
    overscan: 5,
  });

  // スクロールイベントハンドラ
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const scrollTop = e.currentTarget.scrollTop;

    // 時刻ラベルの縦スクロールを同期
    if (timeLabelScrollRef?.current) {
      timeLabelScrollRef.current.scrollTop = scrollTop;
    }

    if (onScroll) {
      onScroll(scrollLeft, scrollTop);
    }
  };

  // 時刻ラベルのスクロールイベントハンドラ
  const handleTimeLabelScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;

    // タイムグリッド本体の縦スクロールを同期
    if (actualScrollRef.current) {
      actualScrollRef.current.scrollTop = scrollTop;
    }
  };

  const gridSize = calculateGridSize(channels.length, hourHeights);
  const virtualColumns = columnVirtualizer.getVirtualItems();

  // 現在時刻のグリッド上の位置を計算
  const eventEndTime = useMemo(() => {
    const end = new Date(gridStartTime);
    end.setHours(end.getHours() + hourCount);
    return end;
  }, [gridStartTime, hourCount]);

  const isCurrentTimeInView = isWithinInterval(currentTime, {
    start: gridStartTime,
    end: eventEndTime,
  });

  const currentTimePosition = useMemo(() => {
    if (!isCurrentTimeInView) return 0;
    const minutesFromStart = differenceInMinutes(currentTime, gridStartTime);
    const hourIndex = Math.floor(minutesFromStart / 60);
    const minuteInHour = minutesFromStart % 60;
    const hourPosition = hourPositions[hourIndex] || 0;
    const hourHeight = hourHeights[hourIndex] || GRID_CONFIG.HOUR_HEIGHT;
    return hourPosition + (minuteInHour / 60) * hourHeight;
  }, [
    currentTime,
    gridStartTime,
    isCurrentTimeInView,
    hourPositions,
    hourHeights,
  ]);

  // 共有時刻の位置を計算
  const isSharedTimeInView = useMemo(() => {
    if (!sharedTime) return false;
    return isWithinInterval(sharedTime, {
      start: gridStartTime,
      end: eventEndTime,
    });
  }, [sharedTime, gridStartTime, eventEndTime]);

  const sharedTimePosition = useMemo(() => {
    if (!isSharedTimeInView || !sharedTime) return 0;
    const minutesFromStart = differenceInMinutes(sharedTime, gridStartTime);
    const hourIndex = Math.floor(minutesFromStart / 60);
    const minuteInHour = minutesFromStart % 60;
    const hourPosition = hourPositions[hourIndex] || 0;
    const hourHeight = hourHeights[hourIndex] || GRID_CONFIG.HOUR_HEIGHT;
    return hourPosition + (minuteInHour / 60) * hourHeight;
  }, [
    sharedTime,
    gridStartTime,
    isSharedTimeInView,
    hourPositions,
    hourHeights,
  ]);

  // 共有時刻バーの位置を計算
  const shareTimePosition = useMemo(() => {
    if (!isShareMode || !shareTime) return 0;
    const minutesFromStart = differenceInMinutes(shareTime, gridStartTime);
    const hourIndex = Math.floor(minutesFromStart / 60);
    const minuteInHour = minutesFromStart % 60;
    const hourPosition = hourPositions[hourIndex] || 0;
    const hourHeight = hourHeights[hourIndex] || GRID_CONFIG.HOUR_HEIGHT;
    return hourPosition + (minuteInHour / 60) * hourHeight;
  }, [
    isShareMode,
    shareTime,
    gridStartTime,
    hourPositions,
    hourHeights,
  ]);

  // 共有バーのドラッグ処理
  const handleShareBarDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startPosition = shareTimePosition;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newPosition = startPosition + deltaY;

      // 位置からDateを逆算
      let targetHourIndex = 0;
      for (let i = 0; i < hourPositions.length - 1; i++) {
        if (newPosition >= hourPositions[i] && newPosition < hourPositions[i + 1]) {
          targetHourIndex = i;
          break;
        }
      }

      const hourPosition = hourPositions[targetHourIndex] || 0;
      const hourHeight = hourHeights[targetHourIndex] || GRID_CONFIG.HOUR_HEIGHT;
      const positionInHour = newPosition - hourPosition;
      const minuteInHour = Math.max(0, Math.min(59, (positionInHour / hourHeight) * 60));

      const newTime = new Date(gridStartTime);
      newTime.setHours(newTime.getHours() + targetHourIndex);
      newTime.setMinutes(minuteInHour);

      onShareTimeChange(newTime);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="flex h-full">
      {/* 時刻ラベル（縦スクロール同期） */}
      <div
        ref={timeLabelScrollRef}
        className="relative bg-gray-50 border-r border-gray-300 overflow-y-auto overflow-x-hidden"
        onScroll={handleTimeLabelScroll}
        style={{
          width: `${GRID_CONFIG.TIME_LABEL_WIDTH}px`,
          flexShrink: 0,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div style={{ height: `${gridSize.height}px` }}>
          {timeLabels.map((time, index) => (
            <TimeLabel
              key={index}
              time={time}
              index={index}
              top={hourPositions[index]}
              height={hourHeights[index]}
            />
          ))}

          {/* 現在時刻インジケーター（時刻ラベル側） */}
          {isCurrentTimeInView && (
            <div
              className="absolute right-0 h-0.5 bg-red-500 z-50 pointer-events-none"
              style={{
                top: `${currentTimePosition}px`,
                width: "100%",
              }}
            >
              <span className="absolute right-1 -top-2 bg-red-500 text-white text-xs px-1 rounded whitespace-nowrap">
                現在
              </span>
            </div>
          )}

          {/* 共有時刻インジケーター（時刻ラベル側） */}
          {isSharedTimeInView && (
            <div
              className="absolute right-0 h-0.5 bg-blue-500 z-40 pointer-events-none"
              style={{
                top: `${sharedTimePosition}px`,
                width: "100%",
              }}
            >
              <span className="absolute right-1 -top-2 bg-blue-500 text-white text-xs px-1 rounded whitespace-nowrap">
                共有
              </span>
            </div>
          )}

          {/* ドラッグ可能な共有バー（時刻ラベル側） */}
          {isShareMode && shareTime && (
            <div
              className="absolute right-0 h-1 bg-blue-500 z-50 pointer-events-none"
              style={{
                top: `${shareTimePosition}px`,
                width: "100%",
              }}
            >
              <span className="absolute right-1 -top-2 bg-blue-500 text-white text-xs px-1 rounded whitespace-nowrap">
                選択中
              </span>
            </div>
          )}
        </div>
      </div>

      {/* チャンネル列（縦横スクロール + 仮想化） */}
      <div
        ref={actualScrollRef}
        className="flex-1 overflow-auto"
        onScroll={handleScroll}
      >
        <div
          className="relative bg-white"
          style={{
            width: `${gridSize.width - GRID_CONFIG.TIME_LABEL_WIDTH}px`,
            height: `${gridSize.height}px`,
          }}
        >
          {/* 横線（1時間ごと） + グレーアウト */}
          {timeLabels.map((_, index) => (
            <div key={index}>
              {/* 配信数が少ない時間帯の背景 */}
              {streamCountByHour[index] <=
                GRID_CONFIG.INACTIVE_HOUR_THRESHOLD && (
                <div
                  className="absolute left-0 right-0 bg-gray-400 opacity-20 pointer-events-none"
                  style={{
                    top: `${hourPositions[index]}px`,
                    height: `${hourHeights[index]}px`,
                  }}
                />
              )}
              {/* 横線 */}
              <div
                className="absolute left-0 right-0 border-t border-gray-200"
                style={{
                  top: `${hourPositions[index]}px`,
                }}
              />
            </div>
          ))}

          {/* 現在時刻インジケーター（グリッド側） */}
          {isCurrentTimeInView && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-red-500 z-50 pointer-events-none"
              style={{
                top: `${currentTimePosition}px`,
              }}
            />
          )}

          {/* 共有時刻インジケーター（グリッド側） */}
          {isSharedTimeInView && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-blue-500 z-40 pointer-events-none"
              style={{
                top: `${sharedTimePosition}px`,
              }}
            />
          )}

          {/* ドラッグ可能な共有バー */}
          {isShareMode && shareTime && (
            <div
              className="absolute left-0 right-0 h-1 bg-blue-500 z-50 cursor-grab active:cursor-grabbing"
              style={{
                top: `${shareTimePosition}px`,
              }}
              onMouseDown={handleShareBarDrag}
            >
              <span className="absolute left-2 -top-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap select-none">
                ドラッグして時刻を選択
              </span>
            </div>
          )}

          {/* 仮想化されたチャンネル列 */}
          {virtualColumns.map((virtualColumn) => {
            const channel = channels[virtualColumn.index];
            const channelStreams = streamsByChannel.get(channel.id) || [];

            return (
              <ChannelColumn
                key={channel.id}
                channel={channel}
                streams={channelStreams}
                gridStartTime={gridStartTime}
                hourHeights={hourHeights}
                hourPositions={hourPositions}
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${virtualColumn.start}px`,
                  height: "100%",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
