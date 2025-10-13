import { formatTime } from "@/lib/time-utils";
import { GRID_CONFIG } from "@/lib/constants";

type TimeLabelProps = {
  time: Date;
  index: number;
  top: number;
  height: number;
};

export function TimeLabel({ time, top, height }: TimeLabelProps) {
  return (
    <div
      className="absolute left-0 flex items-center justify-center text-sm font-medium text-gray-700 border-t border-blue-200 bg-white shadow-sm"
      style={{
        top: `${top}px`,
        width: `${GRID_CONFIG.TIME_LABEL_WIDTH}px`,
        height: `${height}px`,
      }}
    >
      {formatTime(time)}
    </div>
  );
}
