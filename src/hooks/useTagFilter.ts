import { useMemo, useState } from "react";
import type { Channel } from "@/types";
import { getBaseTag } from "@/lib/tag-utils";

export function useTagFilter(sortedChannels: Channel[], initialTags: string[] = []) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);

  // チャンネルをソート（該当チャンネルを左に寄せる）
  const filteredChannels = useMemo(() => {
    if (selectedTags.length === 0) {
      return sortedChannels;
    }

    // チャンネルを2つのグループに分ける
    const matched: Channel[] = [];
    const unmatched: Channel[] = [];

    for (const channel of sortedChannels) {
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
      const isMatched = selectedTags.some((selectedTag) => {
        const selectedBaseTag = getBaseTag(selectedTag);
        return channelTags.some((channelTag) => {
          const channelBaseTag = getBaseTag(channelTag);
          return selectedBaseTag === channelBaseTag;
        });
      });

      if (isMatched) {
        matched.push(channel);
      } else {
        unmatched.push(channel);
      }
    }

    // 該当するチャンネルを前に、該当しないチャンネルを後ろに配置
    return [...matched, ...unmatched];
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
