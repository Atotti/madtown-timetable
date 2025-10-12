'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { differenceInMinutes, isWithinInterval } from 'date-fns';
import type { Channel, Stream } from '@/types';
import { ChannelColumn } from './ChannelColumn';
import { TimeLabel } from './TimeLabel';
import { generateHourLabels } from '@/lib/time-utils';
import { calculateGridSize } from '@/lib/grid-calculator';
import { GRID_CONFIG } from '@/lib/constants';

type TimeGridProps = {
  channels: Channel[];
  streams: Stream[];
  gridStartTime: Date;
  hourCount: number;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  onScroll?: (scrollLeft: number, scrollTop: number) => void;
  timeGridScrollRef?: React.RefObject<HTMLDivElement | null>;
  timeLabelScrollRef?: React.RefObject<HTMLDivElement | null>;
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
    [gridStartTime, hourCount]
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

  const gridSize = calculateGridSize(channels.length, hourCount);
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
    return (minutesFromStart / 60) * GRID_CONFIG.HOUR_HEIGHT;
  }, [currentTime, gridStartTime, isCurrentTimeInView]);

  return (
    <div className="flex h-full">
      {/* 時刻ラベル（縦スクロール同期） */}
      <div
        ref={timeLabelScrollRef}
        className="relative bg-gray-50 border-r border-gray-300 overflow-y-auto overflow-x-hidden"
        style={{
          width: `${GRID_CONFIG.TIME_LABEL_WIDTH}px`,
          flexShrink: 0,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div style={{ height: `${gridSize.height}px` }}>
          {timeLabels.map((time, index) => (
            <TimeLabel key={index} time={time} index={index} />
          ))}

          {/* 現在時刻インジケーター（時刻ラベル側） */}
          {isCurrentTimeInView && (
            <div
              className="absolute right-0 h-0.5 bg-red-500 z-50 pointer-events-none"
              style={{
                top: `${currentTimePosition}px`,
                width: '100%',
              }}
            >
              <span className="absolute right-1 -top-2 bg-red-500 text-white text-xs px-1 rounded whitespace-nowrap">
                現在
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
          {/* 横線（1時間ごと） */}
          {timeLabels.map((_, index) => (
            <div
              key={index}
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{
                top: `${index * GRID_CONFIG.HOUR_HEIGHT}px`,
              }}
            />
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
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${virtualColumn.start}px`,
                  height: '100%',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
