import { useMemo, useState } from "react";
import type { Channel } from "@/types";
import { getBaseTag } from "@/lib/tag-utils";

export function useTagFilter(sortedChannels: Channel[]) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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

  return {
    selectedTags,
    filteredChannels,
    toggleTag,
    removeTag,
  };
}
