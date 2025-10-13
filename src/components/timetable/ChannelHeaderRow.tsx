import { RefObject } from "react";
import type { Channel } from "@/types";
import { ChannelHeader } from "./ChannelHeader";

type ChannelHeaderRowProps = {
  filteredChannels: Channel[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  headerScrollRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
};

/**
 * チャンネルヘッダー行コンポーネント
 * 左端の"時刻"ラベルとスクロール可能なチャンネルヘッダーを表示
 */
export function ChannelHeaderRow({
  filteredChannels,
  selectedTags,
  onToggleTag,
  headerScrollRef,
  onScroll,
}: ChannelHeaderRowProps) {
  return (
    <div
      className="bg-gray-50 border-b border-gray-300 flex"
      style={{ height: "120px" }}
    >
      {/* 左端の"時刻"ラベル */}
      <div
        className="flex items-center justify-center border-r border-gray-300 bg-gray-100"
        style={{ width: "60px", flexShrink: 0 }}
      >
        <span className="text-xs font-semibold text-gray-600">時刻</span>
      </div>

      {/* スクロール可能なチャンネルヘッダー */}
      <div
        ref={headerScrollRef}
        className="flex-1 overflow-x-auto overflow-y-hidden flex"
        onScroll={onScroll}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex">
          {filteredChannels.map((channel) => (
            <ChannelHeader
              key={channel.id}
              channel={channel}
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
