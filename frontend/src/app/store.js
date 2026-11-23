// src/app/store.js
// Centralized Redux Store configuration for PageTurner Full-Stack Application

import { configureStore } from '@reduxjs/toolkit';
import cartReducer from '../features/cart/cartSlice.js';
import authReducer from '../features/auth/authSlice.js';
import productReducer from '../features/products/productSlice.js';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    auth: authReducer,
    products: productReducer
  }
});

export default store;
