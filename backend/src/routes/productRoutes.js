/**
 * Product Routes
 * Defines public catalog browsing and protected management endpoints.
 */
const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const authMiddleware = require('../middleware/authMiddleware');

// Public routes: Anyone can browse the bookstore catalog
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected routes: Only authenticated users with a valid JWT can modify catalog
router.post('/', authMiddleware, createProduct);
router.put('/:id', authMiddleware, updateProduct);
router.delete('/:id', authMiddleware, deleteProduct);

module.exports = router;
