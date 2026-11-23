// src/components/CartItem.jsx
// Displays an individual cart line with quantity controls (+ / -) and removal.

import React from 'react';
import { useDispatch } from 'react-redux';
import {
  increaseQuantity,
  decreaseQuantity,
  removeFromCart
} from '../features/cart/cartSlice.js';

const CartItem = ({ item }) => {
  const dispatch = useDispatch();
  const itemId = item.id !== undefined ? item.id : item._id;

  return (
    <li className="cart-item">
      <div className="cart-item-details">
        <h4 className="cart-item-title">{item.title || item.name}</h4>
        <span className="cart-item-author">{item.author || item.description}</span>
        <div className="cart-item-controls">
          {/* Quantity stepper */}
          <div className="quantity-controls">
            <button
              type="button"
              className="btn-qty"
              onClick={() => dispatch(decreaseQuantity(itemId))}
              disabled={item.quantity <= 1}
              aria-label={`Decrease quantity of ${item.title || item.name}`}
              title={item.quantity <= 1 ? 'Minimum quantity is 1' : 'Decrease quantity'}
            >
              −
            </button>
            <span className="cart-item-qty" aria-label={`Quantity: ${item.quantity}`}>
              {item.quantity}
            </span>
            <button
              type="button"
              className="btn-qty"
              onClick={() => dispatch(increaseQuantity(itemId))}
              aria-label={`Increase quantity of ${item.title || item.name}`}
            >
              +
            </button>
          </div>

          {/* Line subtotal */}
          <span className="cart-item-subtotal">
            {(item.price * item.quantity).toLocaleString()} DA
          </span>
        </div>
      </div>

      <button
        type="button"
        className="btn-remove"
        onClick={() => dispatch(removeFromCart(itemId))}
        aria-label={`Remove ${item.title || item.name} from cart`}
      >
        Remove
      </button>
    </li>
  );
};

export default CartItem;
