// src/components/Header.jsx
// PageTurner Navigation Header with Authentication controls and Shopping Bag count.

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTotalQuantity } from '../features/cart/cartSlice.js';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  logout
} from '../features/auth/authSlice.js';

const Header = ({ onOpenAuth, onOpenAddProduct }) => {
  const dispatch = useDispatch();
  const totalQuantity = useSelector(selectTotalQuantity);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUser = useSelector(selectCurrentUser);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <header className="header">
      <div className="container header-container">
        <div className="header-brand">
          <h1 className="logo">PageTurner</h1>
          <span className="tagline">Independent Bookstore</span>
        </div>

        <div className="header-actions">
          {isAuthenticated ? (
            <div className="auth-user-bar">
              <span className="user-greeting">
                Hi, <strong>{currentUser?.name || 'Reader'}</strong>
              </span>

              <button
                type="button"
                className="btn-header-add"
                onClick={onOpenAddProduct}
                title="Add a new book to the MongoDB catalog"
              >
                + Add Book
              </button>

              <button
                type="button"
                className="btn-header-auth"
                onClick={handleLogout}
                title="Sign out of your account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-header-auth btn-primary-auth"
              onClick={onOpenAuth}
            >
              Sign In / Register
            </button>
          )}

          <div className="cart-count-header" title="Current items in shopping bag">
            Cart ({totalQuantity})
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
