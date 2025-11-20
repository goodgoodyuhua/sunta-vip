// js/data.js

// 請把這個換成你剛剛部署好的 Apps Script 網址
const SPOTS_API_URL = "https://script.google.com/macros/s/你的SCRIPT_ID/exec";

// 提供一個全域函式給其他 JS 呼叫
window.loadSpots = async function () {
  try {
    const res = await fetch(SPOTS_API_URL);
    if (!res.ok) throw new Error("network error");

    const json = await res.json();
    // 期待格式：{ spots: [...] }
    if (!json || !Array.isArray(json.spots)) {
      console.warn("API 回傳格式不如預期", json);
      return [];
    }
    return json.spots;
  } catch (err) {
    console.error("載入景點資料失敗：", err);
    return [];
  }
};
