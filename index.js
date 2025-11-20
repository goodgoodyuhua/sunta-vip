// js/index.js

document.addEventListener("DOMContentLoaded", () => {
  const startDateInput = document.getElementById("startDateInput");
  const endDateInput = document.getElementById("endDateInput");
  const peopleInput = document.getElementById("peopleInput");
  const countrySelect = document.getElementById("countrySelect");
  const citySelect = document.getElementById("citySelect");
  const startSelectBtn = document.getElementById("startSelectBtn");

  // 簡單的國家 → 城市對應
  const CITY_OPTIONS = {
    "日本": ["福岡", "佐世保"]
    // 之後可以再加其他國家
  };

  // 當國家改變時，更新城市選單
  countrySelect.addEventListener("change", () => {
    const country = countrySelect.value;
    updateCityOptions(country);
  });

  function updateCityOptions(country) {
    citySelect.innerHTML = ""; // 清空
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = country ? "請選擇城市" : "請先選國家";
    citySelect.appendChild(placeholder);

    const cities = CITY_OPTIONS[country] || [];
    cities.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      citySelect.appendChild(opt);
    });
  }

  // 讀取之前的 tripInfo（如果有的話就帶回來）
  const savedTripInfo = JSON.parse(localStorage.getItem("tripInfo") || "null");
  if (savedTripInfo) {
    if (savedTripInfo.startDate) startDateInput.value = savedTripInfo.startDate;
    if (savedTripInfo.endDate) endDateInput.value = savedTripInfo.endDate;
    if (savedTripInfo.people) peopleInput.value = savedTripInfo.people;
    if (savedTripInfo.country) {
      countrySelect.value = savedTripInfo.country;
      updateCityOptions(savedTripInfo.country);
    }
    if (savedTripInfo.city) citySelect.value = savedTripInfo.city;
  }

  // 點擊「開始選景點」
  startSelectBtn.addEventListener("click", () => {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const people = Number(peopleInput.value) || 0;
    const country = countrySelect.value;
    const city = citySelect.value;

    if (!startDate) {
      alert("請先選擇出發日期喔！");
      return;
    }
    if (!people || people < 1) {
      alert("請輸入正確的人數（至少 1 人）");
      return;
    }
    if (!country) {
      alert("請選擇國家");
      return;
    }
    if (!city) {
      alert("請選擇城市");
      return;
    }

    // 計算天數（若沒選結束日，就先算 1 天）
    let days = 1;
    if (endDate) {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const diffMs = d2.getTime() - d1.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      days = diffDays + 1; // 含首尾
      if (days < 1) days = 1;
    }

    const tripInfo = {
      startDate,
      endDate: endDate || "",
      people,
      country,
      city,
      days
    };

    localStorage.setItem("tripInfo", JSON.stringify(tripInfo));

    // 第一次選行程也可以把舊的 cart 清掉（避免舊資料干擾）
    // 如果你不想清除，可以註解掉
    localStorage.removeItem("cartItems");

    // 前往第二頁
    window.location.href = "page2.html";
  });
});
