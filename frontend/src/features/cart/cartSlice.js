// src/features/cart/cartSlice.js
// Redux Toolkit Slice: defines the cart state, reducers, and selectors for PageTurner.

import { createSlice } from '@reduxjs/toolkit';

// Optional Feature: Load persisted cart from localStorage safely
const loadCartFromStorage = () => {
  if (typeof localStorage === 'undefined') {
    return { items: [] };
  }
  try {
    const saved = localStorage.getItem('pageturner_cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed.items)) {
        return { items: parsed.items };
      }
    }
  } catch (error) {
    console.warn('Could not read cart from localStorage:', error);
  }
  return { items: [] };
};

// Helper to save current cart items to localStorage
const saveCartToStorage = (items) => {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem('pageturner_cart', JSON.stringify({ items }));
  } catch (error) {
    console.warn('Could not write cart to localStorage:', error);
  }
};

const initialState = loadCartFromStorage();

// Helper to compare items whether using numeric id or string MongoDB _id
const matchesId = (item, target) => {
  if (!item) return false;
  const itemKey = item._id !== undefined ? item._id : item.id;
  return String(itemKey) === String(target);
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // 1. Action: addToCart
    // If the book already exists in the cart, increase its quantity by 1.
    // If it is a new book, add it with an initial quantity of 1.
    addToCart: (state, action) => {
      const book = action.payload;
      const targetId = book._id !== undefined ? book._id : book.id;
      const existingItem = state.items.find((item) => matchesId(item, targetId));

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({
          ...book,
          id: book.id !== undefined ? book.id : book._id,
          _id: book._id !== undefined ? book._id : book.id,
          title: book.title || book.name || 'Untitled Book',
          author: book.author || book.description || 'Unknown Author',
          cover: book.cover || book.imageUrl || '',
          price: Number(book.price) || 0,
          quantity: 1
        });
      }
      saveCartToStorage(state.items);
    },

    // 2. Action: removeFromCart
    // Removes the book completely from the cart by its ID.
    removeFromCart: (state, action) => {
      const targetId = action.payload;
      state.items = state.items.filter((item) => !matchesId(item, targetId));
      saveCartToStorage(state.items);
    },

    // 3. Action: increaseQuantity
    // Increments the quantity of an existing cart item by 1.
    increaseQuantity: (state, action) => {
      const targetId = action.payload;
      const item = state.items.find((item) => matchesId(item, targetId));
      if (item) {
        item.quantity += 1;
        saveCartToStorage(state.items);
      }
    },

    // 4. Action: decreaseQuantity
    // Decrements the quantity by 1, with a guard preventing quantities below 1.
    decreaseQuantity: (state, action) => {
      const targetId = action.payload;
      const item = state.items.find((item) => matchesId(item, targetId));
      if (item && item.quantity > 1) {
        item.quantity -= 1;
        saveCartToStorage(state.items);
      }
    },

    // 5. Action: clearCart
    // Resets the cart to an empty state.
    clearCart: (state) => {
      state.items = [];
      saveCartToStorage(state.items);
    }
  }
});

// Export action creators (used in components with useDispatch)
export const {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart
} = cartSlice.actions;

// Selectors: Helper functions to derive values from Redux state (used with useSelector)
export const selectCartItems = (state) => state.cart.items;

export const selectTotalQuantity = (state) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

export const selectTotalPrice = (state) =>
  state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

// Export reducer for registration in store.js
export default cartSlice.reducer;
