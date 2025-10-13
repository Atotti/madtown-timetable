import { formatTime } from "@/lib/time-utils";
import { GRID_CONFIG } from "@/lib/constants";

type TimeLabelProps = {
  time: Date;
  index: number;
};

export function TimeLabel({ time, index }: TimeLabelProps) {
  const top = index * GRID_CONFIG.HOUR_HEIGHT;

  return (
    <div
      className="absolute left-0 flex items-center justify-center text-sm font-medium text-gray-600 border-t border-gray-200"
      style={{
        top: `${top}px`,
        width: `${GRID_CONFIG.TIME_LABEL_WIDTH}px`,
        height: `${GRID_CONFIG.HOUR_HEIGHT}px`,
      }}
    >
      {formatTime(time)}
    </div>
  );
}
