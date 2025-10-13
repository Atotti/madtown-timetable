// グリッドレイアウトの定数
export const GRID_CONFIG = {
  HOUR_HEIGHT: 60, // 1時間の高さ（px）
  CHANNEL_WIDTH: 200, // 1チャンネルの幅（px）
  TIME_LABEL_WIDTH: 60, // 時刻ラベルの幅（px）
  HEADER_HEIGHT: 60, // ヘッダーの高さ（px）
  MIN_CARD_HEIGHT: 40, // 配信カードの最小高さ（px）
  INACTIVE_HOUR_THRESHOLD: 3, // この人数以下の時間帯を非アクティブ時間とみなす
} as const;

// 配信カードの表示閾値
export const CARD_DISPLAY_THRESHOLDS = {
  SHOW_THUMBNAIL: 60, // サムネイル表示の最小高さ（px）
  SHOW_TIME: 40, // 時間表示の最小高さ（px）は
  SHOW_TITLE_ONLY: 20, // タイトルのみ表示の最小高さ（px）
} as const;
