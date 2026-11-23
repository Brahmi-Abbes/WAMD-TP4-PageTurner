// src/components/Cart.jsx
// Compact shopping bag panel on the right with checkout confirmation feedback.

import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCartItems,
  selectTotalQuantity,
  selectTotalPrice,
  clearCart
} from '../features/cart/cartSlice.js';
import CartItem from './CartItem.jsx';

const Cart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector(selectCartItems);
  const totalQuantity = useSelector(selectTotalQuantity);
  const totalPrice = useSelector(selectTotalPrice);

  const [checkoutNotice, setCheckoutNotice] = useState(false);

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setCheckoutNotice(true);
    dispatch(clearCart());
    setTimeout(() => {
      setCheckoutNotice(false);
    }, 4000);
  };

  return (
    <aside className="cart-panel" aria-label="Shopping Cart">
      <div className="cart-panel-header">
        <h3 className="cart-title">Cart ({totalQuantity})</h3>
        {cartItems.length > 0 && (
          <button
            type="button"
            className="btn-clear-cart"
            onClick={() => dispatch(clearCart())}
            title="Clear all books from cart"
          >
            Clear
          </button>
        )}
      </div>

      {checkoutNotice && (
        <div className="cart-checkout-notice">
          ✓ Order simulated successfully! Your books are on their way.
        </div>
      )}

      {cartItems.length === 0 ? (
        <p className="cart-empty">Your bag is empty.</p>
      ) : (
        <div className="cart-content">
          <ul className="cart-items">
            {cartItems.map((item) => (
              <CartItem key={item._id || item.id} item={item} />
            ))}
          </ul>

          <div className="cart-summary">
            <div className="cart-total-row">
              <span>Total:</span>
              <strong>{totalPrice.toLocaleString()} DA</strong>
            </div>

            <button
              type="button"
              className="btn-checkout"
              onClick={handleCheckout}
            >
              Checkout ({totalPrice.toLocaleString()} DA)
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Cart;
