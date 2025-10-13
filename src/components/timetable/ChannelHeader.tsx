import type { Channel } from "@/types";
import { getTagColor } from "@/lib/tag-utils";

type ChannelHeaderProps = {
  channel: Channel;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
};

export function ChannelHeader({
  channel,
  selectedTags,
  onToggleTag,
}: ChannelHeaderProps) {
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

  return (
    <div
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
  );
}
