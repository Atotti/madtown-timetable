/**
 * YouTube動画のURLを生成（再生位置指定付き）
 *
 * @param videoId YouTube動画ID
 * @param startSeconds 再生開始位置（秒）。指定しない場合は先頭から
 * @returns YouTube動画URL
 */
export function buildYouTubeUrl(
  videoId: string,
  startSeconds?: number,
): string {
  const baseUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (startSeconds !== undefined && startSeconds > 0) {
    // 小数点以下を切り捨て
    const seconds = Math.floor(startSeconds);
    return `${baseUrl}&t=${seconds}s`;
  }

  return baseUrl;
}

/**
 * Twitch動画のURLを生成（再生位置指定付き）
 *
 * @param videoId Twitch動画ID
 * @param startSeconds 再生開始位置（秒）。指定しない場合は先頭から
 * @returns Twitch動画URL
 */
export function buildTwitchUrl(videoId: string, startSeconds?: number): string {
  const baseUrl = `https://www.twitch.tv/videos/${videoId}`;

  if (startSeconds !== undefined && startSeconds > 0) {
    const timeParam = formatTwitchTime(startSeconds);
    return `${baseUrl}?t=${timeParam}`;
  }

  return baseUrl;
}

/**
 * 秒数をTwitchの時刻フォーマット（1h2m3s）に変換
 *
 * @param seconds 秒数
 * @returns "1h2m3s" 形式の文字列
 */
function formatTwitchTime(seconds: number): string {
  const totalSeconds = Math.floor(seconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 || parts.length === 0) {
    // 0秒の場合も "0s" を返す
    parts.push(`${secs}s`);
  }

  return parts.join("");
}
