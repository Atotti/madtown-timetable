import type { Stream } from "@/types";
import { CARD_DISPLAY_THRESHOLDS } from "@/lib/constants";

type StreamCardProps = {
  stream: Stream;
  style: React.CSSProperties;
};

export function StreamCard({ stream, style }: StreamCardProps) {
  // heightを数値に変換（"526px" -> 526）
  const height =
    typeof style.height === "number"
      ? style.height
      : parseFloat(style.height as string) || 0;
  const showThumbnail = height >= CARD_DISPLAY_THRESHOLDS.SHOW_THUMBNAIL;

  const handleClick = () => {
    const url =
      stream.platform === "youtube"
        ? `https://www.youtube.com/watch?v=${stream.videoId}`
        : `https://www.twitch.tv/videos/${stream.videoId}`;
    window.open(url, "_blank");
  };

  // プラットフォームに応じた背景色
  const bgColor =
    stream.platform === "youtube"
      ? "bg-blue-500 hover:bg-blue-600"
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
