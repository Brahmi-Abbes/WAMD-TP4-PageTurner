// src/components/BookList.jsx
// Book catalog component connected to Express/MongoDB REST API.
// Features real-time search, category filtering, sorting, loading spinners, and network error handling.

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BookCard from './BookCard.jsx';
import {
  fetchProducts,
  selectAllProducts,
  selectProductsLoading,
  selectProductsError
} from '../features/products/productSlice.js';

const BookList = ({ onSelectBook, onEditBook, onDeleteBook }) => {
  const dispatch = useDispatch();
  const products = useSelector(selectAllProducts);
  const loading = useSelector(selectProductsLoading);
  const error = useSelector(selectProductsError);

  // Local React state for client-side search, filtering, and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');

  // Fetch products on initial mount
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Extract unique categories dynamically from MongoDB products
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Filter products by search term and category
  const filteredProducts = useMemo(() => {
    return products.filter((book) => {
      const matchesCategory =
        selectedCategory === 'All' || book.category === selectedCategory;

      const term = searchTerm.trim().toLowerCase();
      const title = (book.name || book.title || '').toLowerCase();
      const desc = (book.description || book.author || '').toLowerCase();
      const matchesSearch =
        term === '' || title.includes(term) || desc.includes(term);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Sort filtered products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;
      const titleA = a.name || a.title || '';
      const titleB = b.name || b.title || '';

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'title') return titleA.localeCompare(titleB);
      // Default: sort by newest creation
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [filteredProducts, sortBy]);

  const handleRetry = () => {
    dispatch(fetchProducts());
  };

  return (
    <section className="catalog-section">
      <div className="catalog-top-bar">
        <div className="catalog-heading-wrap">
          <h2 className="catalog-heading">Find your next read.</h2>
          <span className="catalog-counter">
            {products.length} {products.length === 1 ? 'book' : 'books'} in catalog
          </span>
        </div>

        {/* Filter and search controls */}
        <div className="catalog-controls">
          <input
            type="text"
            placeholder="Search title, author or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Search books"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
            aria-label="Filter by category"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
            aria-label="Sort books"
          >
            <option value="featured">Featured / Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title">Title: A–Z</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && products.length === 0 && (
        <div className="catalog-status-box">
          <div className="spinner" />
          <p className="loading-text">Loading PageTurner catalog from MongoDB...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="catalog-status-box error-box">
          <p className="error-text">⚠️ {error}</p>
          <button
            type="button"
            className="btn-retry"
            onClick={handleRetry}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty Catalog State */}
      {!loading && !error && sortedProducts.length === 0 && (
        <div className="empty-catalog">
          <p className="no-books">
            {products.length === 0
              ? 'No books are currently in the database catalog.'
              : 'No books match your search or filter selection.'}
          </p>
          {products.length > 0 && (
            <button
              type="button"
              className="btn-reset-filters"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSortBy('featured');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Products Grid */}
      {!loading && sortedProducts.length > 0 && (
        <div className="books-grid">
          {sortedProducts.map((book) => (
            <BookCard
              key={book._id || book.id}
              book={book}
              onSelect={onSelectBook}
              onEdit={onEditBook}
              onDelete={onDeleteBook}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default BookList;
