import type { Channel, Stream, Config } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Share2, HelpCircle } from "lucide-react";
import { formatTime } from "@/lib/time-utils";
import { getTagColor } from "@/lib/tag-utils";
import Image from "next/image";
import { useState } from "react";
import { HowToUseModal } from "./HowToUseModal";

type TimetableHeaderProps = {
  config: Config;
  channels: Channel[];
  streams: Stream[];
  selectedTags: string[];
  onRemoveTag: (tag: string) => void;
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  onScrollToNow: () => void;
  eventStartDate: Date;
  maxSelectableDate: Date;
  isShareMode: boolean;
  onStartShare: () => void;
  onCancelShare: () => void;
  onCopyShareUrl: (
    selectedTags: string[],
    pinnedChannelIds: Set<string>,
  ) => Promise<boolean>;
  pinnedChannelIds: Set<string>;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
};

export function TimetableHeader({
  config,
  channels,
  streams,
  selectedTags,
  onRemoveTag,
  selectedDate,
  onDateSelect,
  onScrollToNow,
  eventStartDate,
  maxSelectableDate,
  isShareMode,
  onStartShare,
  onCancelShare,
  onCopyShareUrl,
  pinnedChannelIds,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: TimetableHeaderProps) {
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [showHowToUse, setShowHowToUse] = useState(false);

  // URLコピーボタンのハンドラー
  const handleCopyUrl = async () => {
    const success = await onCopyShareUrl(selectedTags, pinnedChannelIds);
    if (success) {
      setCopyMessage("URLをコピーしました！");
      setTimeout(() => setCopyMessage(""), 2000);
    } else {
      setCopyMessage("コピーに失敗しました");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  return (
    <div className="bg-white border-b border-gray-300 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-6">
        {/* ロゴ（大きく表示） */}
        <div className="flex-shrink-0 -my-4">
          <Image
            src="/madtown.png"
            alt="MADTOWN"
            width={96}
            height={96}
            className="object-contain"
          />
        </div>

        {/* タイトルと統計情報 */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {config.event.name} タイムテーブル
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-white shadow-sm border border-gray-200 px-2 py-1 rounded text-xs text-gray-700">
              📺 {channels.length}チャンネル
            </span>
            <span className="bg-white shadow-sm border border-gray-200 px-2 py-1 rounded text-xs text-gray-700">
              🎬 {streams.length}配信
            </span>
          </div>
        </div>

        {/* ズームコントロール */}
        <div className="relative">
          <span className="absolute -top-2 left-3 text-xs text-gray-600 font-medium bg-white px-1">
            zoom
          </span>
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md shadow-sm">
            <Button
              onClick={onZoomOut}
              disabled={zoomLevel <= 0.5}
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
            >
              −
            </Button>
            <button
              type="button"
              onClick={onZoomReset}
              className="min-w-[3.5rem] text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {zoomLevel.toFixed(1)}x
            </button>
            <Button
              onClick={onZoomIn}
              disabled={zoomLevel >= 3.0}
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
            >
              +
            </Button>
          </div>
        </div>

        {/* ボタン群 */}
        <div className="flex items-center gap-3">
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => {
                const colorClass = getTagColor(tag, true);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className={`px-2 py-1 text-xs rounded border ${colorClass} shadow-sm hover:shadow-md hover:opacity-80 transition-all`}
                  >
                    ×{tag}
                  </button>
                );
              })}
            </div>
          )}
          <Button
            onClick={() => setShowHowToUse(true)}
            variant="outline"
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            使い方
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[150px] justify-start text-left font-normal shadow-sm hover:shadow-md transition-shadow"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatTime(selectedDate, "yyyy/MM/dd")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                startMonth={eventStartDate}
                endMonth={maxSelectableDate}
                disabled={[
                  { before: eventStartDate },
                  { after: maxSelectableDate },
                ]}
              />
            </PopoverContent>
          </Popover>
          {!isShareMode ? (
            <>
              <Button
                onClick={onScrollToNow}
                variant="default"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                現在時刻に戻る
              </Button>
              <Button
                onClick={onStartShare}
                variant="outline"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <Share2 className="mr-2 h-4 w-4" />
                この時刻を共有
              </Button>
            </>
          ) : (
            <>
              <div className="relative">
                <Button
                  onClick={handleCopyUrl}
                  variant="default"
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  URLをコピー
                </Button>
                {copyMessage && (
                  <div className="absolute top-full mt-2 right-0 bg-gray-800 text-white text-sm px-3 py-1 rounded shadow-lg whitespace-nowrap">
                    {copyMessage}
                  </div>
                )}
              </div>
              <Button
                onClick={onCancelShare}
                variant="outline"
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                キャンセル
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 使い方モーダル */}
      <HowToUseModal open={showHowToUse} onOpenChange={setShowHowToUse} />
    </div>
  );
}
