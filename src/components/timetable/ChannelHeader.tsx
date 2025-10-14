"use client";

import { useState } from "react";
import type { Channel } from "@/types";
import { getTagColor } from "@/lib/tag-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ExternalLink, Pin } from "lucide-react";

type ChannelHeaderProps = {
  channel: Channel;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  isPinned: boolean;
  onTogglePin: (channelId: string) => void;
};

export function ChannelHeader({
  channel,
  selectedTags,
  onToggleTag,
  isPinned,
  onTogglePin,
}: ChannelHeaderProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // チャンネルのすべてのタグを取得
  const tags: string[] = [];
  if (channel.job) {
    tags.push(...channel.job.split("、").map((t) => t.trim()));
  }
  if (channel.organization) {
    tags.push(...channel.organization.split("、").map((t) => t.trim()));
  }

  // 最初のタグの色をヘッダー背景色に使用
  const headerColor =
    tags.length > 0
      ? getTagColor(tags[0], false)
      : "bg-gray-100 border-gray-300";

  // URL生成
  const youtubeUrl = channel.youtubeChannelId
    ? `https://www.youtube.com/channel/${channel.youtubeChannelId}`
    : channel.youtubeHandle
      ? `https://www.youtube.com/@${channel.youtubeHandle}`
      : undefined;

  const twitchUrl = channel.twitchUserName
    ? `https://www.twitch.tv/${channel.twitchUserName}`
    : undefined;

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div
          className={`relative flex items-center justify-center ${headerColor} cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 rounded-t-lg`}
          style={{ width: "200px", minWidth: "200px" }}
          onMouseEnter={() => setIsPopoverOpen(true)}
          onMouseLeave={() => setIsPopoverOpen(false)}
        >
          {/* ピン留めボタン（ボックス右上） */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(channel.id);
            }}
            className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10 ${
              isPinned
                ? "bg-yellow-500 text-white shadow-md"
                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
            }`}
            title={isPinned ? "ピン留めを解除" : "ピン留め"}
          >
            <Pin className={`w-3 h-3 ${isPinned ? "fill-current" : ""}`} />
          </button>

          <div className="flex flex-col items-center px-2 py-1">
            {channel.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={channel.avatarUrl}
                alt={channel.name}
                className="w-10 h-10 rounded-full mb-1 border border-gray-300 shadow-md"
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
                      onClick={() => onToggleTag(tag)}
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
      </PopoverTrigger>
      <PopoverContent
        className="w-80"
        onMouseEnter={() => setIsPopoverOpen(true)}
        onMouseLeave={() => setIsPopoverOpen(false)}
      >
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{channel.name}</h3>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => {
                  const tagColor = getTagColor(tag, false);
                  return (
                    <span
                      key={tag}
                      className={`px-2 py-1 text-xs rounded border ${tagColor}`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {youtubeUrl && (
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                <span className="font-semibold">YouTube</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {twitchUrl && (
              <a
                href={twitchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                <span className="font-semibold">Twitch</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
