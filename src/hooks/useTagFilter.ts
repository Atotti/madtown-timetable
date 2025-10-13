import { useMemo, useState } from "react";
import type { Channel } from "@/types";
import { getBaseTag } from "@/lib/tag-utils";

export function useTagFilter(
  sortedChannels: Channel[],
  initialTags: string[] = [],
  initialPins: string[] = [],
) {
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [pinnedChannelIds, setPinnedChannelIds] = useState<Set<string>>(
    new Set(initialPins),
  );

  // チャンネルをソート（ピン留め優先 → タグ該当 → その他）
  const filteredChannels = useMemo(() => {
    // チャンネルを3つのグループに分ける
    const pinned: Channel[] = [];
    const matchedUnpinned: Channel[] = [];
    const unmatchedUnpinned: Channel[] = [];

    for (const channel of sortedChannels) {
      // ピン留めされているか
      const isPinned = pinnedChannelIds.has(channel.id);

      // ピン留めチャンネルは最優先
      if (isPinned) {
        pinned.push(channel);
        continue;
      }

      // タグフィルタが有効でない場合は、ピン留め以外をそのまま表示
      if (selectedTags.length === 0) {
        matchedUnpinned.push(channel);
        continue;
      }

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
        matchedUnpinned.push(channel);
      } else {
        unmatchedUnpinned.push(channel);
      }
    }

    // ピン留め → タグ該当（非ピン） → タグ非該当（非ピン）の順
    return [...pinned, ...matchedUnpinned, ...unmatchedUnpinned];
  }, [sortedChannels, selectedTags, pinnedChannelIds]);

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

  // ピン留めのトグル
  const togglePin = (channelId: string) => {
    setPinnedChannelIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  };

  return {
    selectedTags,
    filteredChannels,
    toggleTag,
    removeTag,
    pinnedChannelIds,
    togglePin,
  };
}
