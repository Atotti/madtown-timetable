import { useState, useEffect } from "react";

/**
 * 現在時刻を管理するフック
 * 指定された間隔で自動的に更新される
 */
export function useCurrentTime(updateIntervalMs: number = 60000): Date {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, updateIntervalMs);

    return () => clearInterval(timer);
  }, [updateIntervalMs]);

  return currentTime;
}
