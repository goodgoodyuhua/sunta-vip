// js/cart.js

const Cart = {
  getAll() {
    return Storage.getCart();
  },

  add(item) {
    const cart = Storage.getCart();
    cart.push(item);
    Storage.setCart(cart);
    return cart;
  },

  remove(index) {
    const cart = Storage.getCart();
    cart.splice(index, 1);
    Storage.setCart(cart);
    return cart;
  },

  clear() {
    Storage.clearCart();
  },

  totalPrice() {
    const cart = Storage.getCart();
    return cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }
};
