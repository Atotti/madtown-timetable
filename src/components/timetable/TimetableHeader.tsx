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
  currentViewDate: Date;
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  onScrollToNow: () => void;
  eventStartDate: Date;
  maxSelectableDate: Date;
  isShareMode: boolean;
  onStartShare: () => void;
  onCancelShare: () => void;
  onCopyShareUrl: () => Promise<boolean>;
};

export function TimetableHeader({
  config,
  channels,
  streams,
  selectedTags,
  onRemoveTag,
  currentViewDate,
  selectedDate,
  onDateSelect,
  onScrollToNow,
  eventStartDate,
  maxSelectableDate,
  isShareMode,
  onStartShare,
  onCancelShare,
  onCopyShareUrl,
}: TimetableHeaderProps) {
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [showHowToUse, setShowHowToUse] = useState(false);

  // URLコピーボタンのハンドラー
  const handleCopyUrl = async () => {
    const success = await onCopyShareUrl();
    if (success) {
      setCopyMessage("URLをコピーしました！");
      setTimeout(() => setCopyMessage(""), 2000);
    } else {
      setCopyMessage("コピーに失敗しました");
      setTimeout(() => setCopyMessage(""), 2000);
    }
  };

  return (
    <div className="bg-white border-b border-gray-300 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Image
              src="/madtown.png"
              alt="MADTOWN"
              width={38}
              height={38}
              className="object-contain"
            />
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
                    onClick={() => onRemoveTag(tag)}
                    className={`px-2 py-1 text-xs rounded border ${colorClass} hover:opacity-80 transition-opacity`}
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
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            使い方
          </Button>
          <div className="text-sm text-gray-700 bg-gray-100 px-3 py-2 rounded-md border border-gray-200">
            {" "}
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
              <Button onClick={onScrollToNow} variant="default">
                現在時刻に戻る
              </Button>
              <Button onClick={onStartShare} variant="outline">
                <Share2 className="mr-2 h-4 w-4" />
                この時刻を共有
              </Button>
            </>
          ) : (
            <>
              <div className="relative">
                <Button onClick={handleCopyUrl} variant="default">
                  <Share2 className="mr-2 h-4 w-4" />
                  URLをコピー
                </Button>
                {copyMessage && (
                  <div className="absolute top-full mt-2 right-0 bg-gray-800 text-white text-sm px-3 py-1 rounded shadow-lg whitespace-nowrap">
                    {copyMessage}
                  </div>
                )}
              </div>
              <Button onClick={onCancelShare} variant="outline">
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
