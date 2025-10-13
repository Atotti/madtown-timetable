"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Channel, Stream, Config } from "@/types";
import { TimeGrid } from "./TimeGrid";
import { TimetableHeader } from "./TimetableHeader";
import { ChannelHeaderRow } from "./ChannelHeaderRow";
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
import { useShareMode } from "@/hooks/useShareMode";
import { useGridCalculations } from "@/hooks/useGridCalculations";
import { calculateChannelDuration } from "@/lib/stream-utils";

type TimetableProps = {
  channels: Channel[];
  streams: Stream[];
  config: Config;
};

export function Timetable({ channels, streams, config }: TimetableProps) {
  const searchParams = useSearchParams();
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const timeGridScrollRef = useRef<HTMLDivElement>(null);
  const timeLabelScrollRef = useRef<HTMLDivElement>(null);

  // URLパラメータから初期タグとピン留めを取得
  const initialTags = useMemo(() => {
    const tagsParam = searchParams.get("tags");
    return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  }, [searchParams]);

  const initialPins = useMemo(() => {
    const pinsParam = searchParams.get("pins");
    return pinsParam ? pinsParam.split(",").filter(Boolean) : [];
  }, [searchParams]);

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

  // グリッド計算（動的な高さと位置）
  const { streamCountByHour, hourHeights, hourPositions } = useGridCalculations(
    {
      streams,
      gridStartTime,
      hourCount,
    },
  );

  // カスタムフックの使用
  const {
    selectedTags,
    filteredChannels,
    toggleTag,
    removeTag,
    pinnedChannelIds,
    togglePin,
  } = useTagFilter(sortedChannels, initialTags, initialPins);

  const {
    selectedDate,
    currentViewDate,
    setCurrentViewDate,
    scrollToNow,
    handleDateSelect,
    sharedTime,
  } = useDateNavigation({
    gridStartTime,
    timeGridScrollRef,
    hourHeights,
    hourPositions,
  });

  const {
    isShareMode,
    shareTime,
    setShareTime,
    handleStartShare,
    handleCancelShare,
    handleCopyShareUrl,
  } = useShareMode({
    gridStartTime,
    timeGridScrollRef,
    hourPositions,
    hourHeights,
  });

  // 再生位置の管理
  const [playbackTime, setPlaybackTime] = useState<Date | null>(null);

  const handleSetPlaybackTime = (time: Date) => {
    setPlaybackTime(time);
  };

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
        isShareMode={isShareMode}
        onStartShare={handleStartShare}
        onCancelShare={handleCancelShare}
        onCopyShareUrl={handleCopyShareUrl}
        pinnedChannelIds={pinnedChannelIds}
      />

      {/* チャンネルヘッダー */}
      <ChannelHeaderRow
        filteredChannels={filteredChannels}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        headerScrollRef={headerScrollRef}
        onScroll={handleHeaderScroll}
        pinnedChannelIds={pinnedChannelIds}
        onTogglePin={togglePin}
      />

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
          sharedTime={sharedTime}
          streamCountByHour={streamCountByHour}
          hourHeights={hourHeights}
          hourPositions={hourPositions}
          isShareMode={isShareMode}
          shareTime={shareTime}
          onShareTimeChange={setShareTime}
          playbackTime={playbackTime}
          onSetPlaybackTime={handleSetPlaybackTime}
        />
      </div>
    </div>
  );
}
