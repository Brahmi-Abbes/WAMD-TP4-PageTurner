/**
 * BookDetailModal Component
 * Shows complete product details (synopsis, category, stock, price) with options to Add to Cart, Edit, or Delete.
 */
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice.js';
import { selectIsAuthenticated } from '../features/auth/authSlice.js';

const FALLBACK_COVER =
  'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260"><rect width="200" height="260" fill="%23efebe3"/><text x="100" y="135" fill="%239a9388" font-family="sans-serif" font-size="13" text-anchor="middle">No cover</text></svg>';

const BookDetailModal = ({ book, isOpen, onClose, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [justAdded, setJustAdded] = useState(false);

  if (!isOpen || !book) return null;

  const title = book.name || book.title || 'Untitled Book';
  const authorOrDesc = book.description || book.author || 'No description available.';
  const coverUrl = book.imageUrl || book.cover || '';
  const price = Number(book.price) || 0;
  const stock = book.stock !== undefined ? book.stock : null;
  const isOutOfStock = stock !== null && stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    dispatch(addToCart(book));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card book-detail-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-detail-title"
      >
        <div className="modal-header">
          <span className="book-category">{book.category}</span>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="modal-body book-detail-body">
          <div className="book-detail-grid">
            <div className="book-detail-image-wrap">
              <img
                src={coverUrl}
                alt={title}
                className="book-detail-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = FALLBACK_COVER;
                }}
              />
            </div>

            <div className="book-detail-info">
              <h2 id="book-detail-title" className="book-detail-title">
                {title}
              </h2>

              <div className="book-detail-meta">
                <span className="book-detail-price">
                  {price.toLocaleString()} DA
                </span>
                {stock !== null && (
                  <span
                    className={`stock-badge ${
                      isOutOfStock ? 'stock-out' : 'stock-in'
                    }`}
                  >
                    {isOutOfStock ? 'Out of Stock' : `${stock} available`}
                  </span>
                )}
              </div>

              <div className="book-detail-description">
                <h4>About this book</h4>
                <p>{authorOrDesc}</p>
              </div>

              <div className="book-detail-actions">
                <button
                  type="button"
                  className={`btn-add btn-detail-add ${justAdded ? 'btn-added' : ''}`}
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock
                    ? 'Out of Stock'
                    : justAdded
                    ? 'Added to Bag ✓'
                    : 'Add to Bag'}
                </button>

                {isAuthenticated && (
                  <div className="book-admin-actions">
                    <button
                      type="button"
                      className="btn-admin btn-edit"
                      onClick={() => {
                        onClose();
                        onEdit(book);
                      }}
                    >
                      ✎ Edit Book
                    </button>
                    <button
                      type="button"
                      className="btn-admin btn-delete"
                      onClick={() => {
                        onClose();
                        onDelete(book);
                      }}
                    >
                      🗑 Delete Book
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailModal;
