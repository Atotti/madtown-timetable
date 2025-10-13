import { useState, useEffect, RefObject } from "react";
import { getHoursDiff } from "@/lib/time-utils";

type UseDateNavigationProps = {
  gridStartTime: Date;
  timeGridScrollRef: RefObject<HTMLDivElement | null>;
};

export function useDateNavigation({
  gridStartTime,
  timeGridScrollRef,
}: UseDateNavigationProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());

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

  return {
    selectedDate,
    currentViewDate,
    setCurrentViewDate,
    scrollToTime,
    scrollToNow,
    handleDateSelect,
  };
}
