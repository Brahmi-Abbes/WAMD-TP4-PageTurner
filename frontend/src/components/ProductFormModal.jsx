/**
 * ProductFormModal Component
 * Handles creating a new book or editing an existing book in MongoDB through Express API.
 */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createProduct,
  updateProduct,
  selectProductOperationLoading,
  selectProductOperationError,
  clearOperationStatus
} from '../features/products/productSlice.js';

const STANDARD_CATEGORIES = [
  'Fiction',
  'Classic',
  'Computer Science',
  'Technology',
  'Sci-Fi',
  'Non-Fiction',
  'Mystery',
  'Biography',
  'Literature',
  'Manga',
  'Philosophy',
  'Self-Improvement'
];

const ProductFormModal = ({ isOpen, onClose, productToEdit }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectProductOperationLoading);
  const error = useSelector(selectProductOperationError);

  const isEditing = Boolean(productToEdit);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(STANDARD_CATEGORIES[0]);
  const [stock, setStock] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  // Populate form fields if editing
  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || productToEdit.title || '');
      setDescription(productToEdit.description || productToEdit.author || '');
      setPrice(String(productToEdit.price || ''));
      setCategory(productToEdit.category || STANDARD_CATEGORIES[0]);
      setStock(String(productToEdit.stock !== undefined ? productToEdit.stock : 10));
      setImageUrl(productToEdit.imageUrl || productToEdit.cover || '');
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategory(STANDARD_CATEGORIES[0]);
      setStock('10');
      setImageUrl('');
    }
    setValidationError('');
    dispatch(clearOperationStatus());
  }, [productToEdit, isOpen, dispatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    // Client-side validations matching backend constraints
    if (!name.trim()) {
      setValidationError('Book title/name is required.');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      setValidationError('Description must be at least 5 characters long.');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setValidationError('Price must be a valid non-negative number.');
      return;
    }

    const numStock = Number(stock);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      setValidationError('Stock must be a non-negative whole integer.');
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: numPrice,
      category: category.trim(),
      stock: numStock,
      imageUrl: imageUrl.trim() || undefined
    };

    let result;
    if (isEditing) {
      const id = productToEdit._id || productToEdit.id;
      result = await dispatch(updateProduct({ id, productData: payload }));
    } else {
      result = await dispatch(createProduct(payload));
    }

    if ((isEditing ? updateProduct : createProduct).fulfilled.match(result)) {
      onClose();
    }
  };

  const handleClose = () => {
    dispatch(clearOperationStatus());
    setValidationError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-card product-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-title"
      >
        <div className="modal-header">
          <h3 id="product-form-title" className="modal-title">
            {isEditing ? 'Edit Book' : 'Add New Book to Catalog'}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="product-form">
          <div className="modal-body">
            {(validationError || error) && (
              <div className="alert alert-error">
                {validationError || error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="prod-name">Title / Book Name *</label>
              <input
                id="prod-name"
                type="text"
                className="form-input"
                placeholder="e.g. Clean Architecture"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="prod-category">Category *</label>
                <select
                  id="prod-category"
                  className="form-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {STANDARD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="prod-price">Price (DA) *</label>
                <input
                  id="prod-price"
                  type="number"
                  min="0"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 2500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="prod-stock">Stock Count *</label>
                <input
                  id="prod-stock"
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 15"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prod-image">Cover Image URL (optional)</label>
                <input
                  id="prod-image"
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prod-desc">Description / Synopsis (min 5 chars) *</label>
              <textarea
                id="prod-desc"
                rows="3"
                className="form-input form-textarea"
                placeholder="Author, summary, and key themes of the book..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading
                ? isEditing
                  ? 'Saving changes...'
                  : 'Adding book...'
                : isEditing
                ? 'Save Changes'
                : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
