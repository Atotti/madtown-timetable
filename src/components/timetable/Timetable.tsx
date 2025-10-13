"use client";

import { useMemo, useRef } from "react";
import type { Channel, Stream, Config } from "@/types";
import { TimeGrid } from "./TimeGrid";
import { TimetableHeader } from "./TimetableHeader";
import { ChannelHeader } from "./ChannelHeader";
import {
  parseTime,
  getDayStart,
  getHoursDiff,
  getDateFromScrollPosition,
} from "@/lib/time-utils";
import { addHours } from "date-fns";
import { GRID_CONFIG } from "@/lib/constants";
import { useTagFilter } from "@/hooks/useTagFilter";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { calculateChannelDuration } from "@/lib/stream-utils";

type TimetableProps = {
  channels: Channel[];
  streams: Stream[];
  config: Config;
};

export function Timetable({ channels, streams, config }: TimetableProps) {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const timeGridScrollRef = useRef<HTMLDivElement>(null);
  const timeLabelScrollRef = useRef<HTMLDivElement>(null);

  // イベント期間
  const eventStartDate = useMemo(
    () => parseTime(config.event.startDate),
    [config.event.startDate],
  );
  const eventEndDate = useMemo(
    () => parseTime(config.event.endDate),
    [config.event.endDate],
  );

  // 表示開始時刻（企画開始日の0時）
  const gridStartTime = useMemo(() => {
    return getDayStart(eventStartDate);
  }, [eventStartDate]);

  // 表示終了時刻（現在時刻+3時間 または イベント終了時刻の早い方）
  const displayEndTime = useMemo(() => {
    const nowPlus3Hours = addHours(new Date(), 3);
    return nowPlus3Hours < eventEndDate ? nowPlus3Hours : eventEndDate;
  }, [eventEndDate]);

  // 表示時間範囲（現在時刻+3時間まで）
  const hourCount = useMemo(() => {
    return getHoursDiff(gridStartTime, displayEndTime) + 1;
  }, [gridStartTime, displayEndTime]);

  // 選択可能な最大日付（現在時刻 または イベント終了日の早い方）
  const maxSelectableDate = useMemo(() => {
    const now = new Date();
    return now < eventEndDate ? now : eventEndDate;
  }, [eventEndDate]);

  // チャンネルをソート（LIVE優先、次に配信時間順）
  const sortedChannels = useMemo(() => {
    // 各チャンネルの実配信時間とLIVE状態を計算
    const channelDurations = new Map<string, number>();
    const channelLiveStatus = new Map<string, boolean>();

    channels.forEach((channel) => {
      const duration = calculateChannelDuration(channel.id, streams);
      channelDurations.set(channel.id, duration);

      // LIVE状態を計算
      const hasLiveStream = streams.some(
        (stream) => stream.channelId === channel.id && stream.isLive,
      );
      channelLiveStatus.set(channel.id, hasLiveStream);
    });

    // LIVE優先、次に配信時間の長い順にソート
    return [...channels].sort((a, b) => {
      const aIsLive = channelLiveStatus.get(a.id) || false;
      const bIsLive = channelLiveStatus.get(b.id) || false;

      // LIVE中のチャンネルを優先
      if (aIsLive && !bIsLive) return -1;
      if (!aIsLive && bIsLive) return 1;

      // 同じLIVE状態なら配信時間順
      const aDuration = channelDurations.get(a.id) || 0;
      const bDuration = channelDurations.get(b.id) || 0;
      return bDuration - aDuration;
    });
  }, [channels, streams]);

  // カスタムフックの使用
  const { selectedTags, filteredChannels, toggleTag, removeTag } =
    useTagFilter(sortedChannels);

  const {
    selectedDate,
    currentViewDate,
    setCurrentViewDate,
    scrollToNow,
    handleDateSelect,
  } = useDateNavigation({
    gridStartTime,
    timeGridScrollRef,
  });

  // スクロール同期
  const handleHeaderScroll = () => {
    if (headerScrollRef.current && timeGridScrollRef.current) {
      timeGridScrollRef.current.scrollLeft = headerScrollRef.current.scrollLeft;
    }
  };

  const handleGridScroll = (scrollLeft: number, scrollTop: number) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }

    // スクロール位置から表示中の日時を計算
    const viewDate = getDateFromScrollPosition(
      gridStartTime,
      scrollTop,
      GRID_CONFIG.HOUR_HEIGHT,
    );
    setCurrentViewDate(viewDate);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* ヘッダー */}
      <TimetableHeader
        config={config}
        channels={channels}
        streams={streams}
        selectedTags={selectedTags}
        onRemoveTag={removeTag}
        currentViewDate={currentViewDate}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onScrollToNow={scrollToNow}
        eventStartDate={eventStartDate}
        maxSelectableDate={maxSelectableDate}
      />

      {/* チャンネルヘッダー */}
      <div
        className="bg-gray-50 border-b border-gray-300 flex"
        style={{ height: "120px" }}
      >
        <div
          className="flex items-center justify-center border-r border-gray-300 bg-gray-100"
          style={{ width: "60px", flexShrink: 0 }}
        >
          <span className="text-xs font-semibold text-gray-600">時刻</span>
        </div>
        <div
          ref={headerScrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden flex"
          onScroll={handleHeaderScroll}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="flex">
            {filteredChannels.map((channel) => (
              <ChannelHeader
                key={channel.id}
                channel={channel}
                selectedTags={selectedTags}
                onToggleTag={toggleTag}
              />
            ))}
          </div>
        </div>
      </div>

      {/* タイムグリッド */}
      <div className="flex-1 overflow-hidden">
        <TimeGrid
          channels={filteredChannels}
          streams={streams}
          gridStartTime={gridStartTime}
          hourCount={hourCount}
          scrollRef={gridScrollRef}
          onScroll={handleGridScroll}
          timeGridScrollRef={timeGridScrollRef}
          timeLabelScrollRef={timeLabelScrollRef}
        />
      </div>
    </div>
  );
}
