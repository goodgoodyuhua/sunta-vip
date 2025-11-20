// js/page3.js

document.addEventListener("DOMContentLoaded", () => {
  const calendarDaysEl = document.getElementById("calendarDays");
  const totalPriceEl = document.getElementById("totalPrice");
  const bookingForm = document.getElementById("bookingForm");

  // 1. 讀取 localStorage 的資料 -------------------------
  const tripInfo = JSON.parse(localStorage.getItem("tripInfo") || "null");
  const cartItems = JSON.parse(localStorage.getItem("cartItems") || "[]");

  // 如果沒有任何行程，給一個提示
  if (!cartItems.length) {
    calendarDaysEl.innerHTML =
      "<p>目前沒有任何已選擇的行程，請回上一頁選擇景點。</p>";
    if (totalPriceEl) totalPriceEl.textContent = "0";
    return;
  }

  // 行程天數
  const days = tripInfo && tripInfo.days ? tripInfo.days : 1;
  const startDate = tripInfo && tripInfo.startDate ? new Date(tripInfo.startDate) : null;

  // 2. 建立 Day1 / Day2 / ... 欄位 -----------------------
  for (let i = 0; i < days; i++) {
    const dayColumn = document.createElement("div");
    dayColumn.classList.add("calendar-day");
    dayColumn.dataset.dayIndex = String(i);

    const header = document.createElement("div");
    header.classList.add("calendar-day-header");

    // 顯示日期標題
    let titleText = `Day ${i + 1}`;
    if (startDate) {
      const d = new Date(startDate.getTime());
      d.setDate(d.getDate() + i);
      titleText += `（${formatDate(d)}）`;
    }

    const headerTitle = document.createElement("div");
    headerTitle.classList.add("calendar-day-header-title");
    headerTitle.textContent = titleText;

    header.appendChild(headerTitle);

    const body = document.createElement("div");
    body.classList.add("calendar-day-body");
    body.style.minHeight = "260px";
    body.dataset.dayIndex = String(i);

    // drop 區域事件
    setupDropEvents(body);

    dayColumn.appendChild(header);
    dayColumn.appendChild(body);
    calendarDaysEl.appendChild(dayColumn);
  }

  // 3. 先把購物車行程平均分配到每天 ----------------------
  cartItems.forEach((item, idx) => {
    const dayIndex = idx % days; // 很簡單的「輪流分配」邏輯
    const body = calendarDaysEl.querySelector(
      `.calendar-day-body[data-day-index="${dayIndex}"]`
    );
    const eventEl = createEventElement(item, idx);
    body.appendChild(eventEl);
  });

  // 4. 計算總報價 ---------------------------------------
  updateTotalPrice();

  // 5. 表單送出 -----------------------------------------
  bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(bookingForm);
    const contact = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      lineId: formData.get("lineId"),
      note: formData.get("note")
    };

    // 簡單驗證一下必填欄位
    if (!contact.name || !contact.phone) {
      alert("請填寫姓名與聯絡電話，謝謝！");
      return;
    }

    // 讀出目前排程後的行程
    const itinerary = [];
    const dayColumns = calendarDaysEl.querySelectorAll(".calendar-day");

    dayColumns.forEach((dayCol) => {
      const dayLabel = dayCol.querySelector(".calendar-day-header-title").textContent;
      const events = [];

      dayCol.querySelectorAll(".calendar-event").forEach((ev) => {
        events.push({
          id: ev.dataset.id,
          name: ev.dataset.name,
          price: Number(ev.dataset.price) || 0
        });
      });

      itinerary.push({
        dayLabel,
        events
      });
    });

    const totalPrice = calcTotalPrice();

    const payload = {
      contact,
      tripInfo,
      totalPrice,
      itinerary,
      originalCartItems: cartItems
    };

    try {
      // TODO: 把下面網址換成你自己的 Google Apps Script Web App URL
      const scriptUrl = "https://script.google.com/macros/s/你的SCRIPT_ID/exec";

      const res = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("network error");

      // 看你的 Apps Script 回什麼，這裡先假設回傳 JSON
      // const result = await res.json();

      alert("行程已送出，我們會儘快與您聯絡！");
      // 可以清掉購物車
      // localStorage.removeItem("cartItems");
      // location.href = "thanks.html"; // 之後可以導到感謝頁面
    } catch (err) {
      console.error(err);
      alert("送出時發生錯誤，請稍後再試或直接聯絡客服，謝謝！");
    }
  });

  // ----------------------------------------------------------------
  // 工具 function
  // ----------------------------------------------------------------

  function createEventElement(item, idx) {
    const el = document.createElement("div");
    el.classList.add("calendar-event");
    el.draggable = true;

    // dataset
    el.dataset.uid = "ev-" + idx; // 拖拉識別用
    el.dataset.id = item.id || "";
    el.dataset.name = item.name || "";
    el.dataset.price = item.price || 0;

    el.style.border = "1px solid #ddd";
    el.style.borderRadius = "8px";
    el.style.padding = "8px";
    el.style.marginBottom = "6px";
    el.style.background = "#fff";
    el.style.cursor = "grab";

    el.innerHTML = `
      <div style="font-weight:bold; font-size:14px;">${item.name || "未命名景點"}</div>
      <div style="font-size:12px; color:#666; margin-top:4px;">
        NT$ ${item.price || 0}
      </div>
    `;

    // drag 事件
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", el.dataset.uid);
      el.classList.add("dragging");
    });

    el.addEventListener("dragend", () => {
      el.classList.remove("dragging");
    });

    return el;
  }

  function setupDropEvents(dropArea) {
    dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropArea.classList.add("drag-over");
    });

    dropArea.addEventListener("dragleave", () => {
      dropArea.classList.remove("drag-over");
    });

    dropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      dropArea.classList.remove("drag-over");

      const uid = e.dataTransfer.getData("text/plain");
      if (!uid) return;

      const eventEl = document.querySelector(
        `.calendar-event[data-uid="${uid}"]`
      );
      if (eventEl) {
        dropArea.appendChild(eventEl);
      }

      // 拖拉只是換天，總價不會變，所以不用重算
      // 但如果之後有「天數影響價格」之類的規則可以在這裡加
    });
  }

  function calcTotalPrice() {
    const events = document.querySelectorAll(".calendar-event");
    let total = 0;
    events.forEach((ev) => {
      total += Number(ev.dataset.price) || 0;
    });
    return total;
  }

  function updateTotalPrice() {
    const total = calcTotalPrice();
    if (totalPriceEl) totalPriceEl.textContent = total.toLocaleString("zh-TW");
  }

  function formatDate(d) {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${m}/${day}`;
  }
});
