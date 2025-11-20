// js/spotsService.js

const SpotsService = {
  async load() {
    // 先試著用 Google 試算表
    if (CONFIG && CONFIG.GOOGLE_SPOTS_API_ENDPOINT) {
      try {
        const res = await fetch(CONFIG.GOOGLE_SPOTS_API_ENDPOINT);
        if (res.ok) {
          const json = await res.json();
          const arr = Array.isArray(json) ? json : json.spots || [];
          const normalized = arr.map((row, i) => ({
            id: row.id || `API-SPOT-${i}`,
            country: row.country || "",
            city: row.city || "",
            name: row.name || "",
            durationHour: Number(row.durationHour) || 0,
            basePrice: Number(row.basePrice) || 0,
            desc: row.desc || row.description || ""
          }));
          if (normalized.length) return normalized;
        }
      } catch (err) {
        console.warn("SpotsService: API 失敗，改用 data.js", err);
      }
    }

    // API 不通，用 data.js 裡的 spots
    if (typeof spots !== "undefined" && Array.isArray(spots)) {
      return spots.map((s, i) => ({
        id: s.id || `LOCAL-SPOT-${i}`,
        country: s.country || "",
        city: s.city || "",
        name: s.name || "",
        durationHour: Number(s.durationHour) || 0,
        basePrice: Number(s.basePrice) || 0,
        desc: s.desc || ""
      }));
    }

    return [];
  }
};
