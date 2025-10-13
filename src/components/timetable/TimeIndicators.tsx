type TimeIndicatorsProps = {
  // 現在時刻
  isCurrentTimeInView: boolean;
  currentTimePosition: number;

  // 共有時刻
  isSharedTimeInView: boolean;
  sharedTimePosition: number;

  // 共有バー
  isShareMode: boolean;
  shareTime: Date | null;
  shareTimePosition: number;
  onShareBarDrag?: (e: React.MouseEvent<HTMLDivElement>) => void;

  // レイアウト
  variant: "label" | "grid"; // 時刻ラベル側 or グリッド側
};

/**
 * 時刻インジケーター（現在時刻、共有時刻、共有バー）を表示するコンポーネント
 * 時刻ラベル側とグリッド側の両方で使用可能
 */
export function TimeIndicators({
  isCurrentTimeInView,
  currentTimePosition,
  isSharedTimeInView,
  sharedTimePosition,
  isShareMode,
  shareTime,
  shareTimePosition,
  onShareBarDrag,
  variant,
}: TimeIndicatorsProps) {
  const isLabelSide = variant === "label";
  const isGridSide = variant === "grid";

  return (
    <>
      {/* 現在時刻インジケーター */}
      {isCurrentTimeInView && (
        <div
          className={`absolute ${isLabelSide ? "right-0" : "left-0 right-0"} h-0.5 bg-red-500 z-50 pointer-events-none`}
          style={{
            top: `${currentTimePosition}px`,
            ...(isLabelSide && { width: "100%" }),
          }}
        >
          {isLabelSide && (
            <span className="absolute right-1 -top-2 bg-red-500 text-white text-xs px-1 rounded whitespace-nowrap">
              現在
            </span>
          )}
        </div>
      )}

      {/* 共有時刻インジケーター */}
      {isSharedTimeInView && (
        <div
          className={`absolute ${isLabelSide ? "right-0" : "left-0 right-0"} h-0.5 bg-blue-500 z-40 pointer-events-none`}
          style={{
            top: `${sharedTimePosition}px`,
            ...(isLabelSide && { width: "100%" }),
          }}
        >
          {isLabelSide && (
            <span className="absolute right-1 -top-2 bg-blue-500 text-white text-xs px-1 rounded whitespace-nowrap">
              共有
            </span>
          )}
        </div>
      )}

      {/* ドラッグ可能な共有バー */}
      {isShareMode && shareTime && (
        <div
          className={`absolute ${isLabelSide ? "right-0" : "left-0 right-0"} h-1 bg-blue-500 z-50 ${isGridSide && onShareBarDrag ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
          style={{
            top: `${shareTimePosition}px`,
            ...(isLabelSide && { width: "100%" }),
          }}
          {...(isGridSide && onShareBarDrag && { onMouseDown: onShareBarDrag })}
        >
          {isLabelSide && (
            <span className="absolute right-1 -top-2 bg-blue-500 text-white text-xs px-1 rounded whitespace-nowrap">
              選択中
            </span>
          )}
          {isGridSide && (
            <span className="absolute left-2 -top-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap select-none">
              ドラッグして時刻を選択
            </span>
          )}
        </div>
      )}
    </>
  );
}
