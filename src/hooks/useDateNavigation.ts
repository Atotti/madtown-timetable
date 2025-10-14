import { useState, useEffect, RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { timeToPosition } from "@/lib/time-position-converter";

type UseDateNavigationProps = {
  gridStartTime: Date;
  timeGridScrollRef: RefObject<HTMLDivElement | null>;
  hourHeights: number[];
  hourPositions: number[];
};

export function useDateNavigation({
  gridStartTime,
  timeGridScrollRef,
  hourHeights,
  hourPositions,
}: UseDateNavigationProps) {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [isManualSelection, setIsManualSelection] = useState<boolean>(false);

  // URLパラメータから共有時刻を取得
  const sharedTimeParam = searchParams.get("t");
  const sharedTime = sharedTimeParam ? new Date(sharedTimeParam) : null;

  // 指定時刻にスクロール（動的な時間帯の高さを考慮）
  const scrollToTime = (targetDate: Date) => {
    if (!timeGridScrollRef.current) return;

    // 時刻から位置を計算
    const targetPosition = timeToPosition(
      targetDate,
      gridStartTime,
      hourPositions,
      hourHeights,
    );

    // 画面中央に表示するためにビューポートの高さの半分を引く
    const viewportHeight = timeGridScrollRef.current.clientHeight;
    const scrollTop = Math.max(0, targetPosition - viewportHeight / 2);

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

    setIsManualSelection(true);
    setSelectedDate(date);
    scrollToTime(targetTime);

    // 3秒後に自動更新を再開
    setTimeout(() => {
      setIsManualSelection(false);
    }, 3000);
  };

  // currentViewDateが変わったらselectedDateも更新（手動選択中を除く）
  useEffect(() => {
    if (!isManualSelection) {
      setSelectedDate(currentViewDate);
    }
  }, [currentViewDate, isManualSelection]);

  // 初回レンダリング時に共有時刻または現在時刻にスクロール
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sharedTime && !isNaN(sharedTime.getTime())) {
        // 共有時刻がある場合はそこにスクロール
        scrollToTime(sharedTime);
        setSelectedDate(sharedTime);
      } else {
        // 共有時刻がない場合は現在時刻にスクロール
        scrollToNow();
      }
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
    sharedTime: sharedTime && !isNaN(sharedTime.getTime()) ? sharedTime : null,
  };
}
