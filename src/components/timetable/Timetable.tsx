"use client";

import { useMemo, useRef, useState } from "react";
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
import { addHours, parseISO } from "date-fns";
import { GRID_CONFIG } from "@/lib/constants";
import { useTagFilter } from "@/hooks/useTagFilter";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { calculateChannelDuration } from "@/lib/stream-utils";
import {
  calculateHourHeights,
  calculateHourPositions,
} from "@/lib/grid-calculator";

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

  // 共有モードの状態管理
  const [isShareMode, setIsShareMode] = useState(false);
  const [shareTime, setShareTime] = useState<Date | null>(null);

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

  // カスタムフックの使用
  const { selectedTags, filteredChannels, toggleTag, removeTag } =
    useTagFilter(sortedChannels);

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

  // 共有モード開始（画面中央の時刻を取得）
  const handleStartShare = () => {
    if (!timeGridScrollRef.current) return;

    // 現在のスクロール位置とビューポートの中央を計算
    const scrollTop = timeGridScrollRef.current.scrollTop;
    const viewportHeight = timeGridScrollRef.current.clientHeight;
    const centerY = scrollTop + viewportHeight / 2;

    // Y座標から時刻を逆算（動的な高さを考慮）
    let targetHourIndex = 0;
    for (let i = 0; i < hourPositions.length - 1; i++) {
      if (centerY >= hourPositions[i] && centerY < hourPositions[i + 1]) {
        targetHourIndex = i;
        break;
      }
    }

    const hourPosition = hourPositions[targetHourIndex] || 0;
    const hourHeight = hourHeights[targetHourIndex] || GRID_CONFIG.HOUR_HEIGHT;
    const positionInHour = centerY - hourPosition;
    const minuteInHour = Math.max(0, Math.min(59, (positionInHour / hourHeight) * 60));

    const centerTime = new Date(gridStartTime);
    centerTime.setHours(centerTime.getHours() + targetHourIndex);
    centerTime.setMinutes(minuteInHour);

    setIsShareMode(true);
    setShareTime(centerTime);
  };

  // 共有モードキャンセル
  const handleCancelShare = () => {
    setIsShareMode(false);
    setShareTime(null);
  };

  // 共有URLをコピー
  const handleCopyShareUrl = async (): Promise<boolean> => {
    if (!shareTime) return false;

    const url = new URL(window.location.href);
    url.searchParams.set("t", shareTime.toISOString());

    try {
      await navigator.clipboard.writeText(url.toString());
      // コピー成功後、共有モードを終了
      setIsShareMode(false);
      setShareTime(null);
      return true;
    } catch (error) {
      console.error("Failed to copy URL:", error);
      return false;
    }
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
          sharedTime={sharedTime}
          streamCountByHour={streamCountByHour}
          hourHeights={hourHeights}
          hourPositions={hourPositions}
          isShareMode={isShareMode}
          shareTime={shareTime}
          onShareTimeChange={setShareTime}
        />
      </div>
    </div>
  );
}
