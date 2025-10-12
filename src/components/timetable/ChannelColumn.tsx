import type { Channel, Stream } from '@/types';
import { StreamCard } from './StreamCard';
import { calculateCardPosition } from '@/lib/grid-calculator';
import { GRID_CONFIG } from '@/lib/constants';

type ChannelColumnProps = {
  channel: Channel;
  streams: Stream[];
  gridStartTime: Date;
  style?: React.CSSProperties;
};

export function ChannelColumn({
  channel, // eslint-disable-line @typescript-eslint/no-unused-vars
  streams,
  gridStartTime,
  style,
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
        const { top, height } = calculateCardPosition(stream, gridStartTime);
        return (
          <StreamCard
            key={stream.id}
            stream={stream}
            style={{
              top: `${top}px`,
              height: `${height}px`,
            }}
          />
        );
      })}
    </div>
  );
}
