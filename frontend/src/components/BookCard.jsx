// src/components/BookCard.jsx
// Reusable book card component displaying individual book data passed via props.
// Supports Add to Cart, View Details, and Authenticated Edit / Delete actions.

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../features/cart/cartSlice.js';
import { selectIsAuthenticated } from '../features/auth/authSlice.js';

// Unobtrusive SVG fallback if external book cover fails to load
const FALLBACK_COVER =
  'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="260" viewBox="0 0 200 260"><rect width="200" height="260" fill="%23efebe3"/><text x="100" y="135" fill="%239a9388" font-family="sans-serif" font-size="13" text-anchor="middle">No cover</text></svg>';

const BookCard = ({ book, onSelect, onEdit, onDelete }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [justAdded, setJustAdded] = useState(false);

  const title = book.name || book.title || 'Untitled Book';
  const authorOrDesc = book.description || book.author || 'No description available';
  const coverUrl = book.imageUrl || book.cover || '';
  const price = Number(book.price) || 0;
  const stock = book.stock !== undefined ? book.stock : null;
  const isOutOfStock = stock !== null && stock <= 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    dispatch(addToCart(book));
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 700);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(book);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(book);
  };

  return (
    <article
      className="book-card"
      onClick={() => onSelect && onSelect(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect && onSelect(book);
      }}
      aria-label={`View details for ${title}`}
    >
      <div className="book-cover-container">
        <img
          src={coverUrl}
          alt={title}
          className="book-cover"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_COVER;
          }}
        />
        {stock !== null && (
          <span
            className={`card-stock-pill ${
              isOutOfStock ? 'pill-out' : 'pill-in'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : `${stock} left`}
          </span>
        )}
      </div>

      <div className="book-info">
        <div className="book-info-top">
          <span className="book-category">{book.category}</span>
          <h3 className="book-title">{title}</h3>
          <p className="book-author" title={authorOrDesc}>
            {authorOrDesc}
          </p>
        </div>

        <div className="book-card-bottom">
          <div className="book-footer">
            <span className="book-price">{price.toLocaleString()} DA</span>
            <button
              type="button"
              className={`btn-add ${justAdded ? 'btn-added' : ''}`}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={`Add ${title} to cart`}
            >
              {isOutOfStock
                ? 'Out of Stock'
                : justAdded
                ? 'Added ✓'
                : 'Add to Cart'}
            </button>
          </div>

          {isAuthenticated && (
            <div className="card-manage-bar" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn-card-edit"
                onClick={handleEditClick}
                title="Edit book details"
              >
                ✎ Edit
              </button>
              <button
                type="button"
                className="btn-card-delete"
                onClick={handleDeleteClick}
                title="Delete book from MongoDB catalog"
              >
                🗑 Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default BookCard;
