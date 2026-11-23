// src/App.jsx
// Main application layout and coordinator for PageTurner Full-Stack E-Commerce.

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from './components/Header.jsx';
import BookList from './components/BookList.jsx';
import Cart from './components/Cart.jsx';
import AuthModal from './components/AuthModal.jsx';
import ProductFormModal from './components/ProductFormModal.jsx';
import BookDetailModal from './components/BookDetailModal.jsx';

import {
  fetchCurrentUser,
  selectIsAuthenticated,
  selectAuthToken
} from './features/auth/authSlice.js';
import {
  deleteProduct,
  selectProductOperationSuccess,
  selectProductOperationError,
  clearOperationStatus
} from './features/products/productSlice.js';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const token = useSelector(selectAuthToken);
  const operationSuccess = useSelector(selectProductOperationSuccess);
  const operationError = useSelector(selectProductOperationError);

  // Modal dialog states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [deleteConfirmBook, setDeleteConfirmBook] = useState(null);

  // Restore authenticated session from localStorage on page refresh
  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token]);

  // Auto-clear success messages after 4 seconds
  useEffect(() => {
    if (operationSuccess) {
      const timer = setTimeout(() => {
        dispatch(clearOperationStatus());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [operationSuccess, dispatch]);

  const handleOpenAddProduct = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setProductToEdit(null);
    setProductModalOpen(true);
  };

  const handleOpenEdit = (book) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setProductToEdit(book);
    setProductModalOpen(true);
  };

  const handlePromptDelete = (book) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setDeleteConfirmBook(book);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmBook) return;
    const id = deleteConfirmBook._id || deleteConfirmBook.id;
    await dispatch(deleteProduct(id));
    setDeleteConfirmBook(null);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setDetailModalOpen(true);
  };

  return (
    <div className="app">
      <Header
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAddProduct={handleOpenAddProduct}
      />

      {/* Global Toast / Notification Bar */}
      {operationSuccess && (
        <div className="global-toast toast-success">
          <div className="container toast-container">
            <span>✓ {operationSuccess}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dispatch(clearOperationStatus())}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {operationError && (
        <div className="global-toast toast-error">
          <div className="container toast-container">
            <span>⚠️ {operationError}</span>
            <button
              type="button"
              className="toast-close"
              onClick={() => dispatch(clearOperationStatus())}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className="container main-layout">
        <div className="catalog-area">
          <BookList
            onSelectBook={handleSelectBook}
            onEditBook={handleOpenEdit}
            onDeleteBook={handlePromptDelete}
          />
        </div>

        <div className="cart-area">
          <Cart />
        </div>
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {/* Book Details View Modal */}
      <BookDetailModal
        book={selectedBook}
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedBook(null);
        }}
        onEdit={handleOpenEdit}
        onDelete={handlePromptDelete}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmBook && (
        <div
          className="modal-backdrop"
          onClick={() => setDeleteConfirmBook(null)}
        >
          <div
            className="modal-card confirm-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteConfirmBook(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong>
                  "{deleteConfirmBook.name || deleteConfirmBook.title}"
                </strong>{' '}
                from the bookstore catalog?
              </p>
              <p className="confirm-subtext">
                This action requires your JWT credentials and will delete the document in MongoDB.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setDeleteConfirmBook(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
              >
                Delete Book
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div className="container footer-container">
          <p>
            <strong>PageTurner Bookstore</strong> — Full-Stack E-Commerce Integration (WAMD TD-TP 4)
          </p>
          <p className="footer-subtext">
            Higher National School of Advanced Technologies (ENSTA) • Author: Brahmi Abbes (AI1)
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
