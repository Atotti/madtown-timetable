"use client";

import { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Channel, Stream } from "@/types";
import { ChannelColumn } from "./ChannelColumn";
import { TimeLabel } from "./TimeLabel";
import { TimeIndicators } from "./TimeIndicators";
import { generateHourLabels } from "@/lib/time-utils";
import { calculateGridSize } from "@/lib/grid-calculator";
import { GRID_CONFIG } from "@/lib/constants";
import { positionToTime } from "@/lib/time-position-converter";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { useTimeIndicators } from "@/hooks/useTimeIndicators";

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

  // 現在時刻の管理（1分ごとに更新）
  const currentTime = useCurrentTime(60000);

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

  // 時刻インジケーターの位置計算
  const {
    isCurrentTimeInView,
    currentTimePosition,
    isSharedTimeInView,
    sharedTimePosition,
    shareTimePosition,
  } = useTimeIndicators({
    currentTime,
    sharedTime: sharedTime || null,
    shareTime,
    isShareMode,
    gridStartTime,
    hourCount,
    hourPositions,
    hourHeights,
  });

  // 共有バーのドラッグ処理
  const handleShareBarDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startY = e.clientY;
    const startPosition = shareTimePosition;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newPosition = startPosition + deltaY;

      // 位置から時刻を計算
      const newTime = positionToTime(
        newPosition,
        gridStartTime,
        hourPositions,
        hourHeights,
      );

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

          {/* インジケーター（時刻ラベル側） */}
          <TimeIndicators
            isCurrentTimeInView={isCurrentTimeInView}
            currentTimePosition={currentTimePosition}
            isSharedTimeInView={isSharedTimeInView}
            sharedTimePosition={sharedTimePosition}
            isShareMode={isShareMode}
            shareTime={shareTime}
            shareTimePosition={shareTimePosition}
            variant="label"
          />
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

          {/* インジケーター（グリッド側） */}
          <TimeIndicators
            isCurrentTimeInView={isCurrentTimeInView}
            currentTimePosition={currentTimePosition}
            isSharedTimeInView={isSharedTimeInView}
            sharedTimePosition={sharedTimePosition}
            isShareMode={isShareMode}
            shareTime={shareTime}
            shareTimePosition={shareTimePosition}
            onShareBarDrag={handleShareBarDrag}
            variant="grid"
          />

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
