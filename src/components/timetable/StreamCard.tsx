import type { Stream } from '@/types';
import { formatTime, parseTime } from '@/lib/time-utils';
import { CARD_DISPLAY_THRESHOLDS } from '@/lib/constants';

type StreamCardProps = {
  stream: Stream;
  style: React.CSSProperties;
};

export function StreamCard({ stream, style }: StreamCardProps) {
  const height = (style.height as number) || 0;
  const showThumbnail = height >= CARD_DISPLAY_THRESHOLDS.SHOW_THUMBNAIL;
  const showTime = height >= CARD_DISPLAY_THRESHOLDS.SHOW_TIME;

  const handleClick = () => {
    window.open(`https://www.youtube.com/watch?v=${stream.videoId}`, '_blank');
  };

  const startTime = formatTime(parseTime(stream.startTime));
  const endTime = stream.endTime ? formatTime(parseTime(stream.endTime)) : '配信中';

  return (
    <div
      className="absolute w-full px-1 cursor-pointer"
      style={style}
      onClick={handleClick}
    >
      <div className="h-full bg-blue-500 hover:bg-blue-600 text-white rounded shadow-md overflow-hidden transition-colors">
        <div className="h-full p-2 flex flex-col">
          {showThumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={stream.thumbnailUrl}
              alt={stream.title}
              className="w-full h-16 object-cover rounded mb-2"
              loading="lazy"
            />
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold line-clamp-2">
              {stream.title}
            </p>
          </div>
          {showTime && (
            <p className="text-xs mt-1 opacity-90">
              {startTime} - {endTime}
            </p>
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
