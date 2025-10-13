import { useState, RefObject } from "react";
import { positionToTime } from "@/lib/time-position-converter";

type UseShareModeProps = {
  gridStartTime: Date;
  timeGridScrollRef: RefObject<HTMLDivElement | null>;
  hourPositions: number[];
  hourHeights: number[];
};

export function useShareMode({
  gridStartTime,
  timeGridScrollRef,
  hourPositions,
  hourHeights,
}: UseShareModeProps) {
  const [isShareMode, setIsShareMode] = useState(false);
  const [shareTime, setShareTime] = useState<Date | null>(null);

  // 共有モード開始（画面中央の時刻を取得）
  const handleStartShare = () => {
    if (!timeGridScrollRef.current) return;

    // 現在のスクロール位置とビューポートの中央を計算
    const scrollTop = timeGridScrollRef.current.scrollTop;
    const viewportHeight = timeGridScrollRef.current.clientHeight;
    const centerY = scrollTop + viewportHeight / 2;

    // Y座標から時刻を計算
    const centerTime = positionToTime(
      centerY,
      gridStartTime,
      hourPositions,
      hourHeights,
    );

    setIsShareMode(true);
    setShareTime(centerTime);
  };

  // 共有モードキャンセル
  const handleCancelShare = () => {
    setIsShareMode(false);
    setShareTime(null);
  };

  // 共有URLをコピー
  const handleCopyShareUrl = async (
    selectedTags: string[] = [],
    pinnedChannelIds: Set<string> = new Set(),
  ): Promise<boolean> => {
    if (!shareTime) return false;

    const url = new URL(window.location.href);
    url.searchParams.set("t", shareTime.toISOString());

    // タグが選択されている場合はURLに追加
    if (selectedTags.length > 0) {
      url.searchParams.set("tags", selectedTags.join(","));
    } else {
      url.searchParams.delete("tags");
    }

    // ピン留めされているチャンネルがある場合はURLに追加
    if (pinnedChannelIds.size > 0) {
      url.searchParams.set("pins", Array.from(pinnedChannelIds).join(","));
    } else {
      url.searchParams.delete("pins");
    }

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

  return {
    isShareMode,
    shareTime,
    setShareTime,
    handleStartShare,
    handleCancelShare,
    handleCopyShareUrl,
  };
}
