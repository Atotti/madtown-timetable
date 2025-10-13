// グリッドレイアウトの定数
export const GRID_CONFIG = {
  HOUR_HEIGHT: 60, // 1時間の高さ（px）- active時
  INACTIVE_HOUR_HEIGHT: 30, // 1時間の高さ（px）- inactive時
  CHANNEL_WIDTH: 200, // 1チャンネルの幅（px）
  TIME_LABEL_WIDTH: 60, // 時刻ラベルの幅（px）
  HEADER_HEIGHT: 60, // ヘッダーの高さ（px）
  MIN_CARD_HEIGHT: 40, // 配信カードの最小高さ（px）
  INACTIVE_HOUR_THRESHOLD: 5, // この人数以下の時間帯を非アクティブ時間とみなす
} as const;

// 配信カードの表示閾値
export const CARD_DISPLAY_THRESHOLDS = {
  SHOW_THUMBNAIL: 60, // サムネイル表示の最小高さ（px）
  SHOW_TIME: 40, // 時間表示の最小高さ（px）は
  SHOW_TITLE_ONLY: 20, // タイトルのみ表示の最小高さ（px）
} as const;

// 職業ごとの色定義（未選択時）
export const JOB_COLORS: Record<string, string> = {
  ギャング: "bg-red-50 border-red-200",
  警察: "bg-blue-50 border-blue-200",
  救急隊: "bg-green-50 border-green-200",
  メカニック: "bg-orange-50 border-orange-200",
  カーディーラー: "bg-yellow-50 border-yellow-200",
  スーパーマーケット: "bg-lime-50 border-lime-200",
  不動産: "bg-cyan-50 border-cyan-200",
  飲食店: "bg-pink-50 border-pink-200",
  タクシー運転手: "bg-amber-50 border-amber-200",
  聖職者: "bg-purple-50 border-purple-200",
  イベントプロデューサー: "bg-fuchsia-50 border-fuchsia-200",
  プール清掃員: "bg-sky-50 border-sky-200",
} as const;

// 職業ごとの色定義（選択時）
export const JOB_COLORS_SELECTED: Record<string, string> = {
  ギャング: "bg-red-100 border-red-300",
  警察: "bg-blue-100 border-blue-300",
  救急隊: "bg-green-100 border-green-300",
  メカニック: "bg-orange-100 border-orange-300",
  カーディーラー: "bg-yellow-100 border-yellow-300",
  スーパーマーケット: "bg-lime-100 border-lime-300",
  不動産: "bg-cyan-100 border-cyan-300",
  飲食店: "bg-pink-100 border-pink-300",
  タクシー運転手: "bg-amber-100 border-amber-300",
  聖職者: "bg-purple-100 border-purple-300",
  イベントプロデューサー: "bg-fuchsia-100 border-fuchsia-300",
  プール清掃員: "bg-sky-100 border-sky-300",
} as const;
