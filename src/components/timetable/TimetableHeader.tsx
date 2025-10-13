import type { Channel, Stream, Config } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { formatTime } from "@/lib/time-utils";
import { getTagColor } from "@/lib/tag-utils";
import Image from "next/image";

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
}: TimetableHeaderProps) {
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
          <Button onClick={onScrollToNow} variant="default">
            現在時刻に戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
