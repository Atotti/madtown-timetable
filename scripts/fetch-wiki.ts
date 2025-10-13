import { writeFile } from "fs/promises";

const WIKI_URL = "https://w.atwiki.jp/madtowngta1/pages/12.html";
const OUTPUT_PATH = "data/raw.html";

async function main() {
  console.log("=== まとめwikiからHTMLを取得 ===\n");
  console.log(`📡 取得元: ${WIKI_URL}`);

  try {
    const response = await fetch(WIKI_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();

    // data/raw.htmlに保存
    await writeFile(OUTPUT_PATH, html, "utf-8");

    console.log(`✅ ${OUTPUT_PATH} に保存しました`);
    console.log(`📊 HTML サイズ: ${(html.length / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

main();
