import { JOB_COLORS, JOB_COLORS_SELECTED } from "./constants";

// 括弧を除去してタグの基本形を取得
export const getBaseTag = (tag: string): string => {
  return tag.split("(")[0].split("（")[0].trim();
};

// タグに対応する色クラスを取得
export const getTagColor = (tag: string, isSelected: boolean): string => {
  const baseTag = getBaseTag(tag);
  if (isSelected) {
    return JOB_COLORS_SELECTED[baseTag] || "bg-gray-100 border-gray-300";
  }
  return JOB_COLORS[baseTag] || "bg-gray-50 border-gray-200";
};
