import type { Channel, Stream } from "@/types";
import { StreamCard } from "./StreamCard";
import { calculateCardPosition } from "@/lib/grid-calculator";
import { GRID_CONFIG } from "@/lib/constants";

type ChannelColumnProps = {
  channel: Channel;
  streams: Stream[];
  gridStartTime: Date;
  hourHeights: number[];
  hourPositions: number[];
  style?: React.CSSProperties;
  onSetPlaybackTime: (time: Date) => void;
};

export function ChannelColumn({
  channel, // eslint-disable-line @typescript-eslint/no-unused-vars
  streams,
  gridStartTime,
  hourHeights,
  hourPositions,
  style,
  onSetPlaybackTime,
}: ChannelColumnProps) {
  return (
    <div
      className="relative border-r border-gray-200"
      style={{
        ...style,
        width: `${GRID_CONFIG.CHANNEL_WIDTH}px`,
      }}
    >
      {/* チャンネル内の配信カード */}
      {streams.map((stream) => {
        const { top, height } = calculateCardPosition(
          stream,
          gridStartTime,
          hourHeights,
          hourPositions,
        );
        return (
          <StreamCard
            key={stream.id}
            stream={stream}
            style={{
              top: `${top}px`,
              height: `${height}px`,
            }}
            gridStartTime={gridStartTime}
            hourPositions={hourPositions}
            hourHeights={hourHeights}
            cardTop={top}
            onSetPlaybackTime={onSetPlaybackTime}
          />
        );
      })}
    </div>
  );
}
