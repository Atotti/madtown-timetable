import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type HowToUseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HowToUseModal({ open, onOpenChange }: HowToUseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            タイムテーブルの使い方
          </DialogTitle>
          <DialogDescription>
            このタイムテーブルの便利な機能を紹介します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 配信の再生 */}
          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">🎬</span>
              配信の再生
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>配信カードをクリック</strong>
                すると、クリックした位置の時刻から動画が再生されます。
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>カードの上部をクリック → 配信開始付近から再生</li>
                <li>カードの中央をクリック → 配信の中盤から再生</li>
                <li>カードの下部をクリック → 配信の終盤から再生</li>
              </ul>
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-2">
                <p className="text-green-800">
                  <strong className="text-green-600">緑色のバー</strong>
                  が表示され、他視点の再生位置も確認できます
                </p>
              </div>
            </div>
          </section>

          {/* URL共有機能 */}
          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">🔗</span>
              URL共有機能
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                タイムテーブルの特定の時刻をURLで共有できます。選択したタグやピン留めも共有URLに含まれます。
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>
                  ヘッダーの
                  <strong className="text-blue-600">「共有」ボタン</strong>
                  をクリック
                </li>
                <li>
                  <strong className="text-blue-600">青いバー</strong>
                  が表示されるので、ドラッグして共有したい時刻に移動
                </li>
                <li>
                  <strong>「URLをコピー」ボタン</strong>
                  をクリックして共有
                </li>
              </ol>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mt-2">
                <p className="text-blue-800">
                  URLを開いた人には、
                  <strong className="text-blue-600">青いバー</strong>
                  でその時刻が表示されます
                </p>
              </div>
            </div>
          </section>

          {/* フィルター機能 */}
          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">🏷️</span>
              フィルター機能
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                職業や組織のタグをクリックして、特定のチャンネルだけ表示できます。
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  チャンネルヘッダーの<strong>タグをクリック</strong>
                  するとフィルタリング
                </li>
                <li>
                  複数のタグを選択すると、いずれかに該当するチャンネルを表示
                </li>
                <li>
                  ヘッダー上部の<strong>「×」ボタン</strong>
                  でフィルターを解除
                </li>
              </ul>
            </div>
          </section>

          {/* ピン留め機能 */}
          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">📌</span>
              ピン留め機能
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>お気に入りのチャンネルを固定して、常に左側に表示できます。</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  チャンネルヘッダー右上の
                  <strong className="text-yellow-600">黄色いピンボタン</strong>
                  をクリック
                </li>
                <li>ピン留めされたチャンネルは常に最左側に表示されます</li>
                <li>もう一度クリックでピン留めを解除できます</li>
              </ul>
            </div>
          </section>

          {/* 時間帯ナビゲーション */}
          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">📅</span>
              時間帯ナビゲーション
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>素早く目的の時間帯に移動できます。</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>「現在時刻に戻る」ボタン</strong>：現在時刻に移動
                </li>
                <li>
                  <strong>カレンダーアイコン</strong>
                  ：特定の日付の17時に移動
                </li>
                <li>
                  マウスホイールや縦スクロールで時間軸を自由に移動できます
                </li>
              </ul>
            </div>
          </section>

          {/* インジケーター説明 */}
          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">📍</span>
              時刻インジケーター
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>タイムテーブル上に表示される横線の意味：</p>
              <div className="space-y-2 ml-4">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5 bg-red-500"></div>
                  <span>
                    <strong className="text-red-600">赤：現在時刻</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5 bg-blue-500"></div>
                  <span>
                    <strong className="text-blue-600">
                      青：共有された時刻
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-0.5 bg-green-500"></div>
                  <span>
                    <strong className="text-green-600">緑：再生位置</strong>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* その他のTips */}
          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              その他のTips
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  <strong>横スクロール</strong>
                  でチャンネル一覧を移動できます
                </li>
                <li>
                  配信が少ない時間帯は<strong>グレーアウト</strong>
                  されて見やすくなっています
                </li>
                <li>
                  <strong>LIVE</strong>
                  バッジが付いている配信は現在配信中です
                </li>
              </ul>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
