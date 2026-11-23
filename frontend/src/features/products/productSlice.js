/**
 * Products Redux Slice
 * Manages bookstore catalog state, fetching, creating, updating, and deleting products via REST API.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../../services/api.js';

// Async Thunk: Fetch Products (with optional category filter or search query)
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.category && params.category !== 'All') {
        queryParams.append('category', params.category);
      }
      if (params.search && params.search.trim()) {
        queryParams.append('search', params.search.trim());
      }
      const qs = queryParams.toString();
      const url = qs ? `/products?${qs}` : '/products';
      const response = await api.get(url);
      return response.data.products || [];
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Async Thunk: Create New Product (Protected by JWT)
export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (productData, { rejectWithValue }) => {
    try {
      const response = await api.post('/products', productData);
      return response.data.product;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Async Thunk: Update Existing Product (Protected by JWT)
export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data.product;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Async Thunk: Delete Product (Protected by JWT)
export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const productSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    operationLoading: false,
    operationError: null,
    operationSuccess: null,
    selectedProduct: null
  },
  reducers: {
    setSelectedProduct: (state, action) => {
      state.selectedProduct = action.payload;
    },
    clearOperationStatus: (state) => {
      state.operationLoading = false;
      state.operationError = null;
      state.operationSuccess = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.items.unshift(action.payload);
        state.operationSuccess = `Book "${action.payload.name}" created successfully!`;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.operationLoading = false;
        const index = state.items.findIndex(
          (p) => (p._id || p.id) === (action.payload._id || action.payload.id)
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (
          state.selectedProduct &&
          (state.selectedProduct._id || state.selectedProduct.id) ===
            (action.payload._id || action.payload.id)
        ) {
          state.selectedProduct = action.payload;
        }
        state.operationSuccess = `Book "${action.payload.name}" updated successfully!`;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.operationLoading = true;
        state.operationError = null;
        state.operationSuccess = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.operationLoading = false;
        state.items = state.items.filter((p) => (p._id || p.id) !== action.payload);
        if (
          state.selectedProduct &&
          (state.selectedProduct._id || state.selectedProduct.id) === action.payload
        ) {
          state.selectedProduct = null;
        }
        state.operationSuccess = 'Book deleted from catalog successfully!';
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.operationLoading = false;
        state.operationError = action.payload;
      });
  }
});

export const { setSelectedProduct, clearOperationStatus } = productSlice.actions;

export const selectAllProducts = (state) => state.products.items;
export const selectProductsLoading = (state) => state.products.loading;
export const selectProductsError = (state) => state.products.error;
export const selectProductOperationLoading = (state) => state.products.operationLoading;
export const selectProductOperationError = (state) => state.products.operationError;
export const selectProductOperationSuccess = (state) => state.products.operationSuccess;
export const selectSelectedProduct = (state) => state.products.selectedProduct;

export default productSlice.reducer;
