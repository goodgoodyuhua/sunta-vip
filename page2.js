// js/page2.js
// 頁面：Step 2 選景點
// 依賴的模組（如果有）：CONFIG, Storage, SpotsService, Cart
// 如果沒有這些模組，程式會自動退回 localStorage / data.js / HTML 示意卡

document.addEventListener("DOMContentLoaded", () => {
  // ---------- 抓 DOM ----------
  const tripInfoChipsEl = document.getElementById("tripInfoChips2");
  const spotsListEl = document.getElementById("spotsList");
  const cartListEl = document.getElementById("cartList");
  const cartCountBadgeEl = document.getElementById("cartCountBadge");
  const cartEmptyTextEl = document.getElementById("cartEmptyText");
  const goScheduleLinkEl = document.getElementById("goScheduleLink");

  // 左邊「可選景點」卡片上的城市 badge （沒 id，只能這樣抓）
  const cityBadgeEl = (() => {
    const badges = document.querySelectorAll(".card-title .badge");
    for (const b of badges) {
      if (b.id !== "cartCountBadge") return b;
    }
    return null;
  })();

  // ---------- 讀 tripInfo ----------
  const tripInfo = getTripInfo();
  renderTripInfoChips(tripInfo);

  if (cityBadgeEl) {
    if (tripInfo && tripInfo.city) {
      cityBadgeEl.textContent = `目前顯示：${tripInfo.country || ""} ${
        tripInfo.city
      }`;
    } else {
      cityBadgeEl.textContent = "目前顯示：全部城市";
    }
  }

  // ---------- 購物車狀態 ----------
  let cart = getCart();
  renderCart();
  updateCartBadge();

  // ---------- 初始化景點列表 ----------
  initSpots();

  async function initSpots() {
    const spotsData = await loadSpotsData();

    if (spotsData && spotsData.length > 0) {
      renderSpotsFromData(spotsData, tripInfo);
    } else {
      // API / data.js 都沒有，就用 HTML 原本示意卡（你 page2.html 裡那兩張）
      initFallbackSpotsFromHTML();
    }
  }

  // =====================================================
  //  Trip Info 顯示
  // =====================================================
  function getTripInfo() {
    // 優先用 Storage 模組
    if (window.Storage && typeof Storage.getTripInfo === "function") {
      return Storage.getTripInfo();
    }
    // 沒有 Storage 就直接讀 localStorage
    try {
      return JSON.parse(localStorage.getItem("tripInfo") || "null");
    } catch {
      return null;
    }
  }

  function renderTripInfoChips(info) {
    if (!tripInfoChipsEl) return;

    if (!info) {
      tripInfoChipsEl.innerHTML = `
        <span class="chip">尚未輸入出發資訊</span>
        <span class="chip">請回首頁填寫 Step 1</span>
      `;
      return;
    }

    const chips = [];

    if (info.startDate) {
      chips.push(`<span class="chip">出發日期：${info.startDate}</span>`);
    }
    if (info.endDate) {
      chips.push(`<span class="chip">結束日期：${info.endDate}</span>`);
    } else if (info.days) {
      chips.push(`<span class="chip">旅遊天數：約 ${info.days} 天</span>`);
    }

    if (info.people) {
      chips.push(`<span class="chip">人數：${info.people} 人</span>`);
    }
    if (info.country && info.city) {
      chips.push(
        `<span class="chip">目的地：${info.country}・${info.city}</span>`
      );
    }

    tripInfoChipsEl.innerHTML = chips.join("");
  }

  // =====================================================
  //  Spots 資料來源（SpotsService > data.js > HTML 示意）
  // =====================================================
  async function loadSpotsData() {
    // 1) 有 SpotsService 就先用它（裡面可以自己處理 Google 試算表 / data.js fallback）
    if (window.SpotsService && typeof SpotsService.load === "function") {
      try {
        const list = await SpotsService.load();
        if (Array.isArray(list) && list.length) return list;
      } catch (err) {
        console.warn("SpotsService.load 發生錯誤：", err);
      }
    }

    // 2) 沒 SpotsService 就直接用 data.js 的 spots
    if (typeof window.spots !== "undefined" && Array.isArray(window.spots)) {
      return window.spots.map((s, i) => ({
        id: s.id || `LOCAL-SPOT-${i}`,
        country: s.country || "",
        city: s.city || "",
        name: s.name || "",
        durationHour: Number(s.durationHour) || 0,
        basePrice: Number(s.basePrice) || 0,
        desc: s.desc || ""
      }));
    }

    // 3) 都沒有就回傳空陣列，稍後會 fallback 用 HTML 示意卡片
    return [];
  }

  function renderSpotsFromData(allSpots, info) {
    if (!spotsListEl) return;
    spotsListEl.innerHTML = "";

    const filtered = allSpots.filter((spot) => {
      if (!info || !info.city) return true; // 如果 tripInfo 沒選城市，就全部顯示
      if (!spot.city) return true;
      return spot.city === info.city;
    });

    if (!filtered.length) {
      spotsListEl.innerHTML = `
        <p style="padding:8px;">
          目前這個城市尚未設定景點，請稍後再試或聯絡客服。
        </p>
      `;
      return;
    }

    filtered.forEach((spot, index) => {
      const card = document.createElement("div");
      card.classList.add("spot-card");

      const name = spot.name || "未命名景點";
      const city = spot.city || "";
      const desc = spot.desc || "";
      const durationHour = Number(spot.durationHour) || 0;
      const basePrice = Number(spot.basePrice) || 0;

      const stayText = durationHour
        ? `建議停留：約 ${durationHour} 小時`
        : "";
      const priceText = basePrice
        ? `NT$ ${basePrice.toLocaleString("zh-TW")}`
        : "價格請洽客服";

      card.innerHTML = `
        <div class="spot-thumb">${spot.thumb || "景點示意圖"}</div>
        <div class="spot-title-row">
          <div class="spot-title">${name}</div>
          <div class="spot-city-tag">${city}</div>
        </div>
        <div class="spot-desc">${desc}</div>
        <div class="spot-meta">
          <span>${stayText}</span>
          <span class="spot-price">${priceText}</span>
        </div>
        <div class="spot-actions">
          <button class="btn btn-primary add-to-cart-btn" data-spot-index="${index}">
            加入行程
          </button>
        </div>
      `;

      spotsListEl.appendChild(card);
    });

    // 綁定「加入行程」按鈕
    spotsListEl.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = Number(e.currentTarget.dataset.spotIndex);
        const spot = filtered[idx];
        if (!spot) return;

        const cartItem = {
          id: spot.id || `SPOT-${idx}`,
          name: spot.name || "未命名景點",
          city: spot.city || "",
          price: Number(spot.basePrice) || 0,
          stayHours: spot.durationHour || "",
          description: spot.desc || ""
        };

        cart = addToCart(cartItem);
        renderCart();
        updateCartBadge();
      });
    });
  }

  // 如果沒有任何資料來源，就用 page2.html 裡原本的示意卡片
  function initFallbackSpotsFromHTML() {
    if (!spotsListEl) return;

    const cards = spotsListEl.querySelectorAll(".spot-card");
    if (!cards.length) {
      spotsListEl.innerHTML = `
        <p style="padding:8px;">
          目前沒有任何景點資料，請稍後再試。
        </p>
      `;
      return;
    }

    cards.forEach((card, index) => {
      const btn =
        card.querySelector(".add-to-cart-btn") ||
        card.querySelector(".btn.btn-primary");
      if (!btn) return;

      btn.addEventListener("click", () => {
        const name =
          (card.querySelector(".spot-title") || {}).textContent ||
          "未命名景點";
        const city =
          (card.querySelector(".spot-city-tag") || {}).textContent || "";
        const priceText =
          (card.querySelector(".spot-price") || {}).textContent || "0";
        const price = parsePrice(priceText);
        const desc =
          (card.querySelector(".spot-desc") || {}).textContent || "";

        const cartItem = {
          id: `HTML-SPOT-${index}`,
          name,
          city,
          price,
          stayHours: "",
          description: desc
        };

        cart = addToCart(cartItem);
        renderCart();
        updateCartBadge();
      });
    });
  }

  // =====================================================
  //  購物車相關（優先用 Cart 模組）
  // =====================================================
  function getCart() {
    if (window.Cart && typeof Cart.getAll === "function") {
      return Cart.getAll();
    }
    // fallback：直接用 Storage / localStorage
    if (window.Storage && typeof Storage.getCart === "function") {
      return Storage.getCart();
    }
    try {
      const c = JSON.parse(localStorage.getItem("cartItems") || "[]");
      return Array.isArray(c) ? c : [];
    } catch {
      return [];
    }
  }

  function setCart(newCart) {
    // 同步到模組或 localStorage
    if (window.Cart && typeof Cart.setAll === "function") {
      Cart.setAll(newCart);
    } else if (window.Storage && typeof Storage.setCart === "function") {
      Storage.setCart(newCart);
    } else {
      localStorage.setItem("cartItems", JSON.stringify(newCart));
    }
    return newCart;
  }

  function addToCart(item) {
    if (window.Cart && typeof Cart.add === "function") {
      return Cart.add(item);
    }
    const current = getCart();
    current.push(item);
    return setCart(current);
  }

  function removeFromCart(index) {
    if (window.Cart && typeof Cart.remove === "function") {
      return Cart.remove(index);
    }
    const current = getCart();
    current.splice(index, 1);
    return setCart(current);
  }

  function renderCart() {
    if (!cartListEl) return;

    cartListEl.innerHTML = "";
    cart = getCart();

    if (!cart.length) {
      if (cartEmptyTextEl) cartEmptyTextEl.style.display = "block";
      return;
    }

    if (cartEmptyTextEl) cartEmptyTextEl.style.display = "none";

    cart.forEach((item, index) => {
      const li = document.createElement("li");
      li.classList.add("cart-item");

      li.innerHTML = `
        <div class="cart-item-main">
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-sub">
            ${item.city ? `<span>${item.city}</span>` : ""}
            <span>NT$ ${Number(item.price || 0).toLocaleString("zh-TW")}</span>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm cart-remove-btn" data-index="${index}">
          移除
        </button>
      `;

      cartListEl.appendChild(li);
    });

    cartListEl.querySelectorAll(".cart-remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = Number(e.currentTarget.dataset.index);
        cart = removeFromCart(idx);
        renderCart();
        updateCartBadge();
      });
    });
  }

  function updateCartBadge() {
    if (!cartCountBadgeEl) return;
    cart = getCart();
    cartCountBadgeEl.textContent = `${cart.length} 個景點`;
  }

  // =====================================================
  //  其他小工具 & 下一步檢查
  // =====================================================
  function parsePrice(text) {
    const numStr = text.replace(/[^\d]/g, "");
    const n = Number(numStr);
    return Number.isFinite(n) ? n : 0;
  }

  if (goScheduleLinkEl) {
    goScheduleLinkEl.addEventListener("click", (e) => {
      const currentCart = getCart();
      if (!currentCart.length) {
        e.preventDefault();
        alert("請先至少加入一個景點，再前往第三步排行程喔！");
      }
    });
  }
});
