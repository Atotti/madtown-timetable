import type { Stream } from "@/types";
import { CARD_DISPLAY_THRESHOLDS } from "@/lib/constants";
import { positionToTime } from "@/lib/time-position-converter";
import { buildYouTubeUrl, buildTwitchUrl } from "@/lib/video-url-builder";

type StreamCardProps = {
  stream: Stream;
  style: React.CSSProperties;
  gridStartTime: Date;
  hourPositions: number[];
  hourHeights: number[];
  cardTop: number;
  onSetPlaybackTime: (time: Date) => void;
};

export function StreamCard({
  stream,
  style,
  gridStartTime,
  hourPositions,
  hourHeights,
  cardTop,
  onSetPlaybackTime,
}: StreamCardProps) {
  // heightを数値に変換（"526px" -> 526）
  const height =
    typeof style.height === "number"
      ? style.height
      : parseFloat(style.height as string) || 0;
  const showThumbnail = height >= CARD_DISPLAY_THRESHOLDS.SHOW_THUMBNAIL;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // カード内のクリック位置（Y座標）を取得
    const clickOffsetY = e.nativeEvent.offsetY;

    // グリッド上の絶対Y座標
    const absoluteY = cardTop + clickOffsetY;

    // Y座標から時刻を計算
    const clickedTime = positionToTime(
      absoluteY,
      gridStartTime,
      hourPositions,
      hourHeights,
    );

    // 再生位置を設定（緑色のバーを表示）
    onSetPlaybackTime(clickedTime);

    // 配信開始からの経過秒数を計算
    const streamStartTime = new Date(stream.startTime);
    const elapsedSeconds = Math.max(
      0,
      (clickedTime.getTime() - streamStartTime.getTime()) / 1000,
    );

    // 再生位置付きURLを生成
    const url =
      stream.platform === "youtube"
        ? buildYouTubeUrl(stream.videoId, elapsedSeconds)
        : buildTwitchUrl(stream.videoId, elapsedSeconds);

    window.open(url, "_blank");
  };

  // プラットフォームに応じた背景色
  const bgColor =
    stream.platform === "youtube"
      ? "bg-red-600 hover:bg-red-700"
      : "bg-purple-600 hover:bg-purple-700";

  return (
    <div
      className="absolute w-full px-1 cursor-pointer"
      style={style}
      onClick={handleClick}
    >
      <div
        className={`h-full ${bgColor} text-white rounded shadow-md overflow-hidden transition-colors`}
      >
        <div className="h-full p-2 flex flex-col">
          <div className="mb-2">
            <p className="text-xs font-semibold line-clamp-2">{stream.title}</p>
          </div>
          {showThumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stream.thumbnailUrl}
              alt={stream.title}
              className="w-full aspect-video object-cover rounded"
              loading="lazy"
            />
          )}
          {stream.isLive && (
            <span className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
              LIVE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
