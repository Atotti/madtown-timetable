"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { Channel, Stream, Config } from "@/types";
import { TimeGrid } from "./TimeGrid";
import {
  parseTime,
  getDayStart,
  getHoursDiff,
  formatTime,
  getDateFromScrollPosition,
} from "@/lib/time-utils";
import { addHours } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { GRID_CONFIG, JOB_COLORS, JOB_COLORS_SELECTED } from "@/lib/constants";

type TimetableProps = {
  channels: Channel[];
  streams: Stream[];
  config: Config;
};

// 括弧を除去してタグの基本形を取得
const getBaseTag = (tag: string): string => {
  return tag.split("(")[0].split("（")[0].trim();
};

// タグに対応する色クラスを取得
const getTagColor = (tag: string, isSelected: boolean): string => {
  const baseTag = getBaseTag(tag);
  if (isSelected) {
    return JOB_COLORS_SELECTED[baseTag] || "bg-gray-100 border-gray-300";
  }
  return JOB_COLORS[baseTag] || "bg-gray-50 border-gray-200";
};

export function Timetable({ channels, streams, config }: TimetableProps) {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const timeGridScrollRef = useRef<HTMLDivElement>(null);
  const timeLabelScrollRef = useRef<HTMLDivElement>(null);

  // 現在時刻（1分ごとに更新）
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1分ごと
    return () => clearInterval(timer);
  }, []);

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
    const nowPlus3Hours = addHours(currentTime, 3);
    return nowPlus3Hours < eventEndDate ? nowPlus3Hours : eventEndDate;
  }, [currentTime, eventEndDate]);

  // 表示時間範囲（現在時刻+3時間まで）
  const hourCount = useMemo(() => {
    return getHoursDiff(gridStartTime, displayEndTime) + 1;
  }, [gridStartTime, displayEndTime]);

  // 日付選択
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // 現在表示中の日時
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());

  // 選択中のタグ（フィルタ）
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 選択可能な最大日付（現在時刻 または イベント終了日の早い方）
  const maxSelectableDate = useMemo(() => {
    const now = new Date();
    return now < eventEndDate ? now : eventEndDate;
  }, [currentTime, eventEndDate]);

  // チャンネルをソート（配信時間順）
  const sortedChannels = useMemo(() => {
    // 各チャンネルの配信時間を計算
    const channelDurations = new Map<string, number>();
    channels.forEach((channel) => {
      const duration = streams
        .filter((s) => s.channelId === channel.id)
        .reduce((total, stream) => total + (stream.duration || 0), 0);
      channelDurations.set(channel.id, duration);
    });

    // 配信時間の長い順にソート
    return [...channels].sort((a, b) => {
      const aDuration = channelDurations.get(a.id) || 0;
      const bDuration = channelDurations.get(b.id) || 0;
      return bDuration - aDuration;
    });
  }, [channels, streams]);

  // チャンネルをフィルタ
  const filteredChannels = useMemo(() => {
    if (selectedTags.length === 0) {
      return sortedChannels;
    }

    return sortedChannels.filter((channel) => {
      // チャンネルのすべてのタグを取得
      const channelTags: string[] = [];
      if (channel.job) {
        channelTags.push(...channel.job.split("、").map((t) => t.trim()));
      }
      if (channel.organization) {
        channelTags.push(
          ...channel.organization.split("、").map((t) => t.trim()),
        );
      }

      // OR条件: selectedTagsのいずれかがchannelTagsに含まれていればtrue
      // 括弧を除去した基本形で比較
      return selectedTags.some((selectedTag) => {
        const selectedBaseTag = getBaseTag(selectedTag);
        return channelTags.some((channelTag) => {
          const channelBaseTag = getBaseTag(channelTag);
          return selectedBaseTag === channelBaseTag;
        });
      });
    });
  }, [sortedChannels, selectedTags]);

  // タグの追加・削除
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  // 指定時刻にスクロール
  const scrollToTime = (targetDate: Date) => {
    if (!timeGridScrollRef.current) return;

    const hoursDiff = getHoursDiff(gridStartTime, targetDate);
    const scrollTop = hoursDiff * 60; // 1時間 = 60px

    timeGridScrollRef.current.scrollTop = scrollTop;
  };

  // 「今に戻る」ボタン
  const scrollToNow = () => {
    const now = new Date();
    setSelectedDate(now);
    scrollToTime(now);
  };

  // 日付選択時のスクロール
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // 選択された日付の17時に設定
    const targetTime = new Date(date);
    targetTime.setHours(17, 0, 0, 0);

    setSelectedDate(date);
    scrollToTime(targetTime);
  };

  // 初回レンダリング時に現在時刻にスクロール
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToNow();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="bg-white border-b border-gray-300 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {config.event.name} タイムテーブル
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {channels.length}チャンネル / {streams.length}配信
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag) => {
                  const colorClass = getTagColor(tag, true);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className={`px-2 py-1 text-xs rounded border ${colorClass} hover:opacity-80 transition-opacity`}
                    >
                      ×{tag}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-md border border-gray-200">
              <span className="font-semibold">表示中:</span>{" "}
              {formatTime(currentViewDate, "MM月dd日 (E)")}
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[200px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatTime(selectedDate, "yyyy/MM/dd")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  startMonth={eventStartDate}
                  endMonth={maxSelectableDate}
                  disabled={[
                    { before: eventStartDate },
                    { after: maxSelectableDate },
                  ]}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={scrollToNow} variant="default">
              現在時刻に戻る
            </Button>
          </div>
        </div>
      </div>

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
            {filteredChannels.map((channel) => {
              // チャンネルのすべてのタグを取得
              const tags: string[] = [];
              if (channel.job) {
                tags.push(...channel.job.split("、").map((t) => t.trim()));
              }
              if (channel.organization) {
                tags.push(
                  ...channel.organization.split("、").map((t) => t.trim()),
                );
              }

              // 最初のタグの色をヘッダー背景色に使用
              const headerColor =
                tags.length > 0
                  ? getTagColor(tags[0], false)
                  : "bg-gray-100 border-gray-300";

              return (
                <div
                  key={channel.id}
                  className={`flex items-center justify-center border-r ${headerColor}`}
                  style={{ width: "200px", minWidth: "200px" }}
                >
                  <div className="flex flex-col items-center px-2 py-1">
                    {channel.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={channel.avatarUrl}
                        alt={channel.name}
                        className="w-10 h-10 rounded-full mb-1 border border-gray-300"
                        loading="lazy"
                      />
                    )}
                    <p className="text-sm font-semibold text-gray-800 truncate max-w-full">
                      {channel.name}
                    </p>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mt-1">
                        {tags.map((tag) => {
                          const isSelected = selectedTags.includes(tag);
                          const tagColor = getTagColor(tag, isSelected);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`px-1 py-0 text-[10px] rounded border cursor-pointer transition-opacity hover:opacity-80 ${tagColor}`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
