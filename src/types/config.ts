export type Config = {
  event: {
    name: string; // 企画名
    startDate: string; // ISO 8601
    endDate: string; // ISO 8601
  };
  filters: {
    titleKeywords: string[]; // フィルタキーワード
    twitchGameIds?: string[]; // Twitchゲームでフィルタ
  };
  display: {
    defaultTimeRange: number; // 時間
    timeGridInterval: number; // 時間
  };
};
