/**
 * Authentication Redux Slice
 * Manages user authentication state, JWT tokens, login, registration, and session persistence.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { getErrorMessage } from '../../services/api.js';

// Safe localStorage access helpers
const getStoredToken = () => {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem('pageturner_token') || null;
  } catch {
    return null;
  }
};

const getStoredUser = () => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('pageturner_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setStoredAuth = (token, user) => {
  if (typeof localStorage === 'undefined') return;
  try {
    if (token) localStorage.setItem('pageturner_token', token);
    else localStorage.removeItem('pageturner_token');

    if (user) localStorage.setItem('pageturner_user', JSON.stringify(user));
    else localStorage.removeItem('pageturner_user');
  } catch {
    // ignore storage quota / access issues
  }
};

// Async Thunk: Register User
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Async Thunk: Login User
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      setStoredAuth(token, user);
      return { token, user };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Async Thunk: Check and refresh current authenticated profile
export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      const currentToken = getStoredToken();
      setStoredAuth(currentToken, user);
      return user;
    } catch (error) {
      setStoredAuth(null, null);
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialToken = getStoredToken();
const initialUser = getStoredUser();

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: initialToken,
    user: initialUser,
    isAuthenticated: Boolean(initialToken),
    loading: false,
    error: null,
    registerSuccess: false
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.registerSuccess = false;
      setStoredAuth(null, null);
    },
    clearAuthError: (state) => {
      state.error = null;
    },
    clearRegisterSuccess: (state) => {
      state.registerSuccess = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.registerSuccess = false;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.registerSuccess = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.registerSuccess = false;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchCurrentUser
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      });
  }
});

export const { logout, clearAuthError, clearRegisterSuccess } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectRegisterSuccess = (state) => state.auth.registerSuccess;

export default authSlice.reducer;
