// js/storage.js

const Storage = {
  getTripInfo() {
    try {
      return JSON.parse(localStorage.getItem("tripInfo") || "null");
    } catch {
      return null;
    }
  },

  setTripInfo(info) {
    localStorage.setItem("tripInfo", JSON.stringify(info));
  },

  getCart() {
    try {
      const c = JSON.parse(localStorage.getItem("cartItems") || "[]");
      return Array.isArray(c) ? c : [];
    } catch {
      return [];
    }
  },

  setCart(cart) {
    localStorage.setItem("cartItems", JSON.stringify(cart));
  },

  clearCart() {
    localStorage.removeItem("cartItems");
  }
};
